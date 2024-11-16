import { Router } from "express";
import admin_controller from "../controller/admin_controller.js";

const admin_router = Router();

admin_router.post('/create_plan', admin_controller.add_plan)
admin_router.get('/get_all_users' , admin_controller.get_all_users)
admin_router.post('/add-user-amount' , admin_controller.add_user_amount)
admin_router.post('/wallet_details' , admin_controller.wallet_details)
admin_router.post('/withdrawal_requests' , admin_controller.get_withdrawal)
admin_router.post('/status_update' , admin_controller.update_withdrawal)
admin_router.get('/get-all-plans', admin_controller.get_plans)
admin_router.get('/plan-requests', admin_controller.plan_requests)
admin_router.post('/plan_status_update' , admin_controller.plan_status_update)
admin_router.post('/get_user_plan' , admin_controller.get_user_plan)
admin_router.post('/user_status_update' , admin_controller.update_user_status)
admin_router.post('/update_plan' , admin_controller.update_plan)
admin_router.post('/approval_wallet_request' , admin_controller.approveWalletRequest)
admin_router.get('/get_wallet_requests',admin_controller.getAllWalletRequests)
admin_router.post('/approval_redeem_plan' , admin_controller.handleAdminDecision)
admin_router.get('/get_redeem_requests',admin_controller.getAllRedeemRequests)



export default admin_router