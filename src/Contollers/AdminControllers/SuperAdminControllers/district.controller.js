import District from "../../../Models/district.model.js";
import School from "../../../Models/School.model.js";
import User from "../../../Models/user.model.js";

// @desc    Get all districts
// @route   GET /districts
// @access  Private (Super Admin)
export const getAllDistricts = async (req, res) => {
  try {
    const districts = await District.find().sort({ createdAt: -1 });
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
export const deleteDistrict = async (req, res) => {
  try {
    const district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    district.isDeleted = true;
    await district.save();

    res.status(200).json({ message: "District deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all schools in a district
// @route   GET /districts/:id/schools
// @access  Private (Super Admin)
export const getSchoolsByDistrict = async (req, res) => {
  try {
    const schools = await School.find({ districtId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(schools);
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
      District.countDocuments({ isDeleted: false }),
      School.countDocuments({ isDeleted: false, status: 'Active' }),
      User.countDocuments({ role: "teacher", isDeleted: false }),
      User.countDocuments({ role: "student", isDeleted: false }),
      User.countDocuments({ role: { $in: ["admin", "district_admin"] }, isDeleted: false })
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
