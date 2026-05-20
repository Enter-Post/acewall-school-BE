/**
 * School Controller
 * CRUD operations for school management
 * District admin can only manage schools in their district
 * Super admin can manage all schools
 */

import School from "../Models/school.model.js";
import { ROLES } from "../modules/rbac/roles.js";
import * as PERMISSIONS from "../modules/rbac/permissions.js";
import User from "../Models/user.model.js";
import CourseSch from "../Models/courses.model.sch.js";

/**
 * Create a new school
 * POST /api/schools
 * Requires: SCHOOL_CREATE permission or district_admin role
 */
export const createSchool = async (req, res) => {
  try {
    const { districtId } = req.user
    const { name, email, phone, homeAddress, website, externalIds, settings } = req.body;

    const file = req.file
    console.log("file:", file)

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        error: true,
        message: "Name, email, and phone are required",
      });
    }

    // Determine district for the school
    let schoolDistrictId = districtId;

    // Super admin can specify any district
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      // Non-super admins can only create in their district
      schoolDistrictId = req.user.districtId;
    }

    if (!schoolDistrictId) {
      return res.status(400).json({
        error: true,
        message: "District ID is required",
      });
    }

    // Check if school with same email already exists
    const existingSchool = await School.findOne({ email, isDeleted: false });
    if (existingSchool) {
      return res.status(409).json({
        error: true,
        message: "School with this email already exists",
      });
    }

    // Create school
    const school = new School({
      name,
      email,
      phone,
      homeAddress,
      website,
      districtId: schoolDistrictId,
      externalIds: externalIds || {},
      settings: settings || {},
      active: true,
    });

    await school.save();

    res.status(201).json({
      success: true,
      message: "School created successfully",
      data: school,
    });
  } catch (error) {
    console.error("Error creating school:", error);
    res.status(500).json({
      error: true,
      message: "Failed to create school",
      details: error.message,
    });
  }
};

/**
 * Get all schools
 * GET /api/schools
 * Filtered by district for non-super-admins
 */
export const getSchools = async (req, res) => {
  try {
    const { active, search, page = 1, limit = 20 } = req.query;
    // Build query
    let query = { isDeleted: false };
    const districtId = req.user.districtId;

    // Filter by district (except super admin)
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      query.districtId = districtId;
    }

    console.log("query in getSchool: ", query)

    // Filter by active status
    if (active !== undefined) {
      query.active = active === "true";
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const schools = await School.find({ districtId: districtId.toString() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log("schools in getSchool: ", schools)

    const total = await School.countDocuments(query);

    res.status(200).json({
      success: true,
      data: schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch schools",
      details: error.message,
    });
  }
};

/**
 * Get school by ID
 * GET /api/schools/:id
 */
export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findOne({ _id: id, isDeleted: false });

    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // Check district access
    if (req.user.role !== ROLES.SUPER_ADMIN && school.districtId.toString() !== req.user.districtId.toString()) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error("Error fetching school:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch school",
      details: error.message,
    });
  }
};

/**
 * Update school
 * PATCH /api/schools/:id
 * Requires: SCHOOL_UPDATE permission
 */
export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, homeAddress, website, externalIds, settings, active } = req.body;

    const school = await School.findOne({ _id: id, isDeleted: false });

    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // Check district access
    if (req.user.role !== ROLES.SUPER_ADMIN && school.districtId !== req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    // Prevent changing districtId (security measure)
    if (req.body.districtId && req.body.districtId !== school.districtId) {
      return res.status(403).json({
        error: true,
        message: "Cannot change school district",
      });
    }

    // Check email uniqueness if being changed
    if (email && email !== school.email) {
      const existingSchool = await School.findOne({ email, isDeleted: false });
      if (existingSchool) {
        return res.status(409).json({
          error: true,
          message: "School with this email already exists",
        });
      }
    }

    // Update fields
    if (name) school.name = name;
    if (email) school.email = email;
    if (phone) school.phone = phone;
    if (homeAddress !== undefined) school.homeAddress = homeAddress;
    if (website !== undefined) school.website = website;
    if (externalIds) school.externalIds = { ...school.externalIds, ...externalIds };
    if (settings) school.settings = { ...school.settings, ...settings };
    if (active !== undefined) school.active = active;

    await school.save();

    res.status(200).json({
      success: true,
      message: "School updated successfully",
      data: school,
    });
  } catch (error) {
    console.error("Error updating school:", error);
    res.status(500).json({
      error: true,
      message: "Failed to update school",
      details: error.message,
    });
  }
};

