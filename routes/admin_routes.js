import { Router } from "express";
import admin_controller from "../controller/admin_controller.js";

const admin_router = Router();

admin_router.post('/create_plan', admin_controller.add_plan)
admin_router.post('/get_all_users' , admin_controller.get_all_users)
admin_router.post('/add-user-amount' , admin_controller.add_user_amount)
admin_router.post('/wallet_details' , admin_controller.wallet_details)
admin_router.post('/withdrawal_requests' , admin_controller.get_withdrawal)
admin_router.post('/status_update' , admin_controller.update_withdrawal)
admin_router.post('/get-all-plans', admin_controller.get_plans)

export default admin_router