import { Router } from "express";

import user_controller from "../controller/user_controller.js";

const user_router = Router();


user_router.post('/select_plan',user_controller.select_plan)
user_router.post('/user_withdrawal',user_controller.user_withdrawal)

export default user_router