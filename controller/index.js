import { sequelize } from '../db/index.js';
import { config } from '../config/index.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid';


export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const referrerCode = req.query.ref;

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const referralCode = `${username}_${uuidv4().slice(0, 8)}`;
        let referrer = null;

        if (referrerCode) {
            const [referrerQuery] = await sequelize.query(`SELECT id FROM users WHERE referral_code = '${referrerCode}'`);
            referrer = referrerQuery[0];
        }

        const [result] = await sequelize.query(
            `INSERT INTO users (username, email, password_hash, referral_code, referred_by)
             VALUES (:username, :email, :passwordHash, :referralCode, :referredBy)
             RETURNING id, username, referral_code`,
            {
                replacements: {
                    username,
                    email,
                    passwordHash,
                    referralCode,
                    referredBy: referrer ? referrer.id : null
                }
                // type: sequelize.QueryTypes.INSERT
            }
        );
        console.log("result",result)

        if (referrer) {
            await sequelize.query(`UPDATE users SET referral_count = referral_count + 1 WHERE id = ${referrer.id}`, []);
            await sequelize.query(
                `INSERT INTO referrals (user_id, referrer_id) VALUES (:userId, :referrerId)`,
                {
                    replacements: {
                        userId: result[0].id,  // Adjust based on the structure of `result`
                        referrerId: referrer.id
                    },
                    type: sequelize.QueryTypes.INSERT
                }
            );
        }

        const token = jwt.sign({ userId: result[0].id }, config.jwt_secret, { expiresIn: '1h' });
        console.log("token",token)

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            referralLink: `http://yourapp.com/register?ref=${referralCode}`,
            user: result[0]
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [userQuery] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`, );
        const user = userQuery[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, config.jwt_secret, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};

