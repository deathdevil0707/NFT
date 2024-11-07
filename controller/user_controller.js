import { sequelize } from "../db/index.js";
import express from 'express';



class UserController {

    async select_plan(req, res) {
        const { user_id, plan_id } = req.body;

        try {
            // Check if the plan exists
            const [plan] = await sequelize.query(
                `SELECT * FROM plans WHERE id = :plan_id`,
                { replacements: { plan_id } }
            );

            if (!plan.length) {
                return res.status(404).json({ message: 'Plan not found' });
            }

            // Add the selected plan for the user
            await sequelize.query(
                `INSERT INTO user_plans (user_id, plan_id) VALUES (:user_id, :plan_id)`,
                { replacements: { user_id, plan_id } }
            );

            res.status(201).json({ message: 'Plan selected successfully!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async user_withdrawal(req, res) {
        const { user_id,  amount, account_number, ifsc_code, upi_id } = req.body;

        try {
            const [wallet] = await sequelize.query(
                `SELECT * FROM wallets WHERE user_id = :user_id`,
                { replacements: { user_id } }
            );

            if (!wallet.length || wallet[0].balance < amount) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }

            // Insert the withdrawal request
            await sequelize.query(
                `INSERT INTO withdrawal_requests (user_id,  amount, account_number, ifsc_code, upi_id)
             VALUES (:user_id,  :amount, :account_number, :ifsc_code, :upi_id)`,
                {
                    replacements: { user_id,  amount, account_number, ifsc_code, upi_id }
                }
            );

            // Deduct the amount from the user's wallet
            await sequelize.query(
                `UPDATE wallets SET balance = balance - :amount WHERE user_id = :user_id`,
                { replacements: { user_id, amount } }
            );

            res.status(201).json({ message: 'Withdrawal request submitted!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

}

export default new UserController()