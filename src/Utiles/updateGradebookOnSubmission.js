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
import CourseSch from "../Models/courses.model.sch.js";

/**
 * FAST UPDATE — Only updates the specific assessment/discussion that changed,
 * then recalculates ONLY its quarter + semester + final grade.
 */

const getLetterGrade = async (gradingScale, percentage, districtId) => {
  try {
    // Make sure to await the promise returned by find() method
    const match = await GradingScale.findOne({
      districtId,
      scale: {
        $elemMatch: {
          min: { $lte: percentage },
          max: { $gte: percentage }
        }
      }
    });

    return match ? match.scale[0].grade : "N/A";
  } catch (error) {
    console.error("Error getting letter grade:", error);
    return "N/A";
  }
};

const percentageToGPA = async (percentage, districtId ) => {
  try {
    // 1️⃣ Fetch GPA scale from DB
    const gpaDoc = await GPA.findOne({ districtId });
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

const getStandardPoints = async (courseId, percentage, districtId) => {
  try {
    const standardGrading = await StandardGrading.findOne({
      districtId,
      isDeleted: false
    });

    if (!standardGrading || !standardGrading.scale || standardGrading.scale.length === 0) {
      console.error("Standard grading scale not found in the database.");
      return 0.0;
    }

    const match = standardGrading.scale.find(scale =>
      percentage >= scale.minPercentage && percentage <= scale.maxPercentage
    );

    return match ? scale.points : 0.0;
  } catch (error) {
    console.error("Error getting standard points:", error);
    return 0.0;
  }
};

const getStandardRemarks = async (courseId, percentage, districtId) => {
  try {
    const standardGrading = await StandardGrading.findOne({
      districtId,
      isDeleted: false
    });

    if (!standardGrading || !standardGrading.scale || standardGrading.scale.length === 0) {
      console.error("Standard grading scale not found in the database.");
      return "N/A";
    }

    const match = standardGrading.scale.find(scale =>
      percentage >= scale.minPercentage && percentage <= scale.maxPercentage
    );

    return match ? scale.remarks : "N/A";
  } catch (error) {
    console.error("Error getting standard remarks:", error);
    return "N/A";
  }
};

export async function updateGradebookOnSubmission(studentId, courseId, itemId, type, districtId, schoolId) {
  try {
    // 1️⃣ Fetch course & grading system
    const course = await CourseSch.findOne({ _id: courseId, districtId, schoolId }).lean();
    const gradingSystem = course?.gradingSystem || "normalGrading";

    // 2️⃣ Fetch or create gradebook
    let gradebook = await Gradebook.findOne({ studentId, courseId });

    if (!gradebook) {
      gradebook = new Gradebook({
        studentId,
        courseId,
        semesters: [],
        courseItems: [],
        finalPercentage: 0,
        finalGPA: 0,
        finalLetterGrade: "N/A",
        finalRemarks: "N/A",
      });
    }

    // 3️⃣ Load assessment/discussion item
    let item, studentPoints, maxPoints;

    if (type === "assessment") {
      item = await Assessment.findById(itemId)
        .populate("semester quarter category")
        .lean();

      if (!item) return false;

      // 🟢 CHANGE: Fetch the BEST graded submission (Highest Score)
      const submission = await Submission.findOne({
        studentId,
        assessment: itemId,
        graded: true,
        districtId,
        schoolId
      })
        .sort({ createdAt: -1 }) // 👈 This ensures the NEWEST attempt is used, regardless of score
        .lean();

      if (!submission) return false;

      studentPoints = Number(submission.totalScore) || 0;
      maxPoints = item.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

    } else if (type === "discussion") {
      item = await Discussion.findById(itemId)
        .populate("semester quarter category")
        .lean();

      if (!item) return false;

      const comment = await DiscussionComment.findOne({
        createdby: studentId,
        discussion: itemId,
        isGraded: true,
        districtId,
        schoolId
      }).sort({ createdAt: -1 }).lean();

      if (!comment) return false;

      studentPoints = Number(comment.marksObtained) || 0;
      maxPoints = Number(item.totalMarks) || 0;

    } else {
      return false;
    }

    // 4️⃣ Prepare item object
    const isCourseBased = !item.semester && !item.quarter;
    const newItem = {
      itemId,
      itemType: type,
      title: type === "assessment" ? item.title : item.topic,
      categoryId: item.category?._id || item.category,
      categoryName: item.category?.name || "Unknown Category",
      studentPoints,
      maxPoints,
    };

    const categories = await AssessmentCategory.find({ course: courseId, districtId, schoolId }).lean();

    // ================================================================
    // #######################  COURSE-BASED ##########################
    // ================================================================
    if (isCourseBased) {
      console.log("PROCESSING COURSE-BASED GRADEBOOK");

      // Replace old version of this item with the new high score
      gradebook.courseItems = [
        ...gradebook.courseItems.filter((i) => i.itemId.toString() !== itemId.toString()),
        newItem,
      ];

      let finalPerc = 0;
      const active = categories
        .map((cat) => ({
          category: cat,
          items: gradebook.courseItems.filter(
            (i) => i.categoryId.toString() === cat._id.toString()
          ),
        }))
        .filter((x) => x.items.length > 0);

      if (active.length > 0) {
        const totalWeight = active.reduce((sum, c) => sum + (c.category.weight || 0), 0);
        active.forEach(({ category, items }) => {
          let earned = 0, total = 0;
          items.forEach((i) => {
            earned += Number(i.studentPoints) || 0;
            total += Number(i.maxPoints) || 0;
          });
          const percent = total > 0 ? (earned / total) * 100 : 0;
          finalPerc += (percent * (category.weight || 0)) / totalWeight;
        });
      }

      gradebook.finalPercentage = Number(finalPerc.toFixed(2)) || 0;

      // Update Letters/GPA
      if (gradingSystem === "normalGrading") {
        gradebook.finalLetterGrade = await getLetterGrade(courseId, gradebook.finalPercentage, districtId, schoolId);
      } else {
        gradebook.finalGPA = await getStandardPoints(courseId, gradebook.finalPercentage, districtId, schoolId);
        gradebook.finalRemarks = await getStandardRemarks(courseId, gradebook.finalPercentage, districtId, schoolId);
      }

      gradebook.markModified('courseItems');
      gradebook.markModified('finalPercentage');
      await gradebook.save();
      return true;
    }

    // ================================================================
    // #################### SEMESTER-BASED GRADEBOOK ##################
    // ================================================================
    const semesterId = item.semester._id.toString();
    const quarterId = item.quarter._id.toString();

    // Find/Create Semester
    let semIndex = gradebook.semesters.findIndex((s) => s.semesterId.toString() === semesterId);
    if (semIndex === -1) {
      const semDoc = await Semester.findOne({ _id: semesterId, districtId }).lean();
      gradebook.semesters.push({
        semesterId,
        semesterTitle: semDoc?.title || "Unknown Semester",
        quarters: [],
        gradePercentage: 0,
      });
      semIndex = gradebook.semesters.length - 1;
    }

    const semesterBlock = gradebook.semesters[semIndex];

    // Find/Create Quarter
    let qIndex = semesterBlock.quarters.findIndex((q) => q.quarterId.toString() === quarterId);
    if (qIndex === -1) {
      const quarterDoc = await Quarter.findOne({ _id: quarterId, districtId }).lean();
      semesterBlock.quarters.push({
        quarterId,
        quarterTitle: quarterDoc?.title || "Unknown Quarter",
        items: [],
        gradePercentage: 0,
      });
      qIndex = semesterBlock.quarters.length - 1;
    }

    const quarterBlock = semesterBlock.quarters[qIndex];

    // UPSERT ITEM with new score
    quarterBlock.items = [
      ...quarterBlock.items.filter((i) => i.itemId.toString() !== itemId.toString()),
      newItem,
    ];

    // ---------- Quarter Calculation ----------
    let quarterPerc = 0;
    const activeQuarter = categories
      .map((cat) => ({
        category: cat,
        items: quarterBlock.items.filter((i) => i.categoryId.toString() === cat._id.toString()),
      }))
      .filter((x) => x.items.length > 0);

    if (activeQuarter.length > 0) {
      const totalWeight = activeQuarter.reduce((sum, c) => sum + (c.category.weight || 0), 0);
      activeQuarter.forEach(({ category, items }) => {
        let earned = 0, total = 0;
        items.forEach((i) => {
          earned += Number(i.studentPoints) || 0;
          total += Number(i.maxPoints) || 0;
        });
        const percent = total > 0 ? (earned / total) * 100 : 0;
        quarterPerc += (percent * (category.weight || 0)) / totalWeight;
      });
    }

    quarterBlock.gradePercentage = Number(quarterPerc.toFixed(2));

    // ---------- Semester Calculation ----------
    const semAvg = semesterBlock.quarters.reduce((sum, q) => sum + q.gradePercentage, 0) / semesterBlock.quarters.length;
    semesterBlock.gradePercentage = Number(semAvg.toFixed(2));

    // ---------- Final Course Percentage ----------
    const finalAvg = gradebook.semesters.reduce((sum, s) => sum + s.gradePercentage, 0) / gradebook.semesters.length;
    gradebook.finalPercentage = Number(finalAvg.toFixed(2));

    // ---------- Update Final Grades/GPA ----------
    if (gradingSystem === "normalGrading") {
      gradebook.finalLetterGrade = await getLetterGrade(courseId, gradebook.finalPercentage, districtId);
      quarterBlock.letterGrade = await getLetterGrade(courseId, quarterPerc, districtId);
      semesterBlock.letterGrade = await getLetterGrade(courseId, semesterBlock.gradePercentage, districtId);
    } else {
      gradebook.finalGPA = await getStandardPoints(courseId, gradebook.finalPercentage, districtId);
      gradebook.finalRemarks = await getStandardRemarks(courseId, gradebook.finalPercentage, districtId);
      quarterBlock.gpa = await getStandardPoints(courseId, quarterPerc, districtId);
      semesterBlock.gpa = await getStandardPoints(courseId, semesterBlock.gradePercentage, districtId);
    }

    // 🟢 CRITICAL: Force Mongoose to save nested changes
    gradebook.markModified('semesters');
    gradebook.markModified('finalPercentage');

    await gradebook.save();
    console.log("=== GRADEBOOK UPDATED SUCCESSFULLY ===");
    return true;

  } catch (err) {
    console.error("GRADEBOOK UPDATE ERROR:", err);
    return false;
  }
}

