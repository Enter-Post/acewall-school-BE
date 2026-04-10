import express from "express";
import {
  allUser,
  checkAuth,
  login,
  logout,
  updateUser,
  checkUser,
  allTeacher,
  // verifyOtpAndSignup,
  initiateSignup,
  resendOTP,
  forgetPassword,
  resetPassword,
  getUserInfo,
  updateProfileImg,
  updatePassword,
  updatePasswordOTP,
  updateEmailOTP,
  updateEmail,
  verifyOTPForgotPassword,
  getStudentById,
  deleteUser,
  updateUserById,
  updateUserProfileImgById,
  updateEmailOTPById,
  updateEmailById,
  updatePasswordOTPById,
  updatePasswordById,
  SignupwithoutOTP,
  verifyEmailOtp,
  verifyPhoneOtp,
  resendPhoneOTP,
  updatePhoneOTP,
  updatePhone,
  bulkSignup,
  previewSignIn,
  previewSignOut,
  updateParentEmail,
  createGuardianAcc,
  verifyPasswordlessLogin,
  loginGuardianAcc,
} from "../Contollers/auth.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { upload } from "../lib/multer.config.js";
import cleverRoutes from "../modules/clever/clever.routes.js";
// import { checkRole, isAllowed } from "../Middlewares/admins.Middleware.js";
const router = express.Router();

router.use("/clever", cleverRoutes);

/**
 * @swagger
 * /api/auth/bulk-signup:
 *   post:
 *     summary: Bulk signup users from file
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file containing user data
 *     responses:
 *       201:
 *         description: Users bulk created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid file format or data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/bulk-signup", upload.single("file"), bulkSignup);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Initiate user registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               firstName:
 *                 type: string
 *                 description: User first name
 *               lastName:
 *                 type: string
 *                 description: User last name
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin, teacherAsStudent, parent, instructor]
 *                 description: User role
 *               phone:
 *                 type: string
 *                 description: User phone number
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password
 *     responses:
 *       201:
 *         description: Registration initiated, OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", initiateSignup);

/**
 * @swagger
 * /api/auth/registerwithoutOTP:
 *   post:
 *     summary: Register user without OTP verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - role
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin, teacherAsStudent, parent, instructor]
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data
 */
router.post("/registerwithoutOTP", SignupwithoutOTP);

/**
 * @swagger
 * /api/auth/verifyOTP:
 *   post:
 *     summary: Verify email OTP for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 description: OTP received via email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid OTP or email
 */
router.post("/verifyOTP", verifyEmailOtp);

/**
 * @swagger
 * /api/auth/verifyPhoneOTP:
 *   post:
 *     summary: Verify phone OTP for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone OTP verified successfully
 *       400:
 *         description: Invalid OTP or phone number
 */
router.post("/verifyPhoneOTP", verifyPhoneOtp);

/**
 * @swagger
 * /api/auth/resendPhoneOTP:
 *   post:
 *     summary: Resend OTP to phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid phone number
 */
router.post("/resendPhoneOTP", resendPhoneOTP);

/**
 * @swagger
 * /api/auth/resendOTP:
 *   post:
 *     summary: Resend OTP to email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid email
 */
