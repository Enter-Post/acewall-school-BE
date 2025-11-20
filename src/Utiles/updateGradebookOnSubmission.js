import Assessment from "../Models/Assessment.model.js";
import Discussion from "../Models/discussion.model.js";
import Semester from "../Models/semester.model.js";
import Quarter from "../Models/quarter.model.js";
import DiscussionComment from "../Models/discussionComment.model.js";
import Gradebook from "../Models/Gradebook.model.js";
import AssessmentCategory from "../Models/assessment-category.js";
import Submission from "../Models/submission.model.js";
import StandardGrading from "../Models/StandardGrading.model.js";
import GradingScale from "../Models/grading-scale.model.js";
import GPA from "../Models/GPA.model.js";

/**
 * FAST UPDATE — Only updates the specific assessment/discussion that changed,
 * then recalculates ONLY its quarter + semester + final grade.
 */

const getLetterGrade = async (gradingScale, percentage) => {
  try {
    // Make sure to await the promise returned by find() method
    const match = await GradingScale.find({
      min: { $lte: percentage },
      max: { $gte: percentage }
    });

    return match.length > 0 ? match[0].grade : "N/A";
  } catch (error) {
    console.error("Error getting letter grade:", error);
    return "N/A";
  }
};

const percentageToGPA = async (percentage) => {
  try {
    // 1️⃣ Fetch GPA scale from DB (assuming only one GPA scale document)
    const gpaDoc = await GPA.findOne();
    if (!gpaDoc || !gpaDoc.gpaScale || gpaDoc.gpaScale.length === 0) {
      console.error("GPA scale not found in the database.");
      return 0.0;
    }

    // 2️⃣ Find matching GPA range
    const match = gpaDoc.gpaScale.find(scale =>
      percentage >= scale.minPercentage && percentage <= scale.maxPercentage
    );

    return match ? match.gpa : 0.0;
  } catch (error) {
    console.error("Error converting percentage to GPA:", error);
    return 0.0;
  }
};

