import District from "../../../Models/district.model.js";
import School from "../../../Models/School.model.js";
import User from "../../../Models/user.model.js";

// @desc    Get all districts
// @route   GET /districts
// @access  Private (Super Admin)
export const getAllDistricts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isDeleted } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } }
      ];
    }

    // Handle active/inactive filtering
    if (isDeleted) {
      filter.isDeleted = isDeleted === "true";
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const result = await District.paginate(filter, options);

    // Return consistent response structure
    res.status(200).json({
      districts: result.docs,
      currentPage: result.page,
      totalPages: result.totalPages,
      totalDistricts: result.totalDocs,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ message: "Failed to fetch districts", error: error.message });
  }
};

// @desc    Get single district
// @route   GET /districts/:id
// @access  Private (Super Admin)
export const getDistrictById = async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }
    res.status(200).json(district);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new district
// @route   POST /districts
// @access  Private (Super Admin)
export const createDistrict = async (req, res) => {
  try {
    const { name, code, contactEmail, phone, address, active } = req.body;

    if (!name) {
      return res.status(400).json({ message: "District name is required" });
    }

    if (code) {
      const existingDistrict = await District.findOne({ code });
      if (existingDistrict) {
        return res.status(400).json({ message: "District code already exists" });
      }
    }

    const newDistrict = new District({
      name,
      code,
      contactEmail,
      phone,
      address,
      active: active !== undefined ? active : true,
    });

    const savedDistrict = await newDistrict.save();
    res.status(201).json(savedDistrict);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a district
// @route   PUT /districts/:id
// @access  Private (Super Admin)
export const updateDistrict = async (req, res) => {
  try {
    const { name, code, contactEmail, phone, address, active } = req.body;

    const district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Check code uniqueness if changing code
    if (code && code !== district.code) {
      const existingDistrict = await District.findOne({ code });
      if (existingDistrict) {
        return res.status(400).json({ message: "District code already exists" });
      }
    }

    district.name = name || district.name;
    if (code !== undefined) district.code = code;
    if (contactEmail !== undefined) district.contactEmail = contactEmail;
    if (phone !== undefined) district.phone = phone;
    if (address !== undefined) district.address = address;
    if (active !== undefined) district.active = active;

    const updatedDistrict = await district.save();
    res.status(200).json(updatedDistrict);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete (soft delete) a district
// @route   DELETE /districts/:id
// @access  Private (Super Admin)
export const changeIsDelete = async (req, res) => {
  try {
    const { status, type = "district" } = req.body;
    let Model;

    switch (type.toLowerCase()) {
      case "school":
        Model = School;
        break;
      case "district":
        Model = District;
        break;
      // Add other models here as needed
      default:
        return res.status(400).json({ message: "Invalid entity type provided" });
    }

    const entity = await Model.findById(req.params.id);

    if (!entity) {
      return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
    }

    entity.isDeleted = status;
    await entity.save();

    const entityName = type.charAt(0).toUpperCase() + type.slice(1);
    res.status(200).json({ message: status ? `${entityName} deactivated successfully` : `${entityName} activated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all schools in a district
// @route   GET /districts/:id/schools
// @access  Private (Super Admin)
export const getSchoolsByDistrict = async (req, res) => {
  try {
    const { page = 1, limit = 9, search = "", isDeleted } = req.query;

    const filter = { districtId: req.params.id };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (isDeleted) {
      filter.isDeleted = isDeleted === "true";
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [schools, totalDocs] = await Promise.all([
      School.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      School.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalDocs / limitNumber);

    res.status(200).json({
      schools,
      currentPage: pageNumber,
      totalPages,
      totalSchools: totalDocs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics for super admin
// @route   GET /districts/dashboard/stats
// @access  Private (Super Admin)
export const getSuperAdminDashboardStats = async (req, res) => {
  try {
    const [
      districtsCount,
      schoolsCount,
      teachersCount,
      studentsCount,
      adminsCount
    ] = await Promise.all([
      District.countDocuments({}),
      School.countDocuments({}),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: { $in: ["admin", "district_admin"] } })
    ]);

    res.status(200).json({
      districts: districtsCount,
      schools: schoolsCount,
      teachers: teachersCount,
      students: studentsCount,
      admins: adminsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
