import AssessmentCategory from "../Models/assessment-category.js";
import Assessment from "../Models/Assessment.model.js";
import Submission from "../Models/submission.model.js";
import Enrollment from "../Models/Enrollement.model.js";
import CourseSch from "../Models/courses.model.sch.js"; // Assuming CourseSch is exported as Course
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import GradingScale from "../Models/grading-scale.model.js";
import { type } from "os";
import Semester from "../Models/semester.model.js";
import Quarter from "../Models/quarter.model.js";
import DiscussionComment from "../Models/discussionComment.model.js";
import Discussion from "../Models/discussion.model.js";
import GPA from "../Models/GPA.model.js";

const getLetterGrade = async (percentage, districtId, schoolId) => {
  const gpaDoc = await GradingScale.findOne({ districtId, schoolId });
  if (!gpaDoc || !gpaDoc.gpaScale || gpaDoc.gpaScale.length === 0) {
    throw new Error("Grading scale not found in the database.");
  }
  const match = gpaDoc.gpaScale.find(
    (range) => percentage >= range.minPercentage && percentage <= range.maxPercentage
  );

  return match ? match.gpa : "N/A";
};

// const percentageToGPA = (percentage) => {
//   if (percentage >= 90) return 4.0;
//   if (percentage >= 80) return 3.5;
//   if (percentage >= 70) return 3.0;
//   if (percentage >= 60) return 2.5;
//   if (percentage >= 50) return 2.0;
//   if (percentage >= 40) return 1.5;
//   return 0.0;
// };

const percentageToGPA = async (percentage, districtId, schoolId) => {
  // 1️⃣ Fetch GPA scale from DB
  const gpaDoc = await GPA.findOne({ districtId, schoolId });
  if (!gpaDoc || !gpaDoc.gpaScale || gpaDoc.gpaScale.length === 0) {
    throw new Error("GPA scale not found in the database.");
  }

  // 2️⃣ Find matching GPA range
  const match = gpaDoc.gpaScale.find(scale =>
    percentage >= scale.minPercentage && percentage <= scale.maxPercentage
  );

  return match ? match.gpa : 0.0;
};


