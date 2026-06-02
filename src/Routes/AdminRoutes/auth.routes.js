import express from "express"
import { adminForgetPassword, adminResetPassword } from "../../Contollers/AdminControllers/auth.controllers.js"

const routes = express.Router()

routes.post("/forget-password", adminForgetPassword)
routes.post("/reset-password", adminResetPassword)

export default routes