import express from "express";
import { 
    endMeeting, 
    getMeetingAccess, 
    scheduleNewMeeting, 
    getCourseMeetings,
    getGlobalSchedule, // 👈 Add this
    deleteMeeting
} from "../Contollers/Jitsi.Controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

// 1. Get all scheduled meetings across the WHOLE LMS (for conflict checking)
router.get("/global-schedule", isUser, getGlobalSchedule);

// 2. Access live meeting (Student or Teacher starting session)
router.get("/access/:courseId", isUser, getMeetingAccess);

// 3. Get list of meetings for ONE specific course
router.get("/course/:courseId", isUser, getCourseMeetings);

// 4. Teacher schedules a future meeting (with conflict check)
router.post("/schedule", isUser, scheduleNewMeeting);

// 5. Teacher ends an active meeting
router.post("/end", isUser, endMeeting);
router.delete("/delete/:meetingId", isUser, deleteMeeting);

export default router;