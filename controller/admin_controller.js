import express from 'express'
import { sequelize } from '../db/index.js';



class AdminApiControler {

    async add_plan(req, res) {
        const { name, description, amount, daily_income_rate, coin_type, required_subordinates } = req.body;

        try {
            await sequelize.query(
                `INSERT INTO plans (name, description, amount, daily_income_rate, coin_type, required_subordinates)
             VALUES (:name, :description, :amount, :daily_income_rate, :coin_type, :required_subordinates)`,
                {
                    replacements: { name, description, amount, daily_income_rate, coin_type, required_subordinates }
                }
            );
            res.status(201).json({ message: 'Plan created successfully!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }

    }
    async add_user_amount (req,res) {
        const { user_id, amount } = req.body;
        const [data] = await sequelize.query(`select * from wallets where user_id = '${user_id}'`)

        const balance = Number(amount) + Number(data[0].balance)
        try {
            await sequelize.query(
                `UPDATE wallets SET balance = balance + :amount WHERE user_id = :user_id`,
                { replacements: { user_id, amount } }
            );
    
            res.status(200).json({ message: 'Amount added to wallet successfully!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    async get_all_users(req, res) {
        try {
            const [users] = await sequelize.query(`SELECT * FROM users`);
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    //update withdrawal request from user
    async update_withdrawal(req, res) {
        const { id } = req.body;
        const { status } = req.body; // e.g., 'approved', 'rejected'

        try {
            await sequelize.query(
                `UPDATE withdrawal_requests SET status = :status WHERE id = :id`,
                { replacements: { status, id } }
            );

            res.status(200).json({ message: `Withdrawal request status updated to ${status}` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    async get_withdrawal(req, res) {

        try {
            const [requests] = await sequelize.query(`SELECT * FROM withdrawal_requests`);
            res.status(200).json(requests);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    async wallet_details(req, res) {
        const { user_id } = req.body;

        try {
            const [userQuery] = await sequelize.query(`SELECT * FROM users WHERE id = '${user_id}'`, );

            const [walletDetails] = await sequelize.query(
                `SELECT * FROM wallets WHERE user_id = :user_id`,
                { replacements: { user_id } }
            );

            if (!walletDetails.length) {
                return res.status(404).json({ message: 'Wallet not found' });
            }

            res.status(200).json({ ...walletDetails[0], ...userQuery[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    async get_plans(req, res) {
        try {
            const [plans] = await sequelize.query(`SELECT * FROM plans`);

            res.status(200).json({
                message: 'Plans retrieved successfully!',
                plans
            });
        } catch (error) {
            console.error('Error retrieving plans:', error);
            res.status(500).json({ error: 'Failed to retrieve plans' });
        }
    }

}

export default new AdminApiControler();