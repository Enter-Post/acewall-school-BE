import mongoose from "mongoose";
import Conversation from "../Models/conversation.model.js";
import Enrollment from "../Models/Enrollement.model.js";

export const createConversation = async (req, res) => {
  const myId = req.user._id;
  const memeberId = req.body.memberId;

  try {
    if (memeberId === myId) {
      return res
        .status(400)
        .json({ message: "You can't create conversation with yourself" });
    }

    const existingConversation = await Conversation.findOne({
      members: { $all: [myId, memeberId] },
    });
    console.log(existingConversation, "existingConversation");

    if (existingConversation) {
      return res.status(200).json({
        message: "Conversation already exist",
        conversation: existingConversation,
      });
    }

    const newConversation = new Conversation({
      members: [myId, memeberId],
    });
    await newConversation.save();
    res.status(200).json({
      message: "conversation created successfully",
      newConversation,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getMyConversations = async (req, res) => {
  const myId = req.user._id;
  try {
    const conversations = await Conversation.find({ members: myId }).populate({
      path: "members",
      select: "firstName lastName profileImg",
    });

    const formattedConversations = conversations.map((conversation) => {
      const otherMember = conversation.members.find(
        (member) => member._id.toString() !== myId.toString()
      );

      return {
        conversationId: conversation._id,
        otherMember: {
          name: `${otherMember.firstName} ${otherMember.lastName}`,
          profileImg: otherMember.profileImg,
        },
      };
    });

    res.status(200).json({
      message: "Conversations fetched successfully",
      conversations: formattedConversations,
    });
  } catch (err) {
    console.log("error in getMyConversations", err);

    res.status(500).json(err);
  }
};

// export const getConversationbyId = async (req, res) => {
//   const { id } = req.params;
//   const myId = req.user._id;

//   console.log(myId, "myId");

//   // ✅ Properly validate ObjectId
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: "Invalid conversation ID" });
//   }

//   const conversationId = new mongoose.Types.ObjectId(id);

//   console.log(conversationId, "conversationId");

//   try {
//     const conversation = await Conversation.findOne({
//       _id: conversationId,
//     }).populate({
//       path: "members",
//       select: "firstName lastName profileImg",
//     });


//     console.log(conversation, "conversation");
//   } catch (err) {
//     console.error("Error in getConversationbyId:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };



export const getTeacherforStudent = async (req, res) => {
  const studentId = req.user._id;

  try {
    const teachers = await Enrollment.aggregate([
      {
        $match: { student: new mongoose.Types.ObjectId(studentId) }
      },
      {
        $lookup: {
          from: "coursesches",
          localField: "course",
          foreignField: "_id",
          as: "courseData"
        }
      },
      { $unwind: "$courseData" },
      {
        $lookup: {
          from: "users",
          localField: "courseData.createdby",
          foreignField: "_id",
          as: "teacher"
        }
      },
      { $unwind: "$teacher" },
      {
        $group: {
          _id: "$teacher._id",
          firstName: { $first: "$teacher.firstName" },
          middleName: { $first: "$teacher.middleName" },
          lastName: { $first: "$teacher.lastName" },
          profileImg: { $first: "$teacher.profileImg" },
          courses: {
            $addToSet: {
              courseId: "$courseData._id",
              courseTitle: "$courseData.courseTitle"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          teacherId: "$_id",
          firstName: 1,
          middleName: 1,
          lastName: 1,
          courses: 1
        }
      }
    ]);


    console.log(teachers, "teachers")

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: "No teacher found" });
    }

    res.status(200).json({
      message: "Teachers fetched successfully",
      teachers
    });

  } catch (error) {
    console.error("Error fetching teacher for student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};