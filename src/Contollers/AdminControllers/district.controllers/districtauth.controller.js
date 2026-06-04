import User from "../../../Models/user.model.js";
import School from "../../../Models/School.model.js";
import bcrypt from "bcrypt";
import District from "../../../Models/district.model.js";

export const districtSignup = async (req, res) => {
    const { firstName, middleName, lastName, role, email, password } = req.body;
    const districtId = req.user.districtId || req.body.districtId;
    const { schoolId } = req.params;

    try {
        if (req.user.role !== 'district_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Forbidden. Only district and super admins can create accounts." });
        }

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !role) {
            return res
                .status(400)
                .json({ message: "All required fields must be filled." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this email already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 11);

        // Create new user
        const newUser = new User({
            firstName,
            middleName,
            lastName,
            role,
            email,
            password: hashedPassword,
            districtId,
            schoolId
        });

        await newUser.save();

        res.status(201).json({
            message: "Account created successfully.",
            user: newUser,
        });
    } catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createDistrictAdmin = async (req, res) => {
    const { firstName, middleName, lastName, email, password } = req.body;
    const { districtId } = req.params;

    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Forbidden. Only super admins can create accounts." });
        }

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !districtId) {
            return res
                .status(400)
                .json({ message: "All required fields must be filled." });
        }

        const district = await District.findById(districtId);
        if (!district) {
            return res
                .status(404)
                .json({ message: "District not found." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this email already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 11);

        // Create new user
        const newUser = new User({
            firstName,
            middleName,
            lastName,
            role: "district_admin",
            email,
            password: hashedPassword,
            districtId,
        });

        await newUser.save();

        res.status(201).json({
            message: "Account created successfully.",
            user: newUser,
        });
    } catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getDistrictUsers = async (req, res) => {
    // 1. Extract params and query strings
    const { schoolId } = req.params;
    let districtId;
    const { role, search } = req.query;


    if (req.user.role === "super_admin") {
        districtId = req.query.districtId;
    } else {
        districtId = req.user.districtId;
    }

    try {
        // 2. Authorization Check (Ensuring only district admins and super admins see this)
        if (req.user.role !== 'district_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Forbidden. Access restricted to district and super admins." });
        }

        // 3. Build the Query Object
        let query = { districtId: districtId, schoolId: schoolId };

        // Filter by role if provided
        if (role) {
            query.role = role;
        }

        // Search by name or email if search term exists
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // 4. Fetch users from Database
        // We exclude the password for security
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        // 5. Return the results
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Fetch users error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getDistrictDashboardStats = async (req, res) => {
    const districtId = req.user.districtId || req.body.districtId || req.query.districtId;

    try {
        if (req.user.role !== 'district_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Forbidden. Access restricted to district and super admins." });
        }

        const [
            totalSchools,
            totalStudents,
            totalTeachers,
            totalAdmins
        ] = await Promise.all([
            School.countDocuments({ districtId }),
            User.countDocuments({ districtId, role: "student" }),
            User.countDocuments({ districtId, role: "teacher" }),
            User.countDocuments({ districtId, role: "admin" })
        ]);

        const recentSchools = await School.find({ districtId })
            .sort({ createdAt: -1 })
            .limit(4)
            .select("name address email phone active createdAt");

        res.status(200).json({
            success: true,
            stats: {
                totalSchools,
                totalStudents,
                totalTeachers,
                totalAdmins
            },
            recentSchools
        });
    } catch (error) {
        console.error("Fetch dashboard stats error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};