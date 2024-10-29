import { Router } from "express";
import { loginUser ,registerUser} from "../controller/index.js";
import { authenticateToken } from "../middlewares/index.js";

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/dashboard', authenticateToken, (req, res) => {
    res.json({ message: `Welcome to the dashboard, User ${req.user.userId}!` });
});

export default router;