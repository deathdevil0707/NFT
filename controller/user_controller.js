import { sequelize } from "../db/index.js";
import express from 'express';



class UserController {

    // async select_plan(req, res) {
    //     const { user_id, plan_id } = req.body;

    //     try {
    //         // Check if the plan exists
    //         const [plan] = await sequelize.query(
    //             `SELECT * FROM plans WHERE id = :plan_id`,
    //             { replacements: { plan_id } }
    //         );

    //         if (!plan.length) {
    //             return res.status(404).json({status : 404 , message: 'Plan not found' });
    //         }
    //         const [check_Data] =  await sequelize.query(`select * from user_plans where user_id = '${user_id}' and plan_id = '${plan_id}'`)
    //         if (check_Data.length > 0 && (check_Data[0].status === 'active' || check_Data[0].status === 'inactive')) {
    //            return res.status(400).json({ status: 400, message: 'Plan already selected' });
    //         }

    //         // Add the selected plan for the user
    //         const [update_data] =  await sequelize.query(
    //             `INSERT INTO user_plans (user_id, plan_id, status) VALUES (:user_id, :plan_id, :status) returning *`,
    //             { replacements: { user_id, plan_id, status: 'inactive' } }
    //         );
    //         const [data] = await sequelize.query(`select * from user_plans where user_id = '${user_id}' and plan_id = '${plan_id}'`)


    //         res.status(201).json({status : 200 ,  message: 'Plan selected successfully!' ,  updated_data : update_data[0]});
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ status : 500 , error: error.message });
    //     }
    // }
    async createWalletRequest(req, res) {
        const { user_id, amount } = req.body;

        try {
            // Insert a new wallet request with 'pending' status
            const [newRequest] = await sequelize.query(
                `INSERT INTO wallet_requests (user_id, amount, status) 
                VALUES (:user_id, :amount, 'pending') RETURNING *`,
                { replacements: { user_id, amount } }
            );

            res.status(201).json({ status: 201, message: 'Wallet request created successfully!', request: newRequest[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async select_plan(req, res) {
        const { user_id, plan_id } = req.body;

        try {
            // Check if the plan exists
            const [plan] = await sequelize.query(
                `SELECT * FROM plans WHERE id = :plan_id`,
                { replacements: { plan_id } }
            );

            if (!plan.length) {
                return res.status(404).json({ status: 404, message: 'Plan not found' });
            }

            // Check if the user already has the plan
            const [check_Data] = await sequelize.query(
                `SELECT * FROM user_plans WHERE user_id = :user_id AND plan_id = :plan_id`,
                { replacements: { user_id, plan_id } }
            );
            if (check_Data.length > 0 && (check_Data[0].status === 'active' || check_Data[0].status === 'inactive')) {
                return res.status(400).json({ status: 400, message: 'Plan already selected' });
            }

            // Check if the user has enough balance in the wallet
            const [wallet] = await sequelize.query(
                `SELECT balance FROM wallets WHERE user_id = :user_id`,
                { replacements: { user_id } }
            );

            if (!wallet.length) {
                return res.status(400).json({ status: 400, message: 'Wallet not found' });
            }

            const planAmount = plan[0].amount; // Assuming the plan table has an amount field
            const userBalance = wallet[0].balance;

            if (userBalance < planAmount) {
                // Create a wallet request for admin approval

                return res.status(402).json({
                    status: 402,
                    message: 'Insufficient balance. A request has been sent to the admin for approval.'
                });
            }

            // Deduct the amount from the wallet and activate the plan
            await sequelize.query(
                `UPDATE user_wallets SET balance = balance - :planAmount WHERE user_id = :user_id`,
                { replacements: { planAmount, user_id } }
            );

            // Add the selected plan for the user and mark it as active
            const [update_data] = await sequelize.query(
                `INSERT INTO user_plans (user_id, plan_id, status, start_date) 
                 VALUES (:user_id, :plan_id, :status, NOW()) RETURNING *`,
                { replacements: { user_id, plan_id, status: 'inactive' } }
            );

            res.status(201).json({ status: 200, message: 'Plan selected successfully!', updated_data: update_data[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
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

            res.status(201).json({ status: 201, message: 'Withdrawal request submitted!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async plans(req, res) {
        try {
            const [get_plans] = await sequelize.query(`select * from plans`);
            res.status(200).json({ status: 200, get_plans });

        } catch (error) {
            console.log(error)
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async user_plans(req, res) {
        try {
            const [user_plans] = await sequelize.query(`select * from user_plans where user_id = '${req.user.userId}'`)
            res.status(200).json({ status: 200, user_plans });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: 500, error: error.message });
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

            res.status(200).json({ status: 200, data: walletDetails[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async get_all_payment_requests(req, res) {
        try {

            const [get_data] = await sequelize.query(`select * from withdrawal_requests where user_id = '${req.user.userId}'`)
            if (!get_data.length) {
                return res.status(404).json({ message: 'withdrawal_requests not found' });
            }
            res.status(200).json({ status: 200, get_data });

        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async get_payment_details(req, res) {
        try {
            const id = req.body.id;
            const [payment_dta] = await sequelize.query(`select * from withdrawal_requests where id = '${id}'`)
            if (!payment_dta.length) {
                return res.status(400).json({ message: 'payment withdrawal id not found' });
            }
            res.status(200).json({ status: 200, payment_dta });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }


    }
    async coin_info(req, res) {
        let data = []
        try {
            const [user_plans] = await sequelize.query(`select * from user_plans where user_id = '${req.user.userId}'`)
            await Promise.all(user_plans.map(async (u) => {
                const [coin_data] = await sequelize.query(`select * from plans where id = '${u.plan_id}'`)
                const { id, ...coinwithoutid } = coin_data[0]
                const end_date = new Date(u.start_date);
                end_date.setDate(end_date.getDate() + 40);
                data.push({ ...u, ...coinwithoutid, end_date })
            }))
            res.status(200).json({ status: 200, data: data })
        } catch (error) {
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async add_wallet_amount(req, res) {
        try {
            const { amount, user_id } = req.body;
            // inserting waalet request of user 
            const [update_data] = await sequelize.query(`INSERT into wallet_requests (user_id , amount ,status) 
            values('${user_id}' , '${amount}' , 'pending' ) returning *
            `);

            res.status(201).json({status:201,message : 'request has been sent to the admin', data : update_data[0]})
        } catch (error) {
            console.log(error)
        }



    }


}

export default new UserController()