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
  cleverCallback,
} from "../Contollers/auth.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { upload } from "../lib/multer.config.js";
// import { checkRole, isAllowed } from "../Middlewares/admins.Middleware.js";
const router = express.Router();


router.post("/bulk-signup", upload.single("file"), bulkSignup);


router.post("/register", initiateSignup);
router.post("/registerwithoutOTP", SignupwithoutOTP);
// router.post("/verifyOTP", verifyOtpAndSignup);
router.post("/verifyOTP", verifyEmailOtp);
router.post("/verifyPhoneOTP", verifyPhoneOtp);
router.post("/resendPhoneOTP", resendPhoneOTP);
router.post("/resendOTP", resendOTP);

router.get("/clever/callback", cleverCallback);
router.post("/login", login);
router.post("/forgotPassword", forgetPassword);
router.post("/verifyForgotPassOTP", verifyOTPForgotPassword);
router.post("/resetPassword", resetPassword);
router.post("/logout", logout);
router.get("/checkAuth", isUser, checkAuth);
router.post("/check-existence", checkUser);
router.get("/users", allUser);
router.put("/updateuser", isUser, updateUser);
router.put("/updateUserById/:id", updateUserById); // new endpoint

router.get("/allTeacher", allTeacher);
router.get("/getUserInfo", isUser, getUserInfo);
router.put(
  "/updateProfileImg",
  isUser,
  upload.single("profileImg"),
  updateProfileImg
);
router.put(
  "/updateUserProfileImgById/:id",
  upload.single("profileImg"),
  updateUserProfileImgById
);

router.post("/updatePasswordOTP", isUser, updatePasswordOTP);
router.put("/updatePassword", isUser, updatePassword);
router.post("/updateEmailOTP", isUser, updateEmailOTP);
router.put("/updateEmail", isUser, updateEmail);
router.post("/updatePhoneOTP", isUser, updatePhoneOTP)
router.put("/updatePhone", isUser, updatePhone)

router.put("/auth/updateEmailOTPById/:id", updateEmailOTPById);
router.put("/auth/updateEmailById/:id", updateEmailById);
router.put("/auth/updatePasswordOTPById/:id", updatePasswordOTPById);
router.put("/auth/updatePasswordById/:id", updatePasswordById);
router.delete("/users/:userId", isUser, deleteUser);

router.post("/previewSignIn", isUser, previewSignIn)
router.post("/previewSignOut", isUser, previewSignOut)
router.put("/updateParentEmail/:id", isUser, updateParentEmail);

export default router;