/**
 * Delete school (soft delete)
 * DELETE /api/schools/:id
 * Requires: SCHOOL_DELETE permission
 */
export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findOne({ _id: id, isDeleted: false });

    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // Check district access
    if (req.user.role !== ROLES.SUPER_ADMIN && school.districtId !== req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    // Soft delete
    school.isDeleted = true;
    school.active = false;
    await school.save();

    res.status(200).json({
      success: true,
      message: "School deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting school:", error);
    res.status(500).json({
      error: true,
      message: "Failed to delete school",
      details: error.message,
    });
  }
};

/**
 * Sync school external ID (for LTI/Clever integration)
 * PATCH /api/schools/:id/sync-external
 */
export const syncSchoolExternalId = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider, externalId } = req.body;

    if (!provider || !externalId) {
      return res.status(400).json({
        error: true,
        message: "Provider and externalId are required",
      });
    }

    const validProviders = ["clever", "canvas", "oneroster", "lti"];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: true,
        message: `Invalid provider. Must be one of: ${validProviders.join(", ")}`,
      });
    }

    const school = await School.findOne({ _id: id, isDeleted: false });

    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // Check district access
    if (req.user.role !== ROLES.SUPER_ADMIN && school.districtId !== req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    // Update external ID
    school.externalIds = school.externalIds || {};
    school.externalIds[provider] = externalId;
    await school.save();

    res.status(200).json({
      success: true,
      message: `School synced with ${provider}`,
      data: school,
    });
  } catch (error) {
    console.error("Error syncing school external ID:", error);
    res.status(500).json({
      error: true,
      message: "Failed to sync school external ID",
      details: error.message,
    });
  }
};

/**
 * Get schools for dropdown (lightweight)
 * GET /api/schools/dropdown
 * For user creation forms
 */
export const getSchoolsForDropdown = async (req, res) => {
  try {
    let query = { isDeleted: false, active: true };

    // Filter by district (except super admin)
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      query.districtId = req.user.districtId;
    }

    const schools = await School.find(query)
      .select("_id name districtId")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error("Error fetching schools for dropdown:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch schools",
      details: error.message,
    });
  }
};


export const getSchoolStats = async (req, res) => {
  try {
    const { schoolId } = req.params;

    // 1. Verify school existence and district access
    const school = await School.findOne({ _id: schoolId, isDeleted: false });

    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // RBAC: Ensure district admin only sees schools in their district
    if (req.user.role !== ROLES.SUPER_ADMIN && school.districtId.toString() !== req.user.districtId.toString()) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    // 2. Perform concurrent counts for performance
    const [teacherCount, studentCount, courseCount] = await Promise.all([
      User.countDocuments({ schoolId: schoolId, role: 'teacher', isDeleted: false }),
      User.countDocuments({ schoolId: schoolId, role: 'student', isDeleted: false }),
      CourseSch.countDocuments({ schoolId: schoolId, isDeleted: false })
    ]);

    // 3. Return data in the structure the UI expects
    res.status(200).json({
      success: true,
      data: {
        teachers: teacherCount,
        students: studentCount,
        courses: courseCount
      },
    });
  } catch (error) {
    console.error("Error fetching school stats:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch school stats",
    });
  }
};

export default {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  syncSchoolExternalId,
  getSchoolsForDropdown,
};