router.post("/resendOTP", resendOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/createGuardianAcc/{id}:
 *   post:
 *     summary: Create guardian account for student
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Guardian account created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Student not found
 */
router.post("/createGuardianAcc/:id", isUser, createGuardianAcc);

/**
 * @swagger
 * /api/auth/loginGuardianAcc:
 *   post:
 *     summary: Login for guardian accounts
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guardian login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/loginGuardianAcc", loginGuardianAcc);

/**
 * @swagger
 * /api/auth/verifyPasswordlessLogin:
 *   post:
 *     summary: Verify passwordless login with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Passwordless login successful
 *       400:
 *         description: Invalid OTP or email
 */
router.post("/verifyPasswordlessLogin", verifyPasswordlessLogin);

/**
 * @swagger
 * /api/auth/forgotPassword:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *       404:
 *         description: User not found
 */
router.post("/forgotPassword", forgetPassword);

/**
 * @swagger
 * /api/auth/verifyForgotPassOTP:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
router.post("/verifyForgotPassOTP", verifyOTPForgotPassword);

/**
 * @swagger
 * /api/auth/resetPassword:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or password
 */
router.post("/resetPassword", resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/checkAuth:
 *   get:
 *     summary: Check authentication status
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication invalid
 */
router.get("/checkAuth", isUser, checkAuth);

/**
 * @swagger
 * /api/auth/check-existence:
 *   post:
 *     summary: Check if user exists
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User existence check result
 */
router.post("/check-existence", checkUser);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get("/users", allUser);

/**
 * @swagger
 * /api/auth/updateuser:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               Bio:
 *                 type: string
 *               pronoun:
 *                 type: string
 *                 enum: [he/him, she/her, they/them, others, prefer not to say]
 *               gender:
 *                 type: string
 *                 enum: [male, female, non-binary, other, prefer not to say]
 *               homeAddress:
 *                 type: string
 *               mailingAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 */
router.put("/updateuser", isUser, updateUser);

/**
 * @swagger
 * /api/auth/updateUserById/{id}:
 *   put:
 *     summary: Update user by ID (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin, teacherAsStudent, parent, instructor]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put("/updateUserById/:id", updateUserById);

/**
 * @swagger
 * /api/auth/allTeacher:
 *   get:
 *     summary: Get all teachers
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get("/allTeacher", allTeacher);

/**
 * @swagger
 * /api/auth/getUserInfo:
 *   get:
 *     summary: Get current user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/getUserInfo", isUser, getUserInfo);

/**
 * @swagger
 * /api/auth/updateProfileImg:
 *   put:
 *     summary: Update user profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImg:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: Invalid file format
 */
router.put(
  "/updateProfileImg",
  isUser,
  upload.single("profileImg"),
  updateProfileImg,
);

/**
 * @swagger
 * /api/auth/updateUserProfileImgById/{id}:
 *   put:
 *     summary: Update user profile image by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImg:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       404:
 *         description: User not found
 */
router.put(
  "/updateUserProfileImgById/:id",
  upload.single("profileImg"),
  updateUserProfileImgById,
);

/**
 * @swagger
 * /api/auth/updatePasswordOTP:
 *   post:
 *     summary: Request OTP for password update
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent for password update
 *       401:
 *         description: Unauthorized
 */
router.post("/updatePasswordOTP", isUser, updatePasswordOTP);

/**
 * @swagger
 * /api/auth/updatePassword:
 *   put:
 *     summary: Update user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - otp
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid current password or OTP
 */
router.put("/updatePassword", isUser, updatePassword);

/**
 * @swagger
 * /api/auth/updateEmailOTP:
 *   post:
 *     summary: Request OTP for email update
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent for email update
 */
router.post("/updateEmailOTP", isUser, updateEmailOTP);

/**
 * @swagger
 * /api/auth/updateEmail:
 *   put:
 *     summary: Update user email
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - otp
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Invalid OTP or email
 */
router.put("/updateEmail", isUser, updateEmail);

/**
 * @swagger
 * /api/auth/updatePhoneOTP:
 *   post:
 *     summary: Request OTP for phone update
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent for phone update
 */
router.post("/updatePhoneOTP", isUser, updatePhoneOTP);

/**
 * @swagger
 * /api/auth/updatePhone:
 *   put:
 *     summary: Update user phone number
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPhone
 *               - otp
 *             properties:
 *               newPhone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone updated successfully
 *       400:
 *         description: Invalid OTP or phone
 */
router.put("/updatePhone", isUser, updatePhone);

/**
 * @swagger
 * /api/auth/auth/updateEmailOTPById/{id}:
 *   put:
 *     summary: Request OTP for email update by ID
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: OTP sent for email update
 *       404:
 *         description: User not found
 */
router.put("/auth/updateEmailOTPById/:id", updateEmailOTPById);

/**
 * @swagger
 * /api/auth/auth/updateEmailById/{id}:
 *   put:
 *     summary: Update user email by ID
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - otp
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       404:
 *         description: User not found
 */
router.put("/auth/updateEmailById/:id", updateEmailById);

/**
 * @swagger
 * /api/auth/auth/updatePasswordOTPById/{id}:
 *   put:
 *     summary: Request OTP for password update by ID
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: OTP sent for password update
 *       404:
 *         description: User not found
 */
router.put("/auth/updatePasswordOTPById/:id", updatePasswordOTPById);

/**
 * @swagger
 * /api/auth/auth/updatePasswordById/{id}:
 *   put:
 *     summary: Update user password by ID
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - otp
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       404:
 *         description: User not found
 */
router.put("/auth/updatePasswordById/:id", updatePasswordById);

/**
 * @swagger
 * /api/auth/users/{userId}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/users/:userId", isUser, deleteUser);

/**
 * @swagger
 * /api/auth/previewSignIn:
 *   post:
 *     summary: Preview mode sign in
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preview mode activated
 *       401:
 *         description: Unauthorized
 */
router.post("/previewSignIn", isUser, previewSignIn);

/**
 * @swagger
 * /api/auth/previewSignOut:
 *   post:
 *     summary: Preview mode sign out
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preview mode deactivated
 *       401:
 *         description: Unauthorized
 */
router.post("/previewSignOut", isUser, previewSignOut);

/**
 * @swagger
 * /api/auth/updateParentEmail/{id}:
 *   put:
 *     summary: Update parent email for student
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentEmail
 *             properties:
 *               parentEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Parent email updated successfully
 *       404:
 *         description: Student not found
 */
router.put("/updateParentEmail/:id", isUser, updateParentEmail);

export default router;
