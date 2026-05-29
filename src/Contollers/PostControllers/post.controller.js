import Posts from "../../Models/PostModels/post.model.js";
import Enrollment from "../../Models/Enrollement.model.js";
import CourseSch from "../../Models/courses.model.sch.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
export const createPost = async (req, res) => {
  const { districtId, schoolId } = req.user;
  try {
    const { text, color, postType, courseId, googleDriveAsset } = req.body;
    const assets = req.files || [];
    const author = req.user._id;

    const uploadedFiles = assets.map(asset => {
      let fileType = 'file';
      if (asset.mimetype.startsWith('video/')) fileType = 'videos';
      else if (asset.mimetype.startsWith('image/')) fileType = 'image';

      return {
        url: `${process.env.ASSET_URL}uploads/${fileType}/${asset.filename}`,
        fileName: asset.originalname,
        type: asset.mimetype
      };
    });

    // Handle Google Drive asset if present
    if (googleDriveAsset) {
      try {
        const driveFile = JSON.parse(googleDriveAsset);
        uploadedFiles.push({
          url: driveFile.url,
          fileName: driveFile.filename || driveFile.publicId,
          type: driveFile.type || `${driveFile.resourceType}/${driveFile.format}`,
          source: 'google_drive',
          publicId: driveFile.publicId
        });
      } catch (err) {
        console.error("Error parsing Google Drive asset:", err);
      }
    }

    const postData = {
      text,
      assets: uploadedFiles, // Now correctly structured as an array of objects
      author,
      color,
      postType: postType || "public",
      districtId,
      schoolId,
    };

    // Only add course if postType is course AND courseId is a valid hex string
    if (postType === "course" && courseId && courseId.length === 24) {
      postData.course = courseId;
    }

    const post = new Posts(postData);
    await post.save();

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error("SAVING ERROR:", error);
    res.status(500).json({
      message: 'Internal Server error',
      details: error.message
    });
  }
}
export const getPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { districtId, schoolId } = req.user

    // 🎯 Get courseId from query params (e.g., /getPosts?courseId=123)
    const { courseId } = req.query;

    // 1️⃣ Find all courses this user is associated with
    let myCourseIds = [];
    if (userRole === "teacher" || userRole === "admin") {
      const ownedCourses = await CourseSch.find({ createdby: userId }).select("_id");
      myCourseIds = ownedCourses.map(c => c._id);
    } else {
      const enrollments = await Enrollment.find({ student: userId }).select("course");
      myCourseIds = enrollments.map(e => e.course);
    }

    // 2️⃣ Construct the Query
    let query = { districtId, schoolId };

    if (courseId && courseId !== "all") {
      // Check if the user has permission to see this specific course
      const hasAccess = myCourseIds.some(id => id.toString() === courseId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this course feed" });
      }
      query.postType = "course";
      query.course = courseId;
    } else {
      // Default: Show all Public posts OR Course posts from user's joined courses
      query = {
        $or: [
          { postType: "public", districtId, schoolId },
          { postType: "course", course: { $in: myCourseIds }, districtId, schoolId }
        ]
      };
    }



    // 3️⃣ Execute Query
    query.isDeleted = false;

    console.log("Query:", query)
    const totalPosts = await Posts.countDocuments(query);
    const posts = await Posts.find(query)
      .populate('author', '_id firstName middleName lastName profileImg')
      // Populate course info so we can show course code/title on the PostCard
      .populate('course', 'courseTitle courseCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalPosts,
      limit,
      posts,
    });

  } catch (error) {
    console.error("Error in getPosts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const specificUserPosts = async (req, res) => {
  const userId = req.params.id;
  const { includeDeleted } = req.query;
  const { districtId, schoolId } = req.user
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Build query based on includeDeleted parameter
    let query = { author: userId, districtId, schoolId };
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const totalPosts = await Posts.countDocuments(query);

    const posts = await Posts.find(query)
      .populate('author', '_id firstName middleName lastName profileImg')
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalPosts,
      limit,
      posts,
    });
  } catch (error) {
    console.log("Error in specificUserPosts", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export const deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // Find post first (don't delete yet)
    const post = await Posts.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Authorization check: only post author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // Delete assets from Cloudinary (Google Drive files) and local filesystem
    if (post.assets && post.assets.length > 0) {
      for (const asset of post.assets) {
        // Delete Google Drive files from Cloudinary
        if (asset.source === 'google_drive' && asset.publicId) {
          try {
            await cloudinary.uploader.destroy(asset.publicId, {
              resource_type: "auto",
            });
          } catch (cloudinaryError) {
            console.error(`Failed to delete Cloudinary file ${asset.publicId}:`, cloudinaryError);
            // Continue with deletion even if Cloudinary cleanup fails
          }
        }

        // Delete local files from filesystem
        if (asset.source === 'local' && asset.url) {
          try {
            const filePath = asset.url.replace(process.env.ASSET_URL, '');
            const fullPath = path.join(process.cwd(), 'public', filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } catch (fsError) {
            console.error(`Failed to delete local file ${asset.url}:`, fsError);
            // Continue with deletion even if file deletion fails
          }
        }
      }
    }

    // Soft delete the post
    await Posts.findByIdAndUpdate(postId, { isDeleted: true });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const restorePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // Find post first
    const post = await Posts.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Authorization check: only post author can restore
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to restore this post" });
    }

    // Restore the post
    await Posts.findByIdAndUpdate(postId, { isDeleted: false });

    res.status(200).json({ message: "Post restored successfully" });
  } catch (error) {
    console.error("Error in restorePost:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
