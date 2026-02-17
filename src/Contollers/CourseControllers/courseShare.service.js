import CourseSch from "../../Models/courses.model.sch.js";
import Chapter from "../../Models/chapter.model.sch.js";
import Lesson from "../../Models/lesson.model.sch.js";
import Assessment from "../../Models/Assessment.model.js";
import AssessmentCategory from "../../Models/assessment-category.js";
import Enrollment from "../../Models/Enrollement.model.js";

/**
 * REUSABLE COURSE IMPORT SERVICE
 * Used by both importFullCourse (JSON) and acceptShare (internal sharing)
 */
export const processCourseImport = async (
  data,
  userId,
  titleSuffix = "(Imported)",
) => {
  // --- STEP 1: CREATE THE COURSE ---
  const {
    _id,
    courseCode,
    createdAt,
    updatedAt,
    __v,
    curriculum,
    assessments,
    discussions,
    published,
    quarters,
    assessmentCategories,
    ...courseBody
  } = data;

  const newCourse = new CourseSch({
    ...courseBody,
    courseTitle: `${courseBody.courseTitle} ${titleSuffix}`,
    courseCode: `CLN-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`,
    createdby: userId,
    published: false,
    category: courseBody.category?._id || courseBody.category,
    subcategory: courseBody.subcategory?._id || courseBody.subcategory,
    semester: courseBody.semester?.map((s) => s._id || s) || [],
    quarter: courseBody.quarter?.map((q) => q._id || q) || [],
  });

  const savedCourse = await newCourse.save();

  // ID Maps to maintain relationships
  const chapterMap = {};
  const lessonMap = {};

  // --- STEP 2: CREATE CURRICULUM ---
  if (curriculum && curriculum.length > 0) {
    for (const chap of curriculum) {
      const { _id: oldChapId, lessons, ...chapBody } = chap;

      const newChapter = await Chapter.create({
        ...chapBody,
        course: savedCourse._id,
        createdby: userId,
        quarter: chapBody.quarter?._id || chapBody.quarter,
      });

      chapterMap[oldChapId] = newChapter._id;

      if (lessons && lessons.length > 0) {
        for (const lesson of lessons) {
          const { _id: oldLessonId, ...lessonBody } = lesson;

          const newLesson = await Lesson.create({
            ...lessonBody,
            chapter: newChapter._id,
            createdby: userId,
          });

          lessonMap[oldLessonId] = newLesson._id;
        }
      }
    }
  }

  // --- STEP 3: CREATE ASSESSMENTS ---
  if (assessments && assessments.length > 0) {
    const preparedAssessments = assessments.map((asmt) => {
      const { _id: oldAsmtId, questions, ...asmtBody } = asmt;
      const cleanQuestions = questions.map(({ _id, ...q }) => q);

      return {
        ...asmtBody,
        course: savedCourse._id,
        createdby: userId,
        category: asmtBody.category?._id || asmtBody.category,
        semester: asmtBody.semester?._id || asmtBody.semester,
        quarter: asmtBody.quarter?._id || asmtBody.quarter,
        chapter: chapterMap[asmtBody.chapter] || null,
        lesson: lessonMap[asmtBody.lesson] || null,
        questions: cleanQuestions,
      };
    });

    await Assessment.insertMany(preparedAssessments);
  }

  // --- STEP 4: CREATE ASSESSMENT CATEGORIES ---
  if (assessmentCategories && assessmentCategories.length > 0) {
    const preparedCategories = assessmentCategories.map((cat) => {
      const { _id, ...catBody } = cat;
      return {
        ...catBody,
        course: savedCourse._id,
      };
    });
    await AssessmentCategory.insertMany(preparedCategories);
  }

  // Auto-enroll the creator
  await Enrollment.create({ student: userId, course: savedCourse._id });

  return savedCourse;
};

/**
 * Fetch full course data for sharing/export
 */
export const fetchFullCourseData = async (courseId) => {
  const course = await CourseSch.findById(courseId)
    .populate("category subcategory semester quarter")
    .lean();

  if (!course) {
    throw new Error("Course not found");
  }

  const assessmentCategories = await AssessmentCategory.find({
    course: courseId,
  }).lean();
  const chapters = await Chapter.find({ course: courseId }).lean();

  const curriculum = await Promise.all(
    chapters.map(async (chapter) => {
      const lessons = await Lesson.find({ chapter: chapter._id }).lean();
      return { ...chapter, lessons };
    }),
  );

  const assessments = await Assessment.find({ course: courseId }).lean();

  return {
    ...course,
    assessmentCategories,
    curriculum,
    assessments,
  };
};
