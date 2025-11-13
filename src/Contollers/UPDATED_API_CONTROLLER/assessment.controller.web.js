import mongoose from "mongoose";
import { uploadToCloudinary } from "../../lib/cloudinary-course.config.js";
import Chapter from "../../Models/chapter.model.sch.js";
import Lesson from "../../Models/lesson.model.sch.js";
import Assessment from "../../Models/Assessment.model.js";
import User from "../../Models/user.model.js";
import Enrollment from "../../Models/Enrollement.model.js";
import nodemailer from "nodemailer";

export const createAssessment_updated = async (req, res) => {
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
    assessmentType,
  } = req.body;

  const files = req.files;
  const createdby = req.user._id;

  try {
    // ✅ Parse questions
    const parsedQuestions = JSON.parse(questions || "[]");
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0)
      throw new Error("At least one question is required");

    // ✅ Validate & upload question files
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      if (q.files && Array.isArray(q.files) && q.files.length > 0) {
        const uploaded = [];
        for (const file of q.files) {
          const result = await uploadToCloudinary(file.buffer, "assessment_files");
          uploaded.push({
            url: result.secure_url,
            publicId: result.public_id,
            filename: file.originalname,
          });
        }
        q.files = uploaded;
      }

      if (!q.type || !["mcq", "truefalse", "qa", "file"].includes(q.type))
        throw new Error(`Invalid question type at index ${i}`);

      if (!q.question || q.question.trim().length < 5)
        throw new Error(`Question ${i + 1} must be at least 5 characters long`);

      if (typeof q.points !== "number" || q.points < 1 || q.points > 999)
        throw new Error(`Invalid points in question ${i + 1}`);

      if (q.type === "mcq") {
        if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4)
          throw new Error(`Question ${i + 1} must have 2–4 options`);
        if (!q.correctAnswer || typeof q.correctAnswer !== "string")
          throw new Error(`Correct answer is required for question ${i + 1}`);
      }

      if (q.type === "truefalse") {
        if (!["true", "false"].includes(q.correctAnswer))
          throw new Error(`Correct answer must be true/false in question ${i + 1}`);
      }
    }

    // ✅ Upload assessment-level attachments
    let uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, "assessment_attachments");
        uploadedFiles.push({
          url: result.secure_url,
          filename: file.originalname,
        });
      }
    }

    // ✅ Infer course/chapter
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
      finalChapter = foundLesson.chapter._id;
      const foundChapter = await Chapter.findById(finalChapter);
      if (!foundChapter) throw new Error("Associated chapter not found");
      finalCourse = foundChapter.course;
    }

    // ✅ Format due date
    let dueDateObj = {};
    if (dueDate) {
      const date = new Date(dueDate);
      dueDateObj.date = date.toISOString().split("T")[0];
      dueDateObj.time = date.toISOString().split("T")[1].split(".")[0];
    }

    // ✅ Determine type
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

    // ✅ Send Email Notification
    const teacher = await User.findById(createdby);
    const enrolledStudents = await Enrollment.find({ course: finalCourse }).populate("student");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@acewallscholars.org",
        pass: "ecgdupvzkfmbqrrq",
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: #10b981; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px;">New Assessment Created</h2>
          </div>
          <div style="padding: 20px; color: #333;">
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Due Date:</strong> ${dueDateObj.date || "N/A"}</p>
            <p><strong>Description:</strong></p>
            <div style="margin-top: 10px; padding: 12px; background: #f9f9f9; border-left: 4px solid #10b981;">
              <p>${description}</p>
            </div>
          </div>
          <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
            <p>Acewall Scholars © ${new Date().getFullYear()}</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </div>
    `;

    // ✅ Loop students & guardians with opt-in check
    for (const enr of enrolledStudents) {
      const student = enr?.student;
      if (!student || typeof student !== "object") continue;

      const recipients = [];

      // Student always receives it
      if (student.email) recipients.push(student.email);

      // Guardian(s) only if assessments preference = true
      if (
        Array.isArray(student.guardianEmails) &&
        student.guardianEmails.length > 0 &&
        student.guardianEmailPreferences?.assessments
      ) {
        for (const gEmail of student.guardianEmails) {
          if (typeof gEmail === "string" && gEmail.includes("@")) {
            recipients.push(gEmail);
          }
        }
      }

      // Skip if no recipients
      if (recipients.length === 0) continue;

      // Send email
      for (const recipient of recipients) {
        try {
          await transporter.sendMail({
            from: `"Acewall Scholars" <support@acewallscholars.org>`,
            to: recipient,
            subject: `New Assessment: ${title}`,
            html: emailHtml,
          });
        } catch (mailError) {
          console.error(`Failed to send email to ${recipient}:`, mailError.message);
          continue;
        }
      }
    }

    res.status(201).json({
      message: "Assessment created successfully and notifications sent",
      assessment: newAssessment,
    });
  } catch (error) {
    console.error("Error creating assessment:", error);
    res.status(400).json({ error: error.message });
  }
};
