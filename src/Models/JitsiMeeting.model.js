// models/JitsiMeeting.js
import mongoose from "mongoose";

const JitsiMeetingSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "CourseSch", 
    required: true 
  },
  // Topic helps identify the specific lecture (e.g., "Introduction to React")
  topic: { 
    type: String, 
    required: true,
    trim: true
  },
  // The unique string for the Jitsi URL
  roomName: { 
    type: String, 
    required: true,
    unique: true 
  },
  // The random password for this session
  password: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // 'scheduled' = created but not yet started
  // 'active' = currently live
  // 'ended' = session finished
  status: { 
    type: String, 
    enum: ["scheduled", "active", "ended"], 
    default: "scheduled" 
  },
  // The date and time the teacher PLANS to start the meeting
  scheduledAt: { 
    type: Date, 
    required: true 
  },
  // When the teacher actually clicks "Start"
  startedAt: { 
    type: Date 
  },
  // When the teacher clicks "End Session"
  endedAt: { 
    type: Date 
  }
}, { timestamps: true });

// Optimized for fetching upcoming or live meetings for a specific course
JitsiMeetingSchema.index({ course: 1, status: 1, scheduledAt: 1 });

export const JitsiMeeting = mongoose.model("JitsiMeeting", JitsiMeetingSchema);