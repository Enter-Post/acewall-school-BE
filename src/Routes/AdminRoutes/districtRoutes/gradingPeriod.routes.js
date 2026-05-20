import express from "express"
import { isUser } from "../../../middlewares/Auth.Middleware.js"
import { archivedQuarter, archivedSemester, createQuarter, createSemester, editQuarter, editSemester, getSemesterwithQuarter } from "../../../Contollers/AdminControllers/district.controllers/gradingPeriod.controller.js"

const router = express.Router()

// semester

router.post("/create", isUser, createSemester)
router.get("/getsemesterwithquarter", isUser, getSemesterwithQuarter)

// quarter

router.post("/quartercreate", isUser, createQuarter);

router.put("/updateSemArchiveStatus/:semesterId", isUser, archivedSemester);
router.put("/updateQtrArchiveStatus/:quarterId", isUser, archivedQuarter);


router.put("/editSemester/:semesterId", isUser, editSemester);
router.put("/editQuarter/:quarterId", isUser, editQuarter);

export default router