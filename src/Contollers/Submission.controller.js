import mongoose from "mongoose";
import Assessment from "../Models/Assessment.model.js";
import Submission from "../Models/submission.model.js";

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import User from "../Models/user.model.js";
import { uploadToCloudinary } from "../lib/cloudinary-course.config.js";
import CourseSch from "../Models/courses.model.sch.js";
import Lesson from "../Models/lesson.model.sch.js";
import Chapter from "../Models/chapter.model.sch.js";
import { updateGradebookOnSubmission } from "../Utiles/updateGradebookOnSubmission.js";
import generateAssessmentSummary from "../../utils/generateAssessmentSummary.js";

dotenv.config();

export const submission = async (req, res) => {
  const studentId = req.user._id;
  const { assessmentId } = req.params;
  const answers = req.body;
  const files = req.files;

  let finalQuestionsubmitted;
  let lesson;
  let chapter;

  try {
    // ✅ Check if already submitted
    const alreadySubmitted = await Submission.findOne({
      studentId,
      assessment: assessmentId,
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        message: "You have already submitted this assessment",
      });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment)
      return res.status(404).json({ message: "Assessment not found" });

    if (assessment.chapter) chapter = await Chapter.findById(assessment.chapter);
    if (assessment.lesson) lesson = await Lesson.findById(assessment.lesson);

    await CourseSch.findById(assessment.course);

    // ✅ Upload files if any
    let answerFiles = [];
    for (const file of files || []) {
      const result = await uploadToCloudinary(file.buffer, "assessment_files");
      answerFiles.push({
        url: result.secure_url,
        filename: file.originalname,
        public_id: result.public_id,
      });
    }

    // Prepare final answers
    finalQuestionsubmitted =
      assessment.assessmentType === "file" ? [answers] : answers.answers;

    // ✅ Initialize scoring
    let totalScore = 0;
    let maxScore = 0;
    const needAssistantconcepts = [];
    const masteredConcept = [];

    const dueDate = new Date(assessment.dueDate.date).toISOString().split("T")[0];
    const dueTime = assessment.dueDate.time;
    const dueDateTime = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();
    let status = now > dueDateTime ? "after due date" : "before due date";

    const processedAnswers = finalQuestionsubmitted.map((ans) => {
      const question = assessment.questions.find(
        (q) => q._id.toString() === ans.questionId
      );
      if (!question) throw new Error("Invalid questionId in submission.");

      if (question.type === "mcq" || question.type === "truefalse") {
        const isCorrect = question.correctAnswer === ans.selectedAnswer;
        if (isCorrect && !masteredConcept.includes(question.concept)) {
          masteredConcept.push(question.concept);
        } else if (!isCorrect && !needAssistantconcepts.includes(question.concept)) {
          needAssistantconcepts.push(question.concept);
        }

        const pointsAwarded = isCorrect ? question.points : 0;
        totalScore += pointsAwarded;
        maxScore += question.points;

        return {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          isCorrect,
          status,
          pointsAwarded,
          requiresManualCheck: false,
        };
      } else if (question.type === "file") {
        return {
          questionId: ans.questionId,
          file: answerFiles,
          isCorrect: null,
          status,
          pointsAwarded: 0,
          requiresManualCheck: true,
        };
      } else {
        return {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          isCorrect: null,
          status,
          pointsAwarded: 0,
          requiresManualCheck: true,
        };
      }
    });

    const graded = processedAnswers.every((a) => !a.requiresManualCheck);



    // ✅ Save submission
    const submission = new Submission({
      assessment: assessmentId,
      studentId,
      answers: processedAnswers,
      status,
      totalScore,
      graded,
    });
    await submission.save();

    await updateGradebookOnSubmission(
      submission.studentId,
      assessment.course,
      submission.assessment,
      "assessment"
    );

    // ✅ Email Notification
    const student = await User.findById(studentId);

    let aiSummary = null;

    if (graded) {
      aiSummary = await generateAssessmentSummary({
        studentName: `${student.firstName} ${student.lastName}`,
        assessmentTitle: assessment.title,
        score: totalScore,
        maxScore,
        masteredConcept,
        needAssistantconcepts,
      });
    }

    if (student && student.email) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@acewallscholars.org",
          pass: "dmwjwyfxaccrdxwi",
        },
      });

      // Determine assessment context
      let assessmentContextText = "";
      if (lesson && chapter) assessmentContextText = `Assessment of lesson ${lesson.title}`;
      else if (chapter && !lesson) assessmentContextText = `Assessment of chapter ${chapter.title}`;
      else assessmentContextText = `Assessment`;

      let subject, html;
      if (graded) {
        subject = `Assessment Submitted and Graded: ${assessment.title}`;
        html = `
<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fb;">
  <div style="max-width: 600px; margin:auto; background: #fff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1)">
    
    <p>Dear ${student.firstName} ${student.lastName},</p>

    <p>You have completed <strong>${assessmentContextText}</strong>.</p>
    <p>Your score: <strong>${totalScore}/${maxScore}</strong></p>

    ${aiSummary
            ? `
        <div style="background:#f1f8ff; padding:15px; border-left:4px solid #1e88e5; margin:20px 0;">
          <h4 style="margin-top:0;">📘 AI Performance Summary</h4>
          <p>${aiSummary}</p>
        </div>
        `
            : ""
          }

    ${masteredConcept.length > 0
            ? `
        <p><strong>Concepts Mastered:</strong></p>
        <ul>${masteredConcept.map(c => `<li>${c}</li>`).join("")}</ul>
        `
            : ""
          }

    ${needAssistantconcepts.length > 0
            ? `
        <p><strong>Needs More Practice:</strong></p>
        <ul>${needAssistantconcepts.map(c => `<li>${c}</li>`).join("")}</ul>
        `
            : ""
          }

    <p>Keep learning and improving!</p>

    <p>Regards,<br><strong>Acewall Scholars Team</strong></p>
  </div>
</div>
`;
      } else {
        subject = `Assessment Submitted (Pending Grading): ${assessment.title}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fb;">
            <div style="max-width: 600px; margin:auto; background: #fff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1)">
              <p>Dear ${student.firstName} ${student.lastName},</p>
              <p>You have just completed ${assessmentContextText}. Your submission has been received and is awaiting teacher review.</p>
              <p>Once the grading is complete, you will receive another email notification.</p>
              <p>Regards,<br>Acewall Scholars Team</p>
            </div>
          </div>`;
      }

      // ✅ Respect guardian email preferences
      const preferences = student.guardianEmailPreferences || {
        submission: true,
        grading: true,
        announcement: true,
        assessments: true,
      };

      const notificationType = graded ? "grading" : "submission";
      const recipients = [student.email];

      if (
        student.guardianEmails?.length > 0 &&
        preferences[notificationType]
      ) {
        recipients.push(...student.guardianEmails);
      }

      const mailOptions = {
        from: `"Acewall Scholars" <support@acewallscholars.org>`,
        to: recipients,
        subject,
        html,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error("Error sending email:", emailErr);
      }
    }

    res.status(201).json({
      message: "Submission recorded successfully",
      submission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error submitting assessment",
      error: err.message,
    });
  }
};


