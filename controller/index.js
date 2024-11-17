import { sequelize } from '../db/index.js';
import { config } from '../config/index.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'shubhankaragarwal0707@gmail.com',
        pass: 'cxju fdef flye gmzk'
    }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registerUser = async (req, res) => {
    const { username, email, password, referrerCode, contact_number } = req.body;
    // const referrerCode = req.query.ref;

    try {
        const passwordHash = await bcrypt.hash(password, 10)
        const referralCode = `${username}_${uuidv4().slice(0, 8)}`;
        let referrer = null;

        if (referrerCode) {
            const [referrerQuery] = await sequelize.query(`SELECT id FROM users WHERE referral_code = '${referrerCode}'`);
            referrer = referrerQuery[0];
        }

        const [result] = await sequelize.query(
            `INSERT INTO users (username, email, password_hash, referral_code, referred_by , is_verified , contact_number)
             VALUES (:username, :email, :passwordHash, :referralCode, :referredBy , :is_verified , :contact_number)
             RETURNING id, username, referral_code,contact_number`,
            {
                replacements: {
                    username,
                    email,
                    passwordHash,
                    referralCode,
                    referredBy: referrer ? referrer.id : null,
                    is_verified: false,
                    contact_number
                }
                // type: sequelize.QueryTypes.INSERT
            }
        );
        console.log("result", result)

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // Store OTP in the database
        await sequelize.query(`
            INSERT INTO otps (email, otp_code, expires_at, used)
            VALUES ('${email}', '${otpCode}', '${expiresAt.toISOString()}', false)
        `);

        try {
            const emailResponse = await transporter.sendMail({
                from: 'shubhankaragarwal0707@gmail.com',
                to: email,
                subject: 'Verify your email',
                text: `Your OTP code is ${otpCode}. It will expire in 15 minutes.`
            });
            console.log('Email sent successfully:', emailResponse);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            throw new Error('Failed to send OTP email. Please try again.');
        }

        await sequelize.query(
            `INSERT INTO wallets (user_id, balance)
             VALUES (:userId, 0)`,
            {
                replacements: {
                    userId: result[0].id, // Use the newly created user's ID
                }
            }
        );

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

        const token = jwt.sign({ userId: result[0].id, userName: result[0].username }, config.jwt_secret, { expiresIn: '8h' });
        console.log("token", token)

        res.status(201).json({
            status: 201,
            message: 'User registered successfully!',
            token,
            referralLink: `http://yourapp.com/register?ref=${referralCode}`,
            user: result[0]
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, error: error.message });
    }
};
export const verify_otp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const [otpRecord] = await sequelize.query(`
            SELECT * FROM otps
            WHERE email = '${email}' AND otp_code = '${otp}' AND used = false
            order by id desc
        `);
        console.log(otpRecord[0].expires_at)

        if (otpRecord.length === 0) {
            return res.status(400).json({ message: 'Invalid OTP or OTP already used' });
        }

        const otpData = otpRecord[0];

        const expiresAtUTC = new Date(otpData.expires_at);
        console.log('Expires At (UTC):', expiresAtUTC.toISOString());

        // Get the current time in UTC
        const nowUTC = new Date();
        console.log('Current Time (UTC):', nowUTC.toISOString());

        // Compare current time in UTC with `expires_at`
        if (nowUTC > expiresAtUTC) {
            return res.status(400).json({ message: 'OTP has expired' });
        }
        // Mark OTP as used
        await sequelize.query(`
            UPDATE otps SET used = true WHERE id = ${otpData.id}
        `);

        // Mark user as verified
        await sequelize.query(`
            UPDATE users SET is_verified = true WHERE email = '${email}'
        `);

        res.status(200).json({ statua: 200, message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal server error' });
    }
}
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [userQuery] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`);
        const user = userQuery[0];
        console.log(user)

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id, userName: user.username }, config.jwt_secret, { expiresIn: '8h' });
        res.json({ status: 200, message: 'Login successful', token, user });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the user exists
        const [userQuery] = await sequelize.query(
            `SELECT id FROM users WHERE email = '${email}'`,
        );

        if (userQuery.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userQuery[0].id;

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

        // Store the OTP in the database
        await sequelize.query(
            `INSERT INTO otps (email, otp_code, expires_at, used) 
             VALUES (:email, :otpCode, :expiresAt, false)`,
            {
                replacements: {
                    email,
                    otpCode,
                    expiresAt: expiresAt.toISOString()
                }
            }
        );

        // Send OTP via email
        try {
            const emailResponse = await transporter.sendMail({
                from: 'shubhankaragarwal0707@gmail.com',
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP for password reset is ${otpCode}. It will expire in 15 minutes.`
            });
            console.log('OTP email sent successfully:', emailResponse);
        } catch (emailError) {
            console.error('Error sending OTP email:', emailError);
            throw new Error('Failed to send OTP email. Please try again.');
        }

        res.status(200).json({ status: 200, message: 'OTP sent to your email for password reset' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: error.message });
    }
};

export const verifyOtpAndResetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Check if OTP is valid
        const [otpQuery] = await sequelize.query(
            `SELECT * FROM otps WHERE email = '${email}' AND otp_code = '${otp}' AND used = false`
        );
        console.log(otpQuery)

        if (otpQuery.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const otpRecord = otpQuery[0];

        // Check if OTP is expired

        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Mark OTP as used
        await sequelize.query(
            `UPDATE otps SET used = true WHERE email = '${email}' AND otp_code = '${otp}'`
        );

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await sequelize.query(
            `UPDATE users SET password_hash = '${passwordHash}' WHERE email = '${email}'`
        );
        const [user] = await sequelize.query(`select * from users where email = '${email}'`)

        res.status(200).json({ status: 200, message: 'Password has been reset successfully', user: user[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: error.message });
    }
};
export const get_spin_wheel_config = async (req, res) => {
    try {

        // Fetch the spin wheel configuration
        const [config_data] = await sequelize.query(`SELECT * FROM spin_wheel_config`);

        if (config_data.length === 0) {
            return res.status(404).json({ message: 'Spin wheel configuration not found' });
        }

        // Process response based on the role
        // Return complete configuration for admin
        res.status(200).json({
            message: 'Spin wheel configuration for admin',
            data: config_data[0]
        });

    } catch (error) {
        console.error('Error fetching spin wheel configuration:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}





