import { Router } from "express";
import { loginUser ,registerUser ,verify_otp,forgotPassword,verifyOtpAndResetPassword , get_spin_wheel_config} from "../controller/index.js";
import { authenticateToken , verifyAdmin ,  } from "../middlewares/index.js";
import admin_router from "./admin_routes.js";
import user_router from "./user_routes.js";

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/otp_verigy', verify_otp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', verifyOtpAndResetPassword)
router.get('/get_spin_config',authenticateToken,get_spin_wheel_config)

// router.get('/dashboard', authenticateToken, (req, res) => {
//     res.json({ message: `Welcome to the dashboard, User ${req.user.userId}!` });
// });


router.use('/admin', verifyAdmin, admin_router)
router.use('/user',authenticateToken, user_router)


export default router;