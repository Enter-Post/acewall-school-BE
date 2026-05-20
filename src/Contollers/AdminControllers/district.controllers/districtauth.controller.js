import User from "../../../Models/user.model.js";
import bcrypt from "bcrypt";

export const districtSignup = async (req, res) => {
    const { firstName, middleName, lastName, role, email, password } = req.body;
    const { districtId } = req.user
    const { schoolId } = req.params

    try {
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: "Forbidden. Only district admins can create accounts." });
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

export const getDistrictUsers = async (req, res) => {
    // 1. Extract params and query strings
    const { schoolId } = req.params;
    const { districtId } = req.user;
    const { role, search } = req.query;

    try {
        // 2. Authorization Check (Ensuring only district admins see this)
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: "Forbidden. Access restricted to district admins." });
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

        console.log("user finded in district controller: ", users)

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