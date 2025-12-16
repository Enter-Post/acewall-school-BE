import mongoose from "mongoose";
import { uploadToCloudinary } from "../lib/cloudinary-course.config.js";
import Assessment from "../Models/Assessment.model.js";
import Lesson from "../Models/lesson.model.sch.js";
import Chapter from "../Models/chapter.model.sch.js";
import { ObjectId } from "bson"; // Import ObjectId
import Enrollment from "../Models/Enrollement.model.js";
import e from "express";
import Submission from "../Models/submission.model.js";
import Discussion from "../Models/discussion.model.js";
import nodemailer from "nodemailer";
import User from "../Models/user.model.js";

export const sendAssessmentReminder = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const teacherId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID." });
    }

    const assessment = await Assessment.findById(assessmentId)
      .populate("course", "courseTitle")
      .populate("createdby", "firstName lastName email");

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    if (assessment.createdby._id.toString() !== teacherId.toString()) {
      return res.status(403).json({
        message:
          "You are not authorized to send reminders for this assessment.",
      });
    }

    // ✅ Find enrolled students
    const enrollments = await Enrollment.find({
      course: assessment.course._id,
    }).populate("student", "email firstName lastName");

    if (!enrollments.length) {
      return res
        .status(404)
        .json({ message: "No students enrolled in this course." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT || 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.verify().catch((err) => {
      console.error("❌ SMTP verification failed:", err.message);
    });

    const dueDate = assessment.dueDate?.date
      ? new Date(assessment.dueDate.date).toLocaleDateString()
      : "Not specified";

    const portalBaseURL =
      process.env.STUDENT_PORTAL_URL || "https://portal.acewallscholars.org";
    const assessmentLink = `${portalBaseURL}/student/assessment/${assessment._id}`;

    let sentCount = 0;

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      if (!student?.email) continue;

      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || "Acewall Scholars"}" <${process.env.MAIL_USER
          }>`,
        to: student.email,
        subject: `Reminder: ${assessment.title} - Due ${dueDate}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #10b981; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Assessment Reminder</h2>
            </div>

            <!-- Body -->
            <div style="padding: 20px; color: #333;">
              <p style="font-size: 16px;">Hello ${student.firstName + " " + student.lastName
          },</p>
              <p style="font-size: 16px;">
                This is a reminder for your upcoming assessment:
              </p>

              <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #10b981;">
                <p style="margin: 5px 0; font-size: 15px;"><strong>Assessment:</strong> ${assessment.title
          }</p>
                <p style="margin: 5px 0; font-size: 15px;"><strong>Course:</strong> ${assessment.course.courseTitle
          }</p>
                <p style="margin: 5px 0; font-size: 15px;"><strong>Due Date:</strong> ${dueDate}</p>
              </div>

             

              <p style="font-size: 14px; margin-top: 25px; text-align: center;">
                Please make sure to complete it on time through your student portal.
              </p>

              <p style="font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                <strong>${assessment.createdby.firstName} ${assessment.createdby.lastName
          }</strong><br>
                ${assessment.createdby.email}
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
              <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
          
            </div>
          </div>
        </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Reminder sent to ${student.email}`);
        sentCount++;
      } catch (err) {
        console.error(`❌ Failed to send to ${student.email}:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Reminder emails sent to ${sentCount} students successfully.`,
      data: {
        assessmentId,
        assessmentTitle: assessment.title,
        dueDate,
        studentCount: sentCount,
        allStudents: enrollments.map((e) => ({
          id: e.student._id,
          name: `${e.student.firstName} ${e.student.lastName}`,
          email: e.student.email,
        })),
      },
    });
  } catch (error) {
    console.error("💥 Error in sendAssessmentReminder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while sending reminders.",
    });
  }
};

export const createAssessment = async (req, res) => {
  const {
    title,
    description,
    course,
    chapter,
    lesson,
    questions,
    semester,
    quarter,
    dueDate,
    category,
  } = req.body;

  const files = req.files;
  const createdby = req.user._id;

  try {
    const parsedQuestions = JSON.parse(questions || "[]");

    if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
      for (const [index, q] of parsedQuestions.entries()) {
        if (!q.type || !["mcq", "truefalse", "qa"].includes(q.type)) {
          throw new Error(`Invalid question type at index ${index}`);
        }

        if (typeof q.points !== "number" || q.points < 1 || q.points > 999) {
          throw new Error(`Invalid points in question ${index + 1}`);
        }

        if (q.type === "mcq") {
          if (
            !Array.isArray(q.options) ||
            q.options.length < 2 ||
            q.options.length > 4
          ) {
            throw new Error(`Question ${index + 1} must have 2–4 options`);
          }
          if (!q.correctAnswer || typeof q.correctAnswer !== "string") {
            throw new Error(
              `Correct answer is required for question ${index + 1}`
            );
          }
        }

        if (q.type === "truefalse") {
          if (!["true", "false"].includes(q.correctAnswer)) {
            throw new Error(
              `Correct answer must be true/false in question ${index + 1}`
            );
          }
        }
      }
    }

    // ✅ Upload files (PDFs etc.)
    let uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, "lesson_pdfs");
        uploadedFiles.push({
          url: result.secure_url,
          filename: file.originalname,
        });
      }
    }

    // ✅ Infer course/chapter if not explicitly given
    let finalCourse = course;
    let finalChapter = chapter;

    if (chapter && !course) {
      const foundChapter = await Chapter.findById(chapter);
      if (!foundChapter) throw new Error("Chapter not found");
      finalCourse = foundChapter.course;
    }

    if (lesson && !chapter) {
      const foundLesson = await Lesson.findById(lesson).populate("chapter");
      if (!foundLesson) throw new Error("Lesson not found");

      if (!foundLesson.chapter)
        throw new Error("Lesson has no associated chapter");
      finalChapter = foundLesson.chapter._id;

      const foundChapter = await Chapter.findById(finalChapter);
      if (!foundChapter) throw new Error("Associated chapter not found");
      finalCourse = foundChapter.course;
    }

    // ✅ Format due date if provided
    let dueDateObj = {};
    if (dueDate) {
      const date = new Date(dueDate);
      dueDateObj.date = date.toISOString().split("T")[0];
      dueDateObj.time = date.toISOString().split("T")[1].split(".")[0];
    }

    const determineType = () => {
      if (lesson) return "lesson-assessment";
      if (chapter) return "chapter-assessment";
      if (course) return "final-assessment";
      return null;
    };

    const type = determineType();
    if (!type) throw new Error("Assessment type could not be determined");

    // ✅ Save to DB
    const newAssessment = new Assessment({
      title,
      description,
      course: finalCourse,
      chapter: finalChapter,
      lesson,
      category,
      type,
      semester,
      quarter,
      questions: parsedQuestions,
      dueDate: dueDateObj,
      files: uploadedFiles,
      createdby,
      assessmentType,
    });

    await newAssessment.save();

    res.status(201).json({
      message: "Assessment created successfully",
      assessment: newAssessment,
    });
  } catch (error) {
    console.error("Error creating assessment:", error.message);
    res.status(400).json({ error: error.message });
  }
};

export const deleteAssessment = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAssessment = await Assessment.findByIdAndDelete(id);
    if (!deletedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assessment:", error.message);
    res.status(500).json({ messages: "Some thing went wrong" });
  }
};

export const uploadFiles = async (req, res) => {
  const files = req.files;
  const { id } = req.params;

  const assessment = await Assessment.findById(id);
  if (!assessment) {
    return res.status(404).json({ message: "Assessment not found" });
  }

  if (files && files.length > 0) {
    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer, "assessment_files");
      assessment.files.push({
        url: result.secure_url,
        filename: file.originalname,
      });
    }
    await assessment.save();

    res.status(200).json({ message: "Files uploaded successfully" });
  }
};

export const deleteFile = async (req, res) => {
  const { assessmentId, fileId } = req.params;

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    return res.status(404).json({ message: "Assessment not found" });
  }

  const fileIndex = assessment.files.findIndex(
    (file) => file._id.toString() === fileId
  );
  if (fileIndex === -1) {
    return res.status(404).json({ message: "File not found" });
  }

  const file = assessment.files[fileIndex];
  console.log(file, "file");

  try {
    await uploadToCloudinary(file.url, "assessment_files", "delete");
    assessment.files.splice(fileIndex, 1);
    await assessment.save();

    return res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ message: "Error deleting file" });
  }
};

export const getAssesmentbyID = async (req, res) => {
  const { assessmentId } = req.params;
  const validObjectId = new mongoose.Types.ObjectId(assessmentId);

  console.log(assessmentId, validObjectId);
  try {
    const assessment = await Assessment.findById(validObjectId).populate({
      path: "category",
      select: "name",
    });
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.status(200).json({ message: "Assessment found", assessment });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const allAssessmentByTeacher = async (req, res) => {
  const createdby = req.user._id;

  try {
    if (!createdby) {
      return res.status(401).json({ error: "Unauthorized. User ID missing." });
    }

    const assessments = await Assessment.find({ createdby })
      .select(
        "dueDate title description course chapter lesson createdAt category type"
      )
      .populate({
        path: "course",
        select: "courseTitle thumbnail" // <-- include thumbnail
      })
      .populate({ path: "chapter", select: "title" })
      .populate({ path: "lesson", select: "title" })
      .populate({ path: "category", select: "name" });

    console.log(assessments, "assessment");

    res.status(200).json(assessments);
  } catch (err) {
    console.error("Error fetching assessments by teacher:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllassessmentforStudent = async (req, res) => {
  const studentId = req.user._id;

  try {
    // 1. Get all enrollments of the student
    const allEnrollmentofStudent = await Enrollment.find({
      student: studentId,
    });

    const courseIds = allEnrollmentofStudent.map(
      (enrollment) => new mongoose.Types.ObjectId(enrollment.course)
    );

    // 2. Fetch assessments
    const assessments = await Assessment.aggregate([
      {
        $match: { course: { $in: courseIds } },
      },
      {
        $lookup: {
          from: "coursesches",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "chapters",
          localField: "chapter",
          foreignField: "_id",
          as: "chapter",
        },
      },
      { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lesson",
        },
      },
      { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "assessmentcategories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "submissions",
          let: { assessmentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$assessment", "$$assessmentId"] },
                    {
                      $eq: [
                        "$studentId",
                        new mongoose.Types.ObjectId(studentId),
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "submissions",
        },
      },
      {
        $addFields: {
          isSubmitted: { $gt: [{ $size: "$submissions" }, 0] },
          source: "assessment",
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          title: 1,
          description: 1,
          dueDate: 1,
          createdAt: 1,
          isSubmitted: 1,
          category: 1,
          source: 1,
          "course._id": 1,
          "course.courseTitle": 1,
          "course.thumbnail": 1,
          "chapter._id": 1,
          "chapter.title": 1,
          "lesson._id": 1,
          "lesson.title": 1,
        },
      },
    ]);

    // 3. Fetch discussions
    const discussions = await Discussion.aggregate([
      {
        $match: { course: { $in: courseIds } },
      },
      {
        $lookup: {
          from: "coursesches",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "chapters",
          localField: "chapter",
          foreignField: "_id",
          as: "chapter",
        },
      },
      { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lesson",
        },
      },
      { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "assessmentcategories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "discussioncomments", // collection name for comments
          let: { discussionId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$discussion", "$$discussionId"] },
                    {
                      $eq: [
                        "$createdby",
                        new mongoose.Types.ObjectId(studentId),
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "comments",
        },
      },

      {
        $addFields: {
          isSubmitted: { $gt: [{ $size: "$comments" }, 0] },
          title: "$topic", // align with assessments
          source: "discussion",
        },
      },

      // {
      //   $addFields: {
      //     isSubmitted: false, // For now, no submissions logic for discussions
      //     title: "$topic", // align with assessment field
      //     source: "discussion",
      //   },
      // },
      {
        $project: {
          _id: 1,
          type: 1,
          title: 1,
          description: 1,
          dueDate: 1,
          createdAt: 1,
          isSubmitted: 1,
          category: 1,
          source: 1,
          "course._id": 1,
          "course.courseTitle": 1,
          "chapter._id": 1,
          "chapter.title": 1,
          "lesson._id": 1,
          "lesson.title": 1,
        },
      },
    ]);

    // 4. Merge both and sort
    const combined = [...assessments, ...discussions].sort((a, b) => {
      if (a.isSubmitted === b.isSubmitted) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return a.isSubmitted ? 1 : -1;
    });

    res.status(200).json(combined);
  } catch (err) {
    console.error("Error fetching assessments/discussions for student:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};  

export const editAssessmentInfo = async (req, res) => {
  const { assessmentId } = req.params;
  const { title, description, category, dueDate } = req.body;

  try {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(400).json({ message: "Assessment not found" });
    }

    let dueDateObj = {};
    if (dueDate) {
      const date = new Date(dueDate);
      dueDateObj.date = date.toISOString().split("T")[0];
      dueDateObj.time = date.toISOString().split("T")[1].split(".")[0];
    }

    assessment.title = title;
    assessment.description = description;
    assessment.category = category;
    assessment.dueDate = dueDateObj;

    assessment.save();
    res.status(200).json({ message: "Assessment updated successfully" });
  } catch (error) {
    console.log("error in the edit Assessment Info", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const setReminderTime = async (req, res) => {
  const { assessmentId } = req.params;
  const { reminder } = req.body;

  try {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(400).json({ message: "Assessment not found" });
    }

    assessment.reminderTimeBefore = reminder;

    assessment.save();
    res.status(200).json({ message: "Assessment reminder time updated successfully" });

  } catch (error) {
    console.log("error in the edit Assessment Info", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const findReminderTime = async (req, res) => {
  const { assessmentId } = req.params;
  try {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      console.log("Assessment not found");
      return null;
    }

    res.status(200).json({ message: "Assessment reminder time updated successfully", reminderTime: assessment.reminderTimeBefore }); // Return the reminder time
  } catch (error) {
    console.log("error in the edit Assessment Info", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// GET /api/admin/courses/:courseId/assessments
export const getAssessmentsByCourseForAdmin = async (req, res) => {
  const { courseId } = req.params;

  try {
    const assessments = await Assessment.aggregate([
      // Match assessments for the given course
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },

      // Lookup category
      {
        $lookup: {
          from: "assessmentcategories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // Lookup chapter
      {
        $lookup: {
          from: "chapters",
          localField: "chapter",
          foreignField: "_id",
          as: "chapter",
        },
      },
      { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },

      // Lookup lesson
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lesson",
        },
      },
      { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },

      // Lookup creator
      {
        $lookup: {
          from: "users",
          localField: "createdby",
          foreignField: "_id",
          as: "createdby",
        },
      },
      { $unwind: { path: "$createdby", preserveNullAndEmptyArrays: true } },

      // Add custom fields
      {
        $addFields: {
          questionsCount: { $size: "$questions" },
          dueDate: "$dueDate",
          status: "$stutus", // keep typo as in schema
          reminderSent: "$reminderSent",
          reminderTimeBefore: "$reminderTimeBefore",
        },
      },

      // Project only needed fields
      {
        $project: {
          title: 1,
          description: 1,
          assessmentType: 1,
          type: 1,
          category: { _id: 1, name: 1 },
          chapter: { _id: 1, title: 1 },
          lesson: { _id: 1, title: 1 },
          dueDate: 1,
          status: 1,
          questionsCount: 1,
          createdby: { _id: 1, name: 1, email: 1 },
          createdAt: 1,
          updatedAt: 1,
          reminderSent: 1,
          reminderTimeBefore: 1,
        },
      },

      // Sort latest first
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({ assessments });
  } catch (error) {
    console.error("Error fetching assessments for admin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


