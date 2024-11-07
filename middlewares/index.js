import jwt from 'jsonwebtoken'
import { config } from '../config/index.js';

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, config.jwt_secret, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

export const verifyAdmin = (req, res, next) => {

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, config.jwt_secret, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        console.log("req.user",user)
        if (user.userName === 'Admin') {
            req.user = user;
            next();
        } else {
            res.status(401).json({ message: 'Admin credentials are invalid' })
        }
    });

}

