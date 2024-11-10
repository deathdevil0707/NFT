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
                `INSERT INTO user_plans (user_id, plan_id, status) VALUES (:user_id, :plan_id, :status)`,
                { replacements: { user_id, plan_id, status: 'inactive' } }
            );
            

            res.status(201).json({status : 200 ,  message: 'Plan selected successfully!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 , error: error.message });
        }
    }
    async user_withdrawal(req, res) {
        const { user_id, amount, account_number, ifsc_code, upi_id } = req.body;

        try {
            const [wallet] = await sequelize.query(
                `SELECT * FROM wallets WHERE user_id = :user_id`,
                { replacements: { user_id } }
            );
            if (!wallet.length || Number(wallet[0].balance) < Number(amount)) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }

            // Insert the withdrawal request
            await sequelize.query(
                `INSERT INTO withdrawal_requests (user_id,  amount, account_number, ifsc_code, upi_id)
             VALUES (:user_id,  :amount, :account_number, :ifsc_code, :upi_id)`,
                {
                    replacements: { user_id, amount, account_number, ifsc_code, upi_id }
                }
            );

            // Deduct the amount from the user's wallet
            // await sequelize.query(
            //     `UPDATE wallets SET balance = balance - :amount WHERE user_id = :user_id`,
            //     { replacements: { user_id, amount } }
            // );

            res.status(201).json({ status : 201 , message: 'Withdrawal request submitted!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 ,error: error.message });
        }
    }
    async plans(req, res) {
        try {
            const [get_plans] = await sequelize.query(`select * from plans`);
            res.status(200).json({status  :200 , get_plans});

        } catch (error) {
            console.log(error)
            res.status(500).json({status : 500 ,  error: error.message });
        }
    }
    async user_plans(req, res) {
        try {
            const [user_plans] = await sequelize.query(`select * from user_plans where user_id = '${req.user.userId}'`)
            res.status(200).json({status : 200 ,user_plans});
        } catch (error) {
            console.log(error);
            res.status(500).json({ status : 500 ,error: error.message });
        }
    }
    async user_wallet(req, res) {
        try {
            const [walletDetails] = await sequelize.query(
                `SELECT * FROM wallets WHERE user_id = '${req.user.userId}'`,
            );

            if (!walletDetails.length) {
                return res.status(404).json({ message: 'Wallet not found' });
            }

            res.status(200).json({status : 200 , data : walletDetails[0]});
        } catch (error) {
            console.error(error);
            res.status(500).json({status : 500 , error: error.message });
        }
    }
    async get_all_payment_requests(req, res) {
        try {

            const [get_data] = await sequelize.query(`select * from withdrawal_requests where user_id = '${req.user.userId}'`)
            if (!get_data.length) {
                return res.status(404).json({ message: 'withdrawal_requests not found' });
            }
            res.status(200).json({status : 200 , get_data});

        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 ,error: error.message });
        }
    }
    async get_payment_details(req, res) {
        try {
            const id = req.body.id;
            const [payment_dta] = await sequelize.query(`select * from withdrawal_requests where id = '${id}'`)
            if (!payment_dta.length) {
                return res.status(400).json({ message: 'payment withdrawal id not found' });
            }
            res.status(200).json({status  :200 , payment_dta});
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 , error: error.message });
        }


    }

}

export default new UserController()