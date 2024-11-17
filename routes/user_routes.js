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
user_router.get('/user-coin-info',user_controller.coin_info)
user_router.post('/add_wallet_amount',user_controller.add_wallet_amount)
user_router.post('/redeem_plan',user_controller.redeemPlan)
user_router.post('/spin_wheel_amount_deduct',user_controller.deduct_wallet_amount)
user_router.post('/spin_wheel_amount_add',user_controller.add_amount_to_wallet)


export default user_router