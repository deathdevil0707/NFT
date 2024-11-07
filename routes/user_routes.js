import { Router } from "express";

import user_controller from "../controller/user_controller.js";

const user_router = Router();


user_router.post('/select_plan',user_controller.select_plan)
user_router.post('/user_withdrawal',user_controller.user_withdrawal)
user_router.get('/plans',user_controller.plans)
user_router.get('/user-plans',user_controller.user_plans)
user_router.get('/user-wallet',user_controller.user_wallet)
user_router.get('/payment-requests',user_controller.get_all_payment_requests)
user_router.post('/withdrawal-status',user_controller.get_payment_details)


export default user_router