export const getSubmissionsforStudent = async (req, res) => {
  try {
    const submissions = await Submission.find({
      studentId: req.params.studentId,
    })
      .populate("assessment")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching submissions", error: err.message });
  }
};

export const getSubmissionforAssessmentbyId = async (req, res) => {
  const studentId = req.user._id;
  const { assessmentId } = req.params;
  try {
    const submission = await Submission.findOne({
      studentId,
      assessment: assessmentId,
    });

    res.status(200).json({ message: "Submission found", submission });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching submission", error: err.message });
  }
};

export const getSubmissionById = async (req, res) => {
  const { submissionId } = req.params;

  try {
    const submission = await Submission.findById(submissionId).populate({
      path: "studentId",
      select: "firstName lastName email profileImg",
    });

    const assessment = await Assessment.findById(submission.assessment);

    const questionMap = {};
    assessment.questions.forEach((q) => {
      questionMap[q._id.toString()] = {
        question: q.question,
        file: q.files,
        type: q.type,
        points: q.points,
      };
    });

    const answersWithDetails = submission.answers.map((ans) => ({
      ...ans.toObject(),
      questionDetails: questionMap[ans.questionId],
    }));

    res.status(200).json({
      message: "Submission found",
      submission: {
        ...submission.toObject(),
        answers: answersWithDetails,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching submission", error: err.message });
  }
};

export const getSubmissionsofAssessment_forTeacher = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const submissions = await Submission.find({
      assessment: assessmentId,
    }).populate({
      path: "studentId",
      select: "firstName lastName email profileImg",
    });

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    const questionMap = {};
    assessment.questions.forEach((q) => {
      questionMap[q._id.toString()] = {
        question: q.question,
        type: q.type,
        points: q.points,
      };
    });

    const submissionsWithDetails = submissions.map((sub) => {
      const answersWithDetails = sub.answers.map((ans) => ({
        ...ans.toObject(),
        questionDetails: questionMap[ans.questionId],
      }));
      return {
        ...sub.toObject(),
        answers: answersWithDetails,
      };
    });

    res.status(200).json({
      message: "Submissions found",
      submissions: submissionsWithDetails,
    });
  } catch (err) {
    console.log("error in getting submission", err);
    res
      .status(500)
      .json({ message: "Error fetching submission", error: err.message });
  }
};

// export const checkbyTeacher = async (req, res) => {
//   try {
//     const { answers, feedback } = req.body;

//     const submission = await Submission.findById(req.params.id);
//     if (!submission)
//       return res.status(404).json({ message: "Submission not found" });

//     let totalScore = 0;

//     submission.answers = submission.answers.map((a) => {
//       const updated = answers.find(
//         (u) => u.questionId === a.questionId.toString()
//       );

//       if (a.requiresManualCheck && updated) {
//         a.pointsAwarded = updated.pointsAwarded;
//         a.isCorrect = undefined; // QA may not have a simple correct/incorrect
//         a.requiresManualCheck = false;
//       }

//       totalScore += a.pointsAwarded || 0;
//       return a;
//     });

//     submission.totalScore = totalScore;
//     submission.feedback = feedback || "";
//     submission.graded = true;
//     await submission.save();

//     res.json({ message: "Submission graded", submission });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error grading submission", error: err.message });
//   }
// };

export const teacherGrading = async (req, res) => {
  const { submissionId } = req.params;
  const manualGrades = req.body;

  try {
    const submission = await Submission.findById(submissionId).populate("studentId");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assessment = await Assessment.findById(submission.assessment);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // 🔁 Reset scores
    submission.totalScore = 0;
    let maxScore = 0;

    // ✅ Grade manual questions
    for (const questionId in manualGrades) {
      const { awardedPoints, maxPoints } = manualGrades[questionId];

      if (awardedPoints > maxPoints || awardedPoints < 0) {
        return res.status(400).json({
          message: `Points for question ${questionId} must be between 0 and ${maxPoints}`,
        });
      }

      const answer = submission.answers.find(
        (a) => String(a.questionId) === questionId
      );

      if (!answer) continue;

      const isCorrect = awardedPoints >= maxPoints / 2;

      answer.pointsAwarded = awardedPoints;
      answer.isCorrect = isCorrect;
      answer.requiresManualCheck = false;

      submission.totalScore += awardedPoints;
      maxScore += maxPoints;
    }

    submission.graded = true;
    await submission.save();

    // ✅ Update gradebook
    await updateGradebookOnSubmission(
      submission.studentId,
      assessment.course,
      submission.assessment,
      "assessment"
    );

    // ✅ Fetch context
    const student = submission.studentId;
    const course = await CourseSch.findById(assessment.course);

    let chapter = null;
    let lesson = null;
    if (assessment.chapter) chapter = await Chapter.findById(assessment.chapter);
    if (assessment.lesson) lesson = await Lesson.findById(assessment.lesson);

    // ✅ Concept tracking
    const masteredConcept = [];
    const needAssistantconcepts = [];

    for (const ans of submission.answers) {
      const question = assessment.questions.find(
        (q) => q._id.toString() === ans.questionId.toString()
      );
      if (!question) continue;

      if (ans.isCorrect) {
        if (!masteredConcept.includes(question.concept)) {
          masteredConcept.push(question.concept);
        }
      } else {
        if (!needAssistantconcepts.includes(question.concept)) {
          needAssistantconcepts.push(question.concept);
        }
      }
    }

    // ✅ Context label
    let assessmentContextText = "Assessment";
    if (lesson && chapter) assessmentContextText = `Assessment of lesson ${lesson.title}`;
    else if (chapter) assessmentContextText = `Assessment of chapter ${chapter.title}`;

    // ✅ Email
    if (student?.email) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@acewallscholars.org",
          pass: "dmwjwyfxaccrdxwi",
        },
      });

      // 🤖 AI Summary (safe)
      let aiSummary = null;
      try {
        aiSummary = await generateAssessmentSummary({
          studentName: `${student.firstName} ${student.lastName}`,
          assessmentTitle: assessment.title,
          score: submission.totalScore,
          maxScore,
          masteredConcept,
          needAssistantconcepts,
        });
      } catch (err) {
        console.error("AI summary failed:", err);
      }

      const subject = `Assessment Graded: ${assessment.title} - ${course.courseTitle}`;

      const html = `
<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fb;">
  <div style="max-width: 600px; margin:auto; background: #fff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1)">
    
    <p>Dear ${student.firstName} ${student.lastName},</p>

    <p>You have completed <strong>${assessmentContextText}</strong>.</p>
    <p>Your score: <strong>${submission.totalScore}/${maxScore}</strong></p>

    ${aiSummary
          ? `
      <div style="background:#f1f8ff; padding:15px; border-left:4px solid #1e88e5; margin:20px 0;">
        <h4 style="margin-top:0;">📘 AI Performance Summary</h4>
        <p>${aiSummary}</p>
      </div>`
          : ""
        }

    ${masteredConcept.length
          ? `<p><strong>Concepts Mastered:</strong></p>
           <ul>${masteredConcept.map(c => `<li>${c}</li>`).join("")}</ul>`
          : ""
        }

    ${needAssistantconcepts.length
          ? `<p><strong>Needs More Practice:</strong></p>
           <ul>${needAssistantconcepts.map(c => `<li>${c}</li>`).join("")}</ul>`
          : ""
        }

    <p>Keep learning and improving!</p>

    <p>Regards,<br><strong>Acewall Scholars Team</strong></p>
  </div>
</div>`;

      const preferences = student.guardianEmailPreferences || {};
      const recipients = [student.email];

      if (student.guardianEmails?.length && preferences.grading) {
        recipients.push(...student.guardianEmails);
      }

      await transporter.sendMail({
        from: `"Acewall Scholars" <support@acewallscholars.org>`,
        to: recipients,
        subject,
        html,
      });
    }

    res.json({ message: "Submission graded successfully", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error grading submission",
      error: err.message,
    });
  }
};

