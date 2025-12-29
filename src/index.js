import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/connectDB.js";
import { app, server, io } from "./lib/socket.io.js";

/// Routes
import authRoutes from "./Routes/Auth.Routes.js";
import categoryRoutes from "./Routes/Category.Routes.js";
import coursesRoutes from "./Routes/CourseRoutes/Courses.Routes.js";
import chapterRouter from "./Routes/CourseRoutes/Chapter.Routes.js";
import lessonRoutes from "./Routes/CourseRoutes/Lesson.Routes.js";
import commentRoutes from "./Routes/Comment.Routes.js";
import ratingRoutes from "./Routes/Rating.Routes.js";
import messegesRoutes from "./Routes/Message.Routes.js";
import conversationRoutes from "./Routes/conversation.Route.js";
import purchasesRoutes from "./Routes/Purchase.Routes.js";
import subCategoryRoutes from "./Routes/subCategory.Routes.js";
import assessmentRoutes from "./Routes/Assessment.Routes.js";
import AssessmentCategoryRoutes from "./Routes/Assessment-category.Routes.js";
import announcementRoutes from "./Routes/Annoucement.Routes.js";
import discussionRoutes from "./Routes/Discussion/Descussion.Routes.js";
import enrollmentRoutes from "./Routes/Enrollement.Routes.js";
import submissionRoutes from "./Routes/Submission.Routes.js";
import adminRoutes from "./Routes/Admin.Routes.js";
import newsletter from "./Routes/Newsletter.Routes.js";
import gredesRoutes from "./Routes/gradebook.Routes.js";
import supportRoutes from "./Routes/Support.Route.js";
import discussionCommentRoutes from "./Routes/Discussion/discussionComment.Routes.js";
import replyDiscussionRoutes from "./Routes/Discussion/Replydiscussion.Routes.js";
import semesterRoutes from "./Routes/CourseRoutes/semester.Routes.js";
import quarterRoutes from "./Routes/CourseRoutes/Quarter.Routes.js";
import pagesRoutes from "./Routes/Pages.Routes.js";
import gpaRoutes from "./Routes/GPA.Routes.js";
import contactRoutes from "./Routes/Contact.Routes.js";
import postRoutes from "./Routes/PostRoutes/Post.Routes.js";
import likesRoutes from "./Routes/PostRoutes/PostLikes.Routes.js";
import postCommentRoutes from "./Routes/PostRoutes/PostComment.Routes.js";
import emailNotificationRoutes from "./Routes/EmailNotification.Routes.js";
import StandardGradingRoutes from "./Routes/StandardGrading.Routes.js";
import aiChatRoutes from "./Routes/AIChat.Routes.js";
import parentRoutes from "./Routes/Parent.Routes.js";
import "./cronJobs/assessmentReminder.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const PORT = process.env.PORT || 5051;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://acewallscholars.vercel.app",
      "https://acewall-admin.vercel.app",
      "https://acewallscholarslearningonline.com",
      "https://admin.acewallscholarslearningonline.com",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subCategoryRoutes);
app.use("/api/course", coursesRoutes);
app.use("/api/chapter", chapterRouter);
app.use("/api/lesson", lessonRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/messeges", messegesRoutes);
app.use("/api/purchase", purchasesRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/assessmentCategory", AssessmentCategoryRoutes);
app.use("/api/gradebook", gredesRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/assessmentSubmission", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", newsletter);
app.use("/api/support", supportRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/contact", contactRoutes);

app.use("/api/discussion", discussionRoutes);
app.use("/api/discussionComment", discussionCommentRoutes);
app.use("/api/replyDiscussion", replyDiscussionRoutes);
app.use("/api/semester", semesterRoutes);
app.use("/api/quarter", quarterRoutes);
app.use("/api/gpa", gpaRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/postlike", likesRoutes);
app.use("/api/postComment", postCommentRoutes);
app.use("/api/emailnotification", emailNotificationRoutes)
app.use("/api/standardGrading", StandardGradingRoutes)
app.use("/api/aichat", aiChatRoutes)
app.use("/api/parent", parentRoutes);
server.listen(PORT, () => {
  connectDB();
  console.log(`This app is running on localhost ${PORT}`);
});