export const getStudentGradebook = async (req, res) => {
  const { courseId, studentId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { districtId, schoolId } = req.user;

  try {
    const student = await User.findOne({ _id: studentId, districtId, schoolId }).lean();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch grading scale
    const gradingScaleDoc = await GradingScale.findOne({ districtId, schoolId }).lean();
    const gradingScale = gradingScaleDoc?.scale || [];

    // Categories for the course
    const categories = await AssessmentCategory.find({ course: courseId, districtId, schoolId });
    const course = await CourseSch.findOne({ _id: courseId, districtId, schoolId })
      .lean()
      .select("courseTitle courseDescription thumbnail");

    // Fetch student's GRADED submissions only
    const submissionDocs = await Submission.find({
      studentId,
      graded: true, // Only include graded submissions
      districtId,
      schoolId
    }).lean();

    const submissionMap = new Map();
    const gradedAssessmentIds = [];
    submissionDocs.forEach(sub => {
      submissionMap.set(sub.assessment.toString(), sub);
      gradedAssessmentIds.push(sub.assessment);
    });

    // Fetch student's graded discussion comments
    const discussionComments = await DiscussionComment.find({
      createdby: studentId,
      isGraded: true,
      districtId,
      schoolId,
    }).lean();

    const discussionCommentMap = new Map();
    const gradedDiscussionIds = [];
    discussionComments.forEach(dc => {
      discussionCommentMap.set(dc.discussion.toString(), dc);
      gradedDiscussionIds.push(dc.discussion);
    });

    // Fetch only assessments that have GRADED submissions for this course
    const gradedAssessments = await Assessment.find({
      course: courseId,
      _id: { $in: gradedAssessmentIds },
      districtId,
      schoolId
    })
      .populate("category semester quarter")
      .lean();

    // Fetch only discussions that have graded comments for this course
    const gradedDiscussions = await Discussion.find({
      course: courseId,
      _id: { $in: gradedDiscussionIds },
      districtId,
      schoolId,
    })
      .populate("category semester quarter")
      .lean();

    // Combine only graded items
    const allGradedItems = [...gradedAssessments, ...gradedDiscussions];
    const totalAssessments = allGradedItems.length;
    const totalPages = Math.ceil(totalAssessments / limit);
    const paginatedItems = allGradedItems.slice((page - 1) * limit, page * limit);

    // Group data by semester → quarter
    const groupedBySemesterQuarter = {};

    for (const item of paginatedItems) {
      const semesterId = item.semester?._id?.toString() || "unknown-semester";
      const quarterId = item.quarter?._id?.toString() || "unknown-quarter";

      if (!groupedBySemesterQuarter[semesterId]) {
        groupedBySemesterQuarter[semesterId] = { semesterId, quarters: {} };
      }
      if (!groupedBySemesterQuarter[semesterId].quarters[quarterId]) {
        groupedBySemesterQuarter[semesterId].quarters[quarterId] = {
          quarterId,
          assessments: [],
        };
      }

      let studentScore = 0;
      let maxPoints = 0;
      let isDiscussion = false;
      let title = "";

      if (item.questions) {
        // Assessment - we know graded submission exists because we filtered for it
        const submission = submissionMap.get(item._id.toString());
        studentScore = submission.totalScore || 0;
        maxPoints = item.questions.reduce((sum, q) => sum + q.points, 0);
        title = item.title;
      } else if (item.totalMarks) {
        // Discussion - we know graded comment exists because we filtered for it
        const comment = discussionCommentMap.get(item._id.toString());
        studentScore = comment.marksObtained || 0;
        maxPoints = item.totalMarks;
        title = item.topic;
        isDiscussion = true;
      }

      groupedBySemesterQuarter[semesterId].quarters[quarterId].assessments.push({
        assessmentId: item._id,
        assessmentTitle: title,
        categoryId: item.category?._id?.toString() || item.category?.toString(),
        categoryName: item.category?.name || "Unknown Category",
        maxPoints,
        studentPoints: studentScore,
        isDiscussion,
      });
    }

    // Calculate grades per quarter and semester
    let finalScoreSum = 0;
    let totalQuartersCount = 0;

    for (const semesterId of Object.keys(groupedBySemesterQuarter)) {
      const semesterData = groupedBySemesterQuarter[semesterId];
      for (const quarterId of Object.keys(semesterData.quarters)) {
        const quarterData = semesterData.quarters[quarterId];
        const quarterItems = quarterData.assessments;

        // Filter active categories in this quarter
        const activeCategories = categories
          .map(cat => {
            const itemsInCategory = quarterItems.filter(
              i => i.categoryId === cat._id.toString()
            );
            return { category: cat, itemsInCategory };
          })
          .filter(entry => entry.itemsInCategory.length > 0);

        const totalWeight = activeCategories.reduce(
          (sum, entry) => sum + entry.category.weight,
          0
        );

        let quarterWeightedScore = 0;
        for (const { category, itemsInCategory } of activeCategories) {
          let catScore = 0;
          let catMax = 0;
          for (const item of itemsInCategory) {
            catScore += item.studentPoints;
            catMax += item.maxPoints;
          }
          const percentage = catMax > 0 ? (catScore / catMax) * 100 : 0;
          const normalizedWeight = (category.weight / totalWeight) * 100;
          quarterWeightedScore += (percentage * normalizedWeight) / 100;
        }

        const finalQuarterGrade = parseFloat(quarterWeightedScore.toFixed(2));
        quarterData.grade = finalQuarterGrade;
        quarterData.gpa = await percentageToGPA(finalQuarterGrade, districtId, schoolId); // DB GPA lookup
        quarterData.letterGrade = getLetterGrade(gradingScale, finalQuarterGrade, districtId, schoolId);

        finalScoreSum += finalQuarterGrade;
        totalQuartersCount++;
      }
    }

    // Average across quarters
    const finalCoursePercentage =
      totalQuartersCount > 0
        ? parseFloat((finalScoreSum / totalQuartersCount).toFixed(2))
        : 0;
    const gpa = await percentageToGPA(finalCoursePercentage, districtId, schoolId); // DB GPA lookup
    const letterGrade = getLetterGrade(gradingScale, finalCoursePercentage, districtId, schoolId);

    // Fetch semester & quarter titles
    const semesters = await Semester.find({
      _id: { $in: Object.keys(groupedBySemesterQuarter).filter(id => id !== "unknown-semester") },
      districtId,
      schoolId
    }).lean();
    const quarters = await Quarter.find({ districtId, schoolId }).lean();

    const semesterList = Object.entries(groupedBySemesterQuarter).map(
      ([semesterId, semesterData]) => {
        const semesterDoc = semesters.find(s => s._id.toString() === semesterId);
        const semesterTitle = semesterDoc?.title || "Unknown Semester";

        const quartersArray = Object.entries(semesterData.quarters).map(
          ([quarterId, quarterData]) => {
            const quarterDoc = quarters.find(q => q._id.toString() === quarterId);
            const quarterTitle = quarterDoc?.title || "Unknown Quarter";
            return {
              quarterId,
              quarterTitle,
              grade: quarterData.grade,
              gpa: quarterData.gpa,
              letterGrade: quarterData.letterGrade,
              assessments: quarterData.assessments,
            };
          }
        );

        return { semesterId, semesterTitle, quarters: quartersArray };
      }
    );

    res.json({
      studentId,
      course,
      courseName: course?.courseTitle || "Unknown Course",
      grade: finalCoursePercentage,
      gpa,
      letterGrade,
      totalAssessments,
      page,
      limit,
      totalPages,
      semesters: semesterList,
    });
  } catch (error) {
    console.error("Gradebook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getGPAFromPercentage = (percentage, gpaScale) => {
  if (!gpaScale || gpaScale.length === 0) return 0.0;
  const match = gpaScale.find(scale =>
    percentage >= scale.minPercentage && percentage <= scale.maxPercentage
  );
  return match ? match.gpa : 0.0;
};

export const getStudentGradeReport = async (req, res) => {
  const studentId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const { districtId, schoolId } = req.user

  try {
    const student = await User.findOne({ _id: studentId, districtId, schoolId }).lean();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    /** 1️⃣ Fetch student's assessment submissions */
    const submissions = await Submission.find({ studentId, graded: true, districtId, schoolId });
    const assessmentIds = submissions.map(s => s.assessment);

    /** 2️⃣ Fetch assessments with course info */
    const assessments = await Assessment.find({ _id: { $in: assessmentIds }, districtId, schoolId })
      .populate("course category semester quarter")
      .lean();

    /** 3️⃣ Fetch student's graded discussion comments (any course) */
    const discussionComments = await DiscussionComment.find({
      createdby: studentId,
      isGraded: true,
      districtId,
      schoolId
    })
      .populate({
        path: "discussion",
        populate: { path: "course category semester quarter" }
      })
      .lean();

    /** 4️⃣ Extract unique discussions from comments */
    const discussions = discussionComments.map(c => {
      const d = c.discussion;
      return { ...d, studentPoints: c.marksObtained || 0 };
    });

    /** 5️⃣ Build combined course list from assessments + discussions */
    const assessmentCourseIds = assessments.map(a => a.course._id.toString());
    const discussionCourseIds = discussions.map(d => d.course._id.toString());
    const allCourseIds = [...new Set([...assessmentCourseIds, ...discussionCourseIds])];

    /** 🔹 NEW FIX: Ensure discussion-only courses still have semester/quarter info */
    const discussionOnlyCourseIds = discussionCourseIds.filter(id => !assessmentCourseIds.includes(id));
    let discussionOnlyCourses = [];
    if (discussionOnlyCourseIds.length > 0) {
      discussionOnlyCourses = await CourseSch.find({ _id: { $in: discussionOnlyCourseIds } })
        .populate("semester quarter")
        .lean();
    }

    /** 6️⃣ Build course -> semester -> quarter -> records */
    const courseMap = new Map();

    // Add assessments
    for (const submission of submissions) {
      const assessment = assessments.find(a => a._id.toString() === submission.assessment.toString());
      if (!assessment) continue;
      const courseId = assessment.course._id.toString();
      const semesterId = assessment.semester?._id?.toString() || "unknown-semester";
      const quarterId = assessment.quarter?._id?.toString() || "unknown-quarter";

      if (!courseMap.has(courseId)) courseMap.set(courseId, new Map());
      const semesterMap = courseMap.get(courseId);
      if (!semesterMap.has(semesterId)) semesterMap.set(semesterId, new Map());
      const quarterMap = semesterMap.get(semesterId);
      if (!quarterMap.has(quarterId)) quarterMap.set(quarterId, []);
      quarterMap.get(quarterId).push({ type: "assessment", assessment, submission });
    }

    // Add discussions
    for (const discussion of discussions) {
      const courseId = discussion.course._id.toString();
      const semesterId = discussion.semester?._id?.toString() || "unknown-semester";
      const quarterId = discussion.quarter?._id?.toString() || "unknown-quarter";

      if (!courseMap.has(courseId)) courseMap.set(courseId, new Map());
      const semesterMap = courseMap.get(courseId);
      if (!semesterMap.has(semesterId)) semesterMap.set(semesterId, new Map());
      const quarterMap = semesterMap.get(semesterId);
      if (!quarterMap.has(quarterId)) quarterMap.set(quarterId, []);
      quarterMap.get(quarterId).push({ type: "discussion", discussion });
    }

    /** 7️⃣ FIXED: Fetch single global grading scale */
    const gradingScaleDocs = await GradingScale.find({ districtId, schoolId }).lean();
    const globalGradingScale = gradingScaleDocs.length > 0 ? gradingScaleDocs[0].scale : [];

    // Debug log to check the grading scale structure
    console.log('Grading Scale:', globalGradingScale);

    /** 8️⃣ Paginate courses */
    const paginatedCourseIds = allCourseIds.slice(skip, skip + limit);

    let totalGPA = 0;
    let totalQuarters = 0;
    const courseGrades = [];

    /** 9️⃣ Loop over courses */
    for (const courseId of paginatedCourseIds) {
      const semesterMap = courseMap.get(courseId) || new Map();

      // ✅ FIXED: Get title from any source
      let courseTitle = "Unknown";
      const assessmentCourse = assessments.find(a => a.course._id.toString() === courseId);
      const discussionCourse = discussions.find(d => d.course._id.toString() === courseId);
      const discussionOnlyCourse = discussionOnlyCourses.find(c => c._id.toString() === courseId);

      if (assessmentCourse) {
        courseTitle = assessmentCourse.course.courseTitle;
      } else if (discussionCourse) {
        courseTitle = discussionCourse.course.courseTitle;
      } else if (discussionOnlyCourse) {
        courseTitle = discussionOnlyCourse.courseTitle;
      }

      const semesters = [];
      const semesterScores = [];

      for (const [semesterId, quarterMap] of semesterMap.entries()) {
        const semesterDoc = semesterId !== "unknown-semester" ? await Semester.findOne({ _id: semesterId, districtId, schoolId }).lean() : null;
        const semesterTitle = semesterDoc?.title || "Unknown Semester";

        const quarters = [];
        const quarterScores = [];

        for (const [quarterId, records] of quarterMap.entries()) {
          const quarterDoc = quarterId !== "unknown-quarter" ? await Quarter.findOne({ _id: quarterId, districtId, schoolId }).lean() : null;
          const quarterTitle = quarterDoc?.title || "Unknown Quarter";

          const categories = await AssessmentCategory.find({ course: courseId, districtId, schoolId });
          const activeCategories = categories
            .map(category => {
              const itemsInCategory = records.filter(r =>
                r.type === "assessment"
                  ? r.assessment.category?._id?.toString() === category._id.toString()
                  : r.discussion.category?._id?.toString() === category._id.toString()
              );
              return { category, itemsInCategory };
            })
            .filter(entry => entry.itemsInCategory.length > 0);

          const totalWeight = activeCategories.reduce((sum, entry) => sum + entry.category.weight, 0);
          let quarterWeightedScore = 0;
          const assessmentDetails = [];

          for (const { category, itemsInCategory } of activeCategories) {
            let categoryScore = 0;
            let categoryMax = 0;

            for (const item of itemsInCategory) {
              if (item.type === "assessment") {
                const maxPoints = item.assessment.questions.reduce((sum, q) => sum + q.points, 0);
                const studentPoints = item.submission.totalScore || 0;
                categoryScore += studentPoints;
                categoryMax += maxPoints;
                assessmentDetails.push({
                  assessmentId: item.assessment._id,
                  assessmentTitle: item.assessment.title,
                  category: category.name,
                  isGraded: item.submission.graded,
                  maxPoints,
                  studentPoints,
                  isDiscussion: false,
                });
              } else if (item.type === "discussion") {
                const maxPoints = item.discussion.totalMarks;
                const studentPoints = item.discussion.studentPoints || 0;
                categoryScore += studentPoints;
                categoryMax += maxPoints;
                assessmentDetails.push({
                  assessmentId: item.discussion._id,
                  assessmentTitle: item.discussion.topic,
                  category: category.name,
                  isGraded: true,
                  maxPoints,
                  studentPoints,
                  isDiscussion: true,
                });
              }
            }

            const percentage = categoryMax > 0 ? (categoryScore / categoryMax) * 100 : 0;
            const normalizedWeight = (category.weight / totalWeight) * 100;
            quarterWeightedScore += (percentage * normalizedWeight) / 100;
          }

          const finalQuarterGrade = parseFloat(quarterWeightedScore.toFixed(2));
          const gpa = await percentageToGPA(finalQuarterGrade, districtId, schoolId);
          totalGPA += gpa;
          totalQuarters++;
          quarterScores.push(finalQuarterGrade);

          // ✅ FIXED: Use global grading scale
          const letterGrade = getLetterGrade(globalGradingScale, finalQuarterGrade, districtId, schoolId);
          quarters.push({
            quarterId,
            quarterTitle,
            grade: finalQuarterGrade,
            gpa,
            letterGrade,
            assessments: assessmentDetails
          });
        }

        const semesterPercentage =
          quarterScores.length > 0
            ? parseFloat((quarterScores.reduce((a, b) => a + b, 0) / quarterScores.length).toFixed(2))
            : 0;
        // ✅ FIXED: Use global grading scale
        const semesterLetterGrade = getLetterGrade(globalGradingScale, semesterPercentage, districtId, schoolId);
        semesterScores.push(semesterPercentage);
        semesters.push({
          semesterId,
          semesterTitle,
          semesterPercentage,
          letterGrade: semesterLetterGrade,
          quarters
        });
      }

      const coursePercentage =
        semesterScores.length > 0
          ? parseFloat((semesterScores.reduce((a, b) => a + b, 0) / semesterScores.length).toFixed(2))
          : 0;
      // ✅ FIXED: Use global grading scale
      const courseLetterGrade = getLetterGrade(globalGradingScale, coursePercentage, districtId, schoolId);

      courseGrades.push({
        courseId,
        courseName: courseTitle,
        coursePercentage,
        letterGrade: courseLetterGrade,
        semesters
      });
    }

    /** 🔟 Final overall GPA */
    const overallGPA = totalQuarters > 0 ? parseFloat((totalGPA / totalQuarters).toFixed(2)) : 0;

    res.json({
      studentId,
      overallGPA,
      totalCourses: allCourseIds.length,
      currentPage: page,
      totalPages: Math.ceil(allCourseIds.length / limit),
      courses: courseGrades,
    });

  } catch (err) {
    console.error("Error generating grade report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const setGradingScale = async (req, res) => {
  const { scale } = req.body;
  const { districtId, schoolId } = req.user;

  if (!Array.isArray(scale) || scale.length === 0) {
    return res.status(400).json({ error: "Scale must be a non-empty array." });
  }

  try {
    const existing = await GradingScale.findOne({ districtId, schoolId });

    if (existing) {
      await GradingScale.findOneAndUpdate({ _id: existing._id }, { scale });

      return res.status(200).json({
        message: "Grading scale updated successfully",
        scale,
      });
    }

    const newScale = await GradingScale.create({ scale, districtId, schoolId });

    res.status(200).json({
      message: "Grading scale saved successfully",
      scale: newScale.scale,
    });
  } catch (err) {
    console.error("Error saving grading scale:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGradingScale = async (req, res) => {
  const { districtId } = req.user;
  try {
    const scaleDoc = await GradingScale.findOne({ districtId });
    const scale = scaleDoc?.scale
      ? [...scaleDoc.scale].sort((a, b) => b.max - a.max)
      : null;
    if (!scale) {
      return res.status(404).json({ message: "Grading scale not found" });
    }
    return res.status(201).json({ message: "Grading scale found", scale });
  } catch (err) {
    console.error("Error fetching grading scale:", err);
    return null;
  }
};

export const getGradebookForCourse = async (req, res) => {
  const { courseId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { districtId, schoolId } = req.user;
  try {
    const gradingScaleDoc = await GradingScale.findOne().lean();
    const gradingScale = gradingScaleDoc?.scale || [];

    const categories = await AssessmentCategory.find({ course: courseId });

    const totalStudents = await Enrollment.countDocuments({ course: courseId });
    const enrollments = await Enrollment.find({ course: courseId })
      .populate("student", "firstName lastName")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // All assessments for the course
    const allAssessments = await Assessment.find({ course: courseId, isDeleted: false })
      .populate("category semester quarter")
      .lean();

    // All discussions for the course
    const allDiscussions = await Discussion.find({ course: courseId })
      .populate("category semester quarter")
      .lean();

    const gradebook = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      const studentId = student._id;

      // Student's assessment submissions
      const submissions = await Submission.find({ studentId, graded: true }).lean();

      // Student's graded discussion comments
      const discussionComments = await DiscussionComment.find({
        createdby: studentId,
        isGraded: true,
        discussion: { $in: allDiscussions.map(d => d._id) }
      }).lean();

      // Build semester/quarter map
      const semesterMap = new Map();

      // Add assessments to map
      for (const submission of submissions) {
        const assessment = allAssessments.find(
          a => a._id.toString() === submission.assessment.toString()
        );
        if (!assessment) continue;

        const semesterId = assessment.semester?._id?.toString() || "unknown-semester";
        const quarterId = assessment.quarter?._id?.toString() || "unknown-quarter";

        if (!semesterMap.has(semesterId)) semesterMap.set(semesterId, new Map());
        const quarterMap = semesterMap.get(semesterId);

        if (!quarterMap.has(quarterId)) quarterMap.set(quarterId, []);
        quarterMap.get(quarterId).push({ type: "assessment", assessment, submission });
      }

      // Add discussions to map
      for (const comment of discussionComments) {
        const discussion = allDiscussions.find(
          d => d._id.toString() === comment.discussion.toString()
        );
        if (!discussion) continue;

        const semesterId = discussion.semester?._id?.toString() || "unknown-semester";
        const quarterId = discussion.quarter?._id?.toString() || "unknown-quarter";

        if (!semesterMap.has(semesterId)) semesterMap.set(semesterId, new Map());
        const quarterMap = semesterMap.get(semesterId);

        if (!quarterMap.has(quarterId)) quarterMap.set(quarterId, []);
        // Attach marksObtained to discussion
        quarterMap.get(quarterId).push({
          type: "discussion",
          discussion: { ...discussion, studentPoints: comment.marksObtained }
        });
      }

      const semesters = [];
      let totalGPA = 0;
      let totalQuarters = 0;
      let finalScore = 0;

      for (const [semesterId, quarterMap] of semesterMap.entries()) {
        const semesterDoc = semesterId !== "unknown-semester" ? await Semester.findOne({ _id: semesterId, districtId, schoolId }).lean() : null;
        const semesterTitle = semesterDoc?.title || "Unknown Semester";

        const quarters = [];

        for (const [quarterId, records] of quarterMap.entries()) {
          const quarterDoc = quarterId !== "unknown-quarter" ? await Quarter.findOne({ _id: quarterId, districtId, schoolId }).lean() : null;
          const quarterTitle = quarterDoc?.title || "Unknown Quarter";

          const activeCategories = [];

          const assessmentDetails = [];
          for (const category of categories) {
            const itemsInCategory = records.filter(r =>
              r.type === "assessment"
                ? r.assessment.category?._id?.toString() === category._id.toString()
                : r.discussion.category?._id?.toString() === category._id.toString()
            );

            if (itemsInCategory.length === 0) continue;

            let categoryScore = 0;
            let categoryMax = 0;

            for (const item of itemsInCategory) {
              if (item.type === "assessment") {
                const maxPoints = item.assessment.questions.reduce(
                  (sum, q) => sum + q.points,
                  0
                );
                const studentPoints = item.submission.totalScore || 0;
                categoryScore += studentPoints;
                categoryMax += maxPoints;
                assessmentDetails.push({
                  assessmentId: item.assessment._id,
                  assessmentTitle: item.assessment.title,
                  category: category.name,
                  maxPoints,
                  studentPoints,
                  isDiscussion: false
                });
              } else if (item.type === "discussion") {
                const maxPoints = item.discussion.totalMarks;
                const studentPoints = item.discussion.studentPoints || 0;
                categoryScore += studentPoints;
                categoryMax += maxPoints;
                assessmentDetails.push({
                  assessmentId: item.discussion._id,
                  assessmentTitle: item.discussion.topic,
                  category: category.name,
                  maxPoints,
                  studentPoints,
                  isDiscussion: true
                });
              }
            }

            const percentage = categoryMax > 0 ? (categoryScore / categoryMax) * 100 : 0;
            activeCategories.push({
              weight: category.weight,
              percentage
            });
          }

          // Normalize weights for active categories only
          const totalActiveWeight = activeCategories.reduce(
            (sum, c) => sum + c.weight,
            0
          );
          let quarterScore = 0;
          for (const cat of activeCategories) {
            const normalizedWeight = (cat.weight / totalActiveWeight) * 100;
            quarterScore += (cat.percentage * normalizedWeight) / 100;
          }

          const finalQuarterGrade = parseFloat(quarterScore.toFixed(2));
          const quarterGPA = await percentageToGPA(finalQuarterGrade);
          const quarterLetter = getLetterGrade(gradingScale, finalQuarterGrade, districtId, schoolId);

          finalScore += finalQuarterGrade;
          totalGPA += quarterGPA;
          totalQuarters++;

          quarters.push({
            quarterId,
            quarterTitle,
            grade: finalQuarterGrade,
            gpa: quarterGPA,
            letterGrade: quarterLetter,
            assessments: assessmentDetails
          });
        }

        semesters.push({
          semesterId,
          semesterTitle,
          quarters
        });
      }

      const overallGPA =
        totalQuarters > 0
          ? parseFloat((totalGPA / totalQuarters).toFixed(2))
          : 0;

      const studentFinalGrade =
        totalQuarters > 0
          ? parseFloat((finalScore / totalQuarters).toFixed(2))
          : 0;

      const letterGrade = getLetterGrade(gradingScale, studentFinalGrade, districtId, schoolId);

      gradebook.push({
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        gpa: overallGPA,
        finalGrade: studentFinalGrade,
        letterGrade,
        semesters
      });
    }

    return res.json({
      courseId,
      total: totalStudents,
      page: Number(page),
      limit: Number(limit),
      gradebook
    });
  } catch (error) {
    console.error("Error generating gradebook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTeacherStudentAnalytics = async (req, res) => {
  const { courseId, studentId } = req.params;
  const { districtId, schoolId } = req.user;

  try {
    const course = await CourseSch.findById(courseId).lean().select("courseTitle");

    if (course.districtId !== districtId || course.schoolId !== schoolId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 1. Fetch Basic Info & Scales
    const gradingScaleDoc = await GradingScale.findOne().lean();
    const gradingScale = gradingScaleDoc?.scale || [];
    const categories = await AssessmentCategory.find({ course: courseId }).lean();

    // 2. Fetch Graded Data (Submissions & Discussions)
    const [submissions, discussionComments] = await Promise.all([
      Submission.find({ studentId, graded: true, districtId, schoolId }).lean(),
      DiscussionComment.find({ createdby: studentId, isGraded: true, districtId, schoolId }).lean()
    ]);

    const subMap = new Map(submissions.map(s => [s.assessment.toString(), s]));
    const discMap = new Map(discussionComments.map(d => [d.discussion.toString(), d]));

    // 3. Fetch Assessment/Discussion details to get maxPoints and categories
    const [gradedAssessments, gradedDiscussions] = await Promise.all([
      Assessment.find({ course: courseId, _id: { $in: submissions.map(s => s.assessment) }, isDeleted: false }).populate("category").lean(),
      Discussion.find({ course: courseId, _id: { $in: discussionComments.map(d => d.discussion) } }).populate("category").lean()
    ]);

    // 4. Flatten and Format all items for Charts
    const allItems = [...gradedAssessments, ...gradedDiscussions].map(item => {
      let studentPoints = 0;
      let maxPoints = 0;
      let title = "";

      if (item.questions) { // Assessment
        const sub = subMap.get(item._id.toString());
        studentPoints = sub?.totalScore || 0;
        maxPoints = item.questions.reduce((sum, q) => sum + q.points, 0);
        title = item.title;
      } else { // Discussion
        const comm = discMap.get(item._id.toString());
        studentPoints = comm?.marksObtained || 0;
        maxPoints = item.totalMarks || 0;
        title = item.topic;
      }

      return {
        id: item._id,
        title,
        category: item.category?.name || "Uncategorized",
        categoryId: item.category?._id?.toString(),
        studentPoints,
        maxPoints,
        percentage: maxPoints > 0 ? (studentPoints / maxPoints) * 100 : 0,
        createdAt: item.createdAt || new Date()
      };
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // 5. WEIGHTED CALCULATION (Matching your Gradebook logic)
    const categoryStats = {};
    allItems.forEach(item => {
      if (!categoryStats[item.categoryId]) {
        categoryStats[item.categoryId] = { score: 0, max: 0, weight: 0, name: item.category };
        const catDoc = categories.find(c => c._id.toString() === item.categoryId);
        categoryStats[item.categoryId].weight = catDoc?.weight || 0;
      }
      categoryStats[item.categoryId].score += item.studentPoints;
      categoryStats[item.categoryId].max += item.maxPoints;
    });

    const activeCats = Object.values(categoryStats).filter(c => c.max > 0);
    const totalWeight = activeCats.reduce((sum, c) => sum + c.weight, 0);

    let currentOverallAvg = 0;
    activeCats.forEach(cat => {
      const catPerc = (cat.score / cat.max) * 100;
      const normalizedWeight = (cat.weight / totalWeight) * 100;
      currentOverallAvg += (catPerc * normalizedWeight) / 100;
    });

    // 6. MOMENTUM & PROJECTION
    const recentWindow = 5;
    const trendItems = allItems.slice(-recentWindow);
    const recentAvg = trendItems.length > 0
      ? trendItems.reduce((acc, item) => acc + item.percentage, 0) / trendItems.length
      : 0;

    const trendDiff = recentAvg - currentOverallAvg;
    const projectedScore = (recentAvg * 0.6) + (currentOverallAvg * 0.4);

    // 7. FORMAT CATEGORY PERFORMANCE FOR BAR CHART
    const categoryPerformance = activeCats.map(cat => ({
      category: cat.name,
      average: (cat.score / cat.max) * 100,
      count: allItems.filter(i => i.category === cat.name).length
    })).sort((a, b) => b.average - a.average);

    const weakest = categoryPerformance[categoryPerformance.length - 1];
    const best = categoryPerformance[0];

    res.json({
      courseName: course?.courseTitle,
      summary: {
        currentPercentage: currentOverallAvg.toFixed(1),
        totalAssessments: allItems.length,
      },
      insights: {
        trendStatus: trendDiff >= 0 ? "increasing" : "decreasing",
        percentageChange: Math.abs(trendDiff).toFixed(1),
        recentAverage: recentAvg.toFixed(1),
        overallAverage: currentOverallAvg.toFixed(1),
        projectedFinalScore: Math.min(100, projectedScore).toFixed(1),
        weakestCategory: weakest ? {
          name: weakest.category,
          average: weakest.average.toFixed(1),
          gap: (best.average - weakest.average).toFixed(1)
        } : null
      },
      charts: {
        lineChart: allItems.map(i => ({ name: i.title, score: i.percentage })),
        categoryPerformance
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};