// export const TeachersAssessmentSubmissions = async (req, res) => {
//   const { submissionId } = req.params;
//   const { feedback, pointsAwarded } = req.body;
//   const { teacherId } = req.user._id;
//   try {
//     const submission = await Submission.findById(submissionId); // Assuming you have a Submission model
//     if (!submission) {
//       return res.status(404).json({ message: "Submission not found" });
//     }

//     submission.feedback = feedback;
//     submission.totalScore = pointsAwarded;
//     submission.graded = true;
//     await submission.save();

//     res.json({ message: "Submission graded", submission });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ message: "Error grading submission", error: err.message });
//   }
// };



export const getAssessmentSubmissionForParent = async (req, res) => {
  const { assessmentId, studentId } = req.params;
  const parentEmail = req.user.email;

  try {
    // 1. AUTHORIZATION CHECK
    const student = await User.findOne({
      _id: studentId,
      guardianEmails: parentEmail,
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Access denied.",
      });
    }

    // 2. FETCH SUBMISSION & POPULATE EVERYTHING
    const submission = await Submission.findOne({
      assessment: assessmentId,
      studentId: studentId,
    })
      .populate({
        path: "assessment",
        // We populate category for the name, and the questions array to show original prompts
        populate: [
          { path: "category", select: "name" },
          { path: "chapter", select: "title" },
          { path: "lesson", select: "title" }
        ]
      })
      .lean(); // Use lean() for easier data manipulation

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "No submission found for this student.",
      });
    }

    // 3. MAP QUESTIONS TO ANSWERS (Optional but helpful)
    // This merges the original question details into the answer object 
    // so the frontend doesn't have to look them up by ID.
    const detailedAnswers = submission.answers.map(answer => {
      const originalQuestion = submission.assessment.questions.find(
        q => q._id.toString() === answer.questionId.toString()
      );
      return {
        ...answer,
        questionData: originalQuestion // Includes question text, type, and max points
      };
    });

    // Re-attach the detailed answers
    submission.detailedAnswers = detailedAnswers;

    res.status(200).json({
      success: true,
      studentName: `${student.firstName} ${student.lastName}`,
      data: {
        assessmentTitle: submission.assessment.title,
        assessmentDescription: submission.assessment.description,
        category: submission.assessment.category?.name,
        type: submission.assessment.type,
        dueDate: submission.assessment.dueDate,

        // Submission specific data
        submittedAt: submission.submittedAt,
        status: submission.status,
        totalScore: submission.totalScore,
        graded: submission.graded,
        instructorFeedback: submission.feedback,

        // Combined question + answer data
        results: detailedAnswers
      }
    });
  } catch (error) {
    console.error("Error fetching submission for parent:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};