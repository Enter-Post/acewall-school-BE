import mongoose from "mongoose";

import Category from "../Models/category.model.js";
import Subcategory from "../Models/subcategory.model.js";
import CourseSch from "../Models/courses.model.sch.js";


export const getAllCategories = async (req, res) => {
  const { districtId, schoolId } = req.user
  try {
    const categories = await Category.find({ isDeleted: false, districtId, schoolId });

    return res.status(200).json({
      categories,
      message: "Categories fetched successfully",
    });
  } catch (error) {
    console.log("error in fetchinggggg categories==>", error.message);
    return res.status(500).json({
      message: "Some this Went Wrong, sorry for inconvenience",
    });
  }
};

export const createCategory = async (req, res) => {
  const { title } = req.body;
  const { districtId, schoolId } = req.user

  try {

    console.log("schoolId:", schoolId)
    console.log("districtId:", districtId)

    if (!title || !districtId || !schoolId) {
      return res.status(400).json({
        error: true,
        message: "Please fill all the fields",
      });
    }

    const isExist = await Category.findOne({ title, districtId, schoolId });
    if (isExist) {
      return res.status(400).json({
        error: true,
        message: "Category with this name already exist",
      });
    }

    const category = await Category.create({
      title,
      districtId,
      schoolId,
    });
    return res.status(200).json({
      category,
      message: "Category Created Successfully",
    });
  } catch (error) {
    console.log("error in creating category==>", error.message);
    return res.status(500).json({
      message: "Some this Went Wrong, sorry for inconvenience",
    });
  }
};



export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { districtId, schoolId } = req.user

  if (!categoryId) {
    return res.status(400).json({
      error: true,
      message: "Please provide the category ID",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      error: true,
      message: "Invalid category ID",
    });
  }

  try {
    const courseCount = await CourseSch.countDocuments({ category: categoryId, isDeleted: false });

    if (courseCount > 0) {
      return res.status(400).json({
        error: true,
        message: "Category contains courses and cannot be deleted",
      });
    }

    const category = await Category.findByIdAndUpdate(categoryId, { isDeleted: true });

    if (!category) {
      return res.status(404).json({
        error: true,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      category,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    return res.status(500).json({
      error: true,
      message: "Something went wrong, sorry for the inconvenience",
    });
  }
};

export const getCategoriesforAdmin = async (req, res) => {
  const { districtId, schoolId } = req.user

  try {
    const categories = await Category.aggregate([
      {
        $match: {
          isDeleted: false,
          districtId: new mongoose.Types.ObjectId(districtId),
          schoolId: new mongoose.Types.ObjectId(schoolId)
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "category",
          as: "subcategories",
        },
      },
    ])

    return res.status(200).json({
      categories,
      message: "Categories fetched successfully",
    });
  } catch (error) {
    console.log("error in fetching categories==>", error.message);
    return res.status(500).json({
      message: "Some this Went Wrong, sorry for inconvenience",
    });
  }
};

export const getSubcategoriesByCategoryId = async (req, res) => {
  const { districtId, schoolId } = req.user
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required." });
    }

    const subcategories = await Subcategory.find({
      category: categoryId,
    }).populate("category", "title");

    if (!subcategories.length) {
      return res
        .status(404)
        .json({ message: "No subcategories found for this category." });
    }

    return res.status(200).json({
      subcategories,
      message: "Subcategories fetched successfully.",
    });
  } catch (error) {
    console.error(
      "Error fetching subcategories by category ID =>",
      error.message
    );
    return res.status(500).json({
      message: "Something went wrong while fetching subcategories.",
    });
  }
};

export const editCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { title } = req.body;
  const { districtId, schoolId } = req.user
  try {
    if (!categoryId || !title) {
      return res.status(400).json({
        error: true,
        message: "Category ID and new title are required.",
      });
    }

    // Check for duplicate title
    const existing = await Category.findOne({
      title,
      _id: { $ne: categoryId },
    });
    if (existing) {
      return res.status(400).json({
        error: true,
        message: "Another category with this title already exists.",
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { title },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        error: true,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      category: updatedCategory,
      message: "Category updated successfully.",
    });
  } catch (error) {
    console.error("Error updating category:", error.message);
    return res.status(500).json({
      error: true,
      message: "Something went wrong while updating the category.",
    });
  }
};