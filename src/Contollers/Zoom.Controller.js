import { ZoomMeeting } from "../Models/ZoomMeeting.model.js";
import CourseSch from "../Models/courses.model.sch.js";
import { Notification } from "../Models/Notification.model.js"; // Assuming we want to notify like Jitsi did
import Enrollment from "../Models/Enrollement.model.js";

// Helper to get Zoom Access Token
// Cached token variable (in-memory)
let cachedToken = null;
let tokenExpiresAt = 0;

const getZoomAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Missing Zoom credentials in .env");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Zoom Auth Failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Set expiry slightly before actual expiry (e.g. 5 mins buffer)
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
};

// Helper: End Zoom Meeting
const updateZoomMeetingStatus = async (zoomMeetingId, action = "end") => {
  try {
    const token = await getZoomAccessToken();
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${zoomMeetingId}/status`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      },
    );

    if (!response.ok && response.status !== 404) {
      const err = await response.json();
      console.error(`Zoom Status Update Error (${action}):`, err);
    }
  } catch (error) {
    console.error("Failed to update Zoom meeting status:", error.message);
  }
};

// 1. Schedule a Meeting
export const scheduleMeeting = async (req, res) => {
  const { courseId, topic, scheduledAt, duration = 40 } = req.body;
  const userId = req.user._id;

  try {
    // Verify Teacher
    const course = await CourseSch.findById(courseId);
    if (!course || course.createdby.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized. Only the course teacher can schedule meetings.",
      });
    }

    const token = await getZoomAccessToken();
    const startTime = new Date(scheduledAt).toISOString();

    // Create Zoom Meeting
    const zoomResponse = await fetch(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic || `Class Session: ${course.courseTitle}`,
          type: 2, // Scheduled meeting
          start_time: startTime,
          duration: duration, // Default 40 for free plan
          timezone: "UTC", // Or user's timezone if available
          settings: {
            host_video: true,
            participant_video: false,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
          },
        }),
      },
    );

    if (!zoomResponse.ok) {
      const err = await zoomResponse.json();
      throw new Error(`Zoom API Error: ${JSON.stringify(err)}`);
    }

    const zoomData = await zoomResponse.json();

    // Save to DB
    const newMeeting = await ZoomMeeting.create({
      course: courseId,
      topic: topic,
      meetingId: zoomData.id.toString(),
      startUrl: zoomData.start_url,
      joinUrl: zoomData.join_url,
      password: zoomData.password,
      duration: zoomData.duration,
      scheduledAt: new Date(scheduledAt),
      createdBy: userId,
      status: "scheduled",
    });

    // --- NOTIFICATIONS ---
    try {
      const enrollments = await Enrollment.find({ course: courseId });
      if (enrollments.length > 0) {
        const notificationEntries = enrollments.map((enrol) => ({
          recipient: enrol.student,
          sender: userId,
          message: `New Zoom Class Scheduled: ${topic || course.courseTitle}`,
          type: "live-class",
          link: `/student/mycourses/live-list/${courseId}`,
        }));

        await Notification.insertMany(notificationEntries);
      }
    } catch (notifError) {
      console.error("Notification Error (Non-blocking):", notifError);
    }

    res
      .status(201)
      .json({ message: "Zoom meeting scheduled", meeting: newMeeting });
  } catch (error) {
    console.error("Schedule Error:", error);
    res
      .status(500)
      .json({ message: "Failed to schedule meeting", error: error.message });
  }
};

// 2. Get Course Meetings
export const getCourseMeetings = async (req, res) => {
  const { courseId } = req.params;
  try {
    const meetings = await ZoomMeeting.find({ course: courseId }).sort({
      scheduledAt: 1,
    });
    res.status(200).json(meetings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching meetings", error: error.message });
  }
};

// 2.1 Get All Active Meetings for Student
export const getActiveMeetings = async (req, res) => {
  const userId = req.user._id;
  try {
    const enrollments = await Enrollment.find({ student: userId }).select(
      "course",
    );
    const courseIds = enrollments.map((e) => e.course);

    const activeMeetings = await ZoomMeeting.find({
      course: { $in: courseIds },
      status: { $in: ["active", "started"] },
    }).populate("course", "courseTitle");

    res.status(200).json(activeMeetings);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching active meetings",
      error: error.message,
    });
  }
};

// 3. Delete Meeting
export const deleteMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  try {
    const meeting = await ZoomMeeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    if (meeting.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Try to end and delete from Zoom
    try {
      const token = await getZoomAccessToken();
      // First, try to end the meeting if it's active
      await updateZoomMeetingStatus(meeting.meetingId, "end");

      // Then delete
      await fetch(`https://api.zoom.us/v2/meetings/${meeting.meetingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (zErr) {
      console.error("Zoom delete warning:", zErr.message);
      // Continue to delete from DB even if Zoom fails (e.g. already deleted)
    }

    await ZoomMeeting.findByIdAndDelete(meetingId);
    res.status(200).json({ message: "Meeting deleted and ended" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting meeting", error: error.message });
  }
};

// 4. Start/Join Meeting
// This endpoint returns the relevant URL based on who is asking.
export const joinMeeting = async (req, res) => {
  const { meetingId } = req.params; // DB ID, not Zoom ID
  const userId = req.user._id;
  // Assuming req.user has role or we check course ownership
  // But typically we can just check if user is creator

  try {
    const meeting = await ZoomMeeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    // Check if meeting has ended
    if (meeting.status === "ended") {
      return res.status(400).json({
        message: "This meeting has ended and cannot be joined",
        status: "ended",
      });
    }

    const isHost = meeting.createdBy.toString() === userId.toString();

    // Return appropriate URL
    if (isHost) {
      // If host joins, mark meeting as active in DB
      if (meeting.status !== "ended") {
        meeting.status = "active";
        await meeting.save();
      }
      res
        .status(200)
        .json({ url: meeting.startUrl, role: "host", status: meeting.status });
    } else {
      res
        .status(200)
        .json({
          url: meeting.joinUrl,
          role: "student",
          status: meeting.status,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error joining meeting", error: error.message });
  }
};

// 5. End Meeting (Manual)
export const endMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  try {
    const meeting = await ZoomMeeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    if (meeting.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (meeting.status === "ended") {
      return res.status(400).json({ message: "Meeting already ended" });
    }

    // End the meeting on Zoom
    await updateZoomMeetingStatus(meeting.meetingId, "end");

    // Update status in database
    meeting.status = "ended";
    await meeting.save();

    res.status(200).json({ message: "Meeting ended successfully", meeting });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error ending meeting", error: error.message });
  }
};

// 6. Zoom Webhook Handler
export const handleZoomWebhook = async (req, res) => {
  const event = req.body;

  // Zoom Webhook Verification (De-validation)
  if (event.event === "endpoint.url_validation") {
    const plainToken = event.payload.plainToken;
    const crypto = await import("crypto");
    const hash = crypto
      .createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET || "")
      .update(plainToken)
      .digest("hex");

    return res.status(200).json({
      plainToken: plainToken,
      encryptedToken: hash,
    });
  }

  const { event: eventType, payload } = event;
  const zoomMeetingId = payload?.object?.id?.toString();

  if (!zoomMeetingId) return res.status(200).send("OK");

  try {
    if (eventType === "meeting.started") {
      await ZoomMeeting.findOneAndUpdate(
        { meetingId: zoomMeetingId },
        { status: "active" },
      );
    } else if (eventType === "meeting.ended") {
      await ZoomMeeting.findOneAndUpdate(
        { meetingId: zoomMeetingId },
        { status: "ended" },
      );
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  res.status(200).send("OK");
};
