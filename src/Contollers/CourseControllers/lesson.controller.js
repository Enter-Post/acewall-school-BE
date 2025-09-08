import { uploadToCloudinary } from "../../lib/cloudinary-course.config.js";
import Lesson from "../../Models/lesson.model.sch.js";
import { v2 as cloudinary } from "cloudinary";

export const createLesson = async (req, res) => {
  const createdby = req.user._id;
  const { title, description, youtubeLinks, otherLink, chapter } = req.body;
  const pdfFiles = req.files;

  try {
    let uploadedFiles = [];

    if (pdfFiles && pdfFiles.length > 0) {
      for (const file of pdfFiles) {
        const result = await uploadToCloudinary(file.buffer, "lesson_pdfs");

        uploadedFiles.push({
          url: result.secure_url,
          public_id: result.public_id,
          filename: file.originalname,
        });
      }
    }

    const newLesson = new Lesson({
      title,
      description,
      youtubeLinks,
      otherLink,
      pdfFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined, // If no PDF files, set as undefined
      chapter,
      createdby,
    });

    await newLesson.save();

    res.status(201).json({ message: "Lesson created successfully", newLesson });
  } catch (error) {
    console.log("error in creating lesson", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteLesson = async (req, res) => {
  const { lessonId } = req.params;
  try {
    const lesson = await Lesson.findOneAndDelete({ _id: lessonId });
    if (!lesson)
      return res
        .status(404)
        .json({ message: "No lesson found for this course" });

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.log("error in deleting lesson", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLessons = async (req, res) => {
  const { chapterId } = req.params;
  try {
    const lessons = await Lesson.find({ chapter: chapterId });
    if (!lessons)
      return res
        .status(404)
        .json({ message: "No lesson found for this course" });

    res.status(200).json({ message: "Lessons found successfully", lessons });
  } catch (error) {
    console.log("error in getting lessons", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { title, description, youtubeLinks, otherLink } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title and description are required" });
  }

  try {
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { title, description, youtubeLinks, otherLink },
      { new: true, runValidators: true }
    );

    if (!updatedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res
      .status(200)
      .json({ message: "Lesson edited successfully", lesson: updatedLesson });
  } catch (error) {
    console.error("Error editing lesson:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteFile = async (req, res) => {
  const { lessonId, fileId } = req.params;

  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const fileIndex = lesson.pdfFiles.findIndex(
      (file) => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = lesson.pdfFiles[fileIndex];

    await cloudinary.uploader.destroy(file.public_id, {
      resource_type: "raw",
    });

    lesson.pdfFiles.splice(fileIndex, 1);
    await lesson.save();

    return res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getallFilesofLesson = async (req, res) => {
  const { lessonId } = req.params;

  try {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    let totalSizeinMB = 0;

    const filesWithSize = await Promise.all(
      lesson.pdfFiles.map(async (file) => {
        try {
          const metadata = await cloudinary.api.resource(file.public_id);
          totalSizeinMB += metadata.bytes / (1024 * 1024);
          return {
            ...file._doc,
            size: metadata.bytes, // size in bytes
            readableSize: `${(metadata.bytes / (1024 * 1024)).toFixed(2)}`, // optional: human-readable
          };
        } catch (err) {
          console.error(`Failed to fetch metadata for ${file.public_id}:`, err);
          return { ...file._doc, size: null, readableSize: "Unavailable" };
        }
      })
    );

    console.log(totalSizeinMB, "totalSizeinMB");

    res.status(200).json({
      message: "Files with sizes fetched successfully",
      files: filesWithSize,
      totalSizeinMB: totalSizeinMB.toFixed(2),
    });
  } catch (error) {
    console.log("Error in getting all files:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addMoreFiles = async (req, res) => {
  const { lessonId } = req.params;
  const pdfFiles = req.files;

  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    for (const file of pdfFiles) {
      const result = await uploadToCloudinary(file.buffer, "lesson_files");
      lesson.pdfFiles.push({
        url: result.secure_url,
        filename: file.originalname,
        public_id: result.public_id,
      });
    }

    await lesson.save();

    res.status(200).json({ message: "Files added successfully" });
  } catch (error) {
    console.error("Error adding files:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
