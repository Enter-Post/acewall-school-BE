import express from "express"
import District from "../Models/district.model.js"
import { isUser } from "../middlewares/Auth.Middleware.js"

const router = express.Router()

router.get("/", isUser, async (req, res) => {
    try {
        const districts = await District.find()
        res.json(districts)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router