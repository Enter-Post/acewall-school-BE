import express from "express";
import { sendContactMail, sendSupportMail } from "../Contollers/Support.controller.js";
// import { sendSupportMail } from "../contollers/Support.Controller.js";

const router = express.Router();

router.post("/send", sendSupportMail);
router.post("/sendcontactmail", sendContactMail);

export default router;
