import { Router } from "express";

import { userLogin } from "../controller/auth.controller.js";
const router = Router();

router.route("/login").post(userLogin);

export default router;
