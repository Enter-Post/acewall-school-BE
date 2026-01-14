import crypto from "crypto";
import { JitsiMeeting } from "../Models/JitsiMeeting.model.js";
import CourseSch from "../Models/courses.model.sch.js";
import Enrollment from "../Models/Enrollement.model.js";
import { Notification } from "../Models/Notification.model.js";
/**
 * 1. Schedule a Meeting (Teacher Only)
 */
export const scheduleNewMeeting = async (req, res) => {
  const { courseId, topic, scheduledAt } = req.body;
  const userId = req.user._id;

  try {
    const newStartTime = new Date(scheduledAt);

    // 1. Verify user is the teacher of this specific course
    const course = await CourseSch.findById(courseId);
    if (!course || course.createdby.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2. Generate Unique Room Details
    // We use a random suffix so that multiple classes at the same time don't collide
    const uniqueRoom = `LMS-${courseId.slice(-5)}-${crypto
      .randomBytes(4)
      .toString("hex")}`;
    const randomPass = crypto.randomBytes(4).toString("hex");

    // 3. Create the meeting (Conflict check removed to allow concurrent sessions)
    const meeting = await JitsiMeeting.create({
      course: courseId,
      topic,
      roomName: uniqueRoom,
      password: randomPass,
      scheduledAt: newStartTime,
      createdBy: userId,
      status: "scheduled",
    });

    res
      .status(201)
      .json({ message: "Meeting scheduled successfully", meeting });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to schedule", error: error.message });
  }
};

export const getGlobalSchedule = async (req, res) => {
  try {
    const meetings = await JitsiMeeting.find({
      status: { $in: ["scheduled", "active"] },
      scheduledAt: { $gte: new Date() }, // Only future meetings
    }).sort({ scheduledAt: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching global schedule" });
  }
};
/**
 * 2. Get All Meetings for a Course (List view)
 */
export const getCourseMeetings = async (req, res) => {
  const { courseId } = req.params;
  try {
    const meetings = await JitsiMeeting.find({ course: courseId }).sort({
      scheduledAt: -1,
    }); // Newest first
    res.status(200).json(meetings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching meetings", error: error.message });
  }
};

/**
 * 3. Access/Start Meeting
 */
// Add this to your Jitsi Controller
// Inside your Jitsi Controller
export const getMeetingAccess = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  try {
    let meeting = await JitsiMeeting.findOne({
      course: courseId,
      status: { $in: ["active", "scheduled"] },
    });

    let isNewInstantMeeting = false;

    if (!meeting) {
      const course = await CourseSch.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      const uniqueRoom = `LMS-${courseId.slice(-5)}-${crypto
        .randomBytes(3)
        .toString("hex")}`;

      meeting = await JitsiMeeting.create({
        course: courseId,
        topic: `Live Class: ${course.courseTitle}`,
        roomName: uniqueRoom,
        password: crypto.randomBytes(4).toString("hex"),
        scheduledAt: new Date(),
        createdBy: userId,
        status: "active",
      });

      isNewInstantMeeting = true;

      // --- TRIGGER NOTIFICATIONS ---
      // 1. Find all students enrolled in this specific course
      const enrollments = await Enrollment.find({ course: courseId });

      console.log(
        `Found ${enrollments.length} enrolled students for course ${courseId}`
      );

      if (enrollments.length > 0) {
        // Inside Jitsi Controller - Update the link to match your App.jsx structure
        const notificationEntries = enrollments.map((enrol) => ({
          recipient: enrol.student,
          sender: userId,
          message: `Live class started: ${course.courseTitle}`,
          type: "live-class",
          // CHANGED: Match your React Router path exactly
          link: `/student/mycourses/live-meeting/${courseId}`,
        }));

        // 2. Insert into the Notification collection
        await Notification.insertMany(notificationEntries);
        console.log("Notifications successfully saved to Database.");
      }
    }

    if (meeting.status === "scheduled") {
      meeting.status = "active";
      await meeting.save();
    }

    res.status(200).json({
      roomName: meeting.roomName,
      password: meeting.password,
      displayName: req.user.firstName || "Teacher",
      isModerator: meeting.createdBy.toString() === userId.toString(),
      status: meeting.status,
      notified: isNewInstantMeeting,
    });
  } catch (error) {
    console.error("DETAILED ERROR:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * 4. End Meeting
 */
// Import your Notification model at the top
// import Notification from "../models/Notification.js"; 

export const endMeeting = async (req, res) => {
  const { roomName } = req.body;
  const userId = req.user._id;

  try {
    // 1. Find and update the meeting
    const meeting = await JitsiMeeting.findOne({ roomName, status: "active" });
    if (!meeting)
      return res.status(404).json({ message: "Active meeting not found." });

    if (meeting.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    meeting.status = "ended";
    meeting.endedAt = Date.now();
    await meeting.save();

    // 2. Update all relevant notifications
    // We use a Case-Insensitive Regex to find the roomName inside the link string
    await Notification.updateMany(
      { link: { $regex: roomName, $options: 'i' } },
      { $set: { isEnded: true } }
    );

    res.status(200).json({ message: "Meeting ended and student links deactivated." });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

/**
 * 5. Delete a Scheduled Meeting
 */
export const deleteMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  try {
    const meeting = await JitsiMeeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    // Security: Only the creator of the meeting can delete it
    if (meeting.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message:
          "Unauthorized. Only the meeting creator can delete this session.",
      });
    }

    // You can only delete scheduled or ended meetings, not active ones
    if (meeting.status === "active") {
      return res.status(400).json({
        message: "Cannot delete an active meeting. End the meeting first.",
      });
    }

    await JitsiMeeting.findByIdAndDelete(meetingId);

    console.log(`🗑️ Meeting ${meetingId} deleted by user ${userId}`);
    res.status(200).json({ message: "Meeting deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting meeting", error: error.message });
  }
};