export async function updateGradebookOnSubmission(studentId, courseId, itemId, type) {
  console.log("=== GRADEBOOK UPDATE STARTED ===");

  try {
    // 1) Fetch or create gradebook
    let gradebook = await Gradebook.findOne({ studentId, courseId });

    if (!gradebook) {
      gradebook = new Gradebook({
        studentId,
        courseId,
        semesters: [],
        finalPercentage: 0,
        finalGPA: 0,
        finalLetterGrade: "N/A",
      });
    }

    // 2) Load standard scale
    const standardScaleDoc = await StandardGrading.findOne().lean();
    const standardScale = standardScaleDoc?.scale || [];

    // 3) Load changed item
    let item, studentPoints, maxPoints;

    if (type === "assessment") {
      item = await Assessment.findById(itemId)
        .populate("semester quarter category")
        .lean();

      if (!item || !item.semester || !item.quarter) return false;

      const submission = await Submission.findOne({
        studentId,
        assessment: itemId,
      });

      if (!submission || !submission.graded) return false;

      studentPoints = submission.totalScore || 0;
      maxPoints = item.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    } else if (type === "discussion") {
      item = await Discussion.findById(itemId)
        .populate("semester quarter category")
        .lean();

      if (!item || !item.semester || !item.quarter) return false;

      const comment = await DiscussionComment.findOne({
        createdby: studentId,
        discussion: itemId,
      });

      if (!comment || !comment.isGraded) return false;

      studentPoints = comment.marksObtained || 0;
      maxPoints = item.totalMarks || 0;

    } else {
      return false;
    }

    const semesterId = item.semester._id.toString();
    const quarterId = item.quarter._id.toString();

    // 4) Ensure semester block
    let semesterBlock = gradebook.semesters.find(
      (s) => s.semesterId.toString() === semesterId
    );

    if (!semesterBlock) {
      const semDoc = await Semester.findById(semesterId).lean();

      semesterBlock = {
        semesterId,
        semesterTitle: semDoc?.title || "Unknown Semester",
        quarters: [],
        gradePercentage: 0,
        letterGrade: "N/A",
      };

      gradebook.semesters.push(semesterBlock);
    }

    // 5) Ensure quarter block
    let quarterBlock = semesterBlock.quarters.find(
      (q) => q.quarterId.toString() === quarterId
    );

    if (!quarterBlock) {
      const quarterDoc = await Quarter.findById(quarterId).lean();

      quarterBlock = {
        quarterId,
        quarterTitle: quarterDoc?.title || "Unknown Quarter",
        items: [],
        gradePercentage: 0,
        letterGrade: "N/A",
        gpa: 0,
      };

      semesterBlock.quarters.push(quarterBlock);
    }

    // 6) UPSERT this item (mutation-safe!)
    const newItem = {
      itemId,
      itemType: type,
      title: type === "assessment" ? item.title : item.topic,
      categoryId: item.category?._id || item.category,
      categoryName: item.category?.name || "Unknown Category",
      studentPoints,
      maxPoints,
    };

    quarterBlock.items = [
      ...quarterBlock.items.filter((i) => i.itemId.toString() !== itemId.toString()),
      newItem,
    ];

    // 7) Recalculate Quarter Grade
    const categories = await AssessmentCategory.find({ course: courseId }).lean();
    let quarterPerc = 0;

    const active = categories
      .map((cat) => ({
        category: cat,
        items: quarterBlock.items.filter(
          (i) => i.categoryId.toString() === cat._id.toString()
        ),
      }))
      .filter((x) => x.items.length > 0);

    if (active.length > 0) {
      const totalWeight = active.reduce(
        (sum, c) => sum + (c.category.weight || 0),
        0
      );

      active.forEach(({ category, items }) => {
        let earned = 0,
          total = 0;

        items.forEach((i) => {
          earned += i.studentPoints || 0;
          total += i.maxPoints || 0;
        });

        const percent = total > 0 ? (earned / total) * 100 : 0;
        quarterPerc += (percent * category.weight) / totalWeight;
      });
    }

    quarterPerc = Number(quarterPerc.toFixed(2)) || 0;

    quarterBlock.gradePercentage = quarterPerc;
    quarterBlock.gpa = await percentageToGPA(quarterPerc);
    quarterBlock.letterGrade = await getLetterGrade(standardScale, quarterPerc);

    // 8) Recalculate Semester Grade
    semesterBlock.quarters = semesterBlock.quarters.map((q) =>
      q.quarterId.toString() === quarterId ? quarterBlock : q
    );

    let semPerc = 0;

    if (semesterBlock.quarters.length > 0) {
      const total = semesterBlock.quarters.reduce(
        (sum, q) => sum + (q.gradePercentage || 0),
        0
      );
      semPerc = total / semesterBlock.quarters.length;
    }

    semPerc = Number(semPerc.toFixed(2)) || 0;

    semesterBlock.gradePercentage = semPerc;
    semesterBlock.letterGrade = await getLetterGrade(standardScale, semPerc);

    // Update semester array
    gradebook.semesters = gradebook.semesters.map((s) =>
      s.semesterId.toString() === semesterId ? semesterBlock : s
    );

    // 9) FINAL GRADE (NaN-proof)
    let finalPerc = 0;

    if (gradebook.semesters.length > 0) {
      const total = gradebook.semesters.reduce(
        (sum, s) => sum + (s.gradePercentage || 0),
        0
      );
      finalPerc = total / gradebook.semesters.length;
    }

    finalPerc = Number(finalPerc.toFixed(2)) || 0;

    gradebook.finalPercentage = finalPerc;
    gradebook.finalGPA = await percentageToGPA(finalPerc);
    gradebook.finalLetterGrade = await getLetterGrade(standardScale, finalPerc);

    // 10) Save
    gradebook.markModified("semesters");
    await gradebook.save();

    console.log("=== GRADEBOOK UPDATE COMPLETE ===");
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

