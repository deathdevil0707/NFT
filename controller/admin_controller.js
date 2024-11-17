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
            res.status(201).json({ status : 201 , message: 'Plan created successfully!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 ,error: error.message });
        }

    }
    async add_user_amount(req, res) {
        const { user_id, amount } = req.body;
        const [data] = await sequelize.query(`select * from wallets where user_id = '${user_id}'`)

        const balance = Number(amount) + Number(data[0].balance)
        try {
            const [data1] = await sequelize.query(
                `UPDATE wallets SET balance = balance + :amount WHERE user_id = :user_id returning balance`,
                { replacements: { user_id, amount } }
            );
            console.log(data1)

            res.status(200).json({status :200, message: 'Amount added to wallet successfully!' , wallet_amount : data1[0].balance});
        } catch (error) {
            console.error(error);
            res.status(500).json({status: 500, error: error.message });
        }
    }
    async get_all_users(req, res) {
        const data =[];
        try {
            const [users] = await sequelize.query(`SELECT * FROM users`);
            let data = []

            await Promise.all(users.map(async (u)=>{
                const [wallet] = await sequelize.query(` select balance from wallets where user_id = '${u.id}'`)
                console.log(wallet)
                const [plans] = await sequelize.query(`select * from user_plans where user_id = '${u.id}'`)
                console.log(plans)
                const total_plans = plans.length;
                let plan_count = 0
                plans.forEach(element => {
                   if(element.status = 'active'){
                    plan_count++;
                   }
                    
                });
                const total_Active_plans = plan_count
                data.push({...u,balance : wallet[0]?.balance,plans,total_plans,total_Active_plans})
            }))

            res.status(200).json({status : 200 ,users_data: data});
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 ,error: error.message });
        }
    }
    //update withdrawal request from user
    async update_withdrawal(req, res) {
        const { id } = req.body;
        const { status } = req.body; // e.g., 'approved', 'rejected'

        try {
            const [withdrawal_data] = await sequelize.query(`SELECT * FROM withdrawal_requests WHERE id = '${id}'`);
            const [wallet] = await sequelize.query(`select amount from wallets where user_id = '${withdrawal_data[0],user_id}'`)

            if (withdrawal_data.length > 0) {
                const { user_id, amount } = withdrawal_data[0]; // Destructure necessary fields
            
                // Update the withdrawal request status
                await sequelize.query(
                    `UPDATE withdrawal_requests SET status = :status WHERE id = :id`,
                    { replacements: { status, id } }
                );
            
                // Update the wallet balance
                await sequelize.query(
                    `UPDATE wallets SET balance = balance - :amount WHERE user_id = :user_id`,
                    { replacements: { amount, user_id } }
                );

            } else {
                console.error('No withdrawal request found with the given ID.');
                throw new Error('Withdrawal request not found');
            }
            

            res.status(200).json({status:201, message: `Withdrawal request status updated to ${status}` , data:{...withdrawal_data[0],wallet_amount : wallet[0].amount} });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 ,error: error.message });
        }
    }
    async get_withdrawal(req, res) {

        try {
            let data = []
            const [requests] = await sequelize.query(`SELECT * FROM withdrawal_requests`);
            await Promise.all(requests.map(async (r)=>{
                const [wallet_data] = await sequelize.query(`select balance from wallets where user_id = '${r.user_id}'`)
                console.log(wallet_data)
                const [user_Data] = await sequelize.query(`select * from users where id = '${r.user_id}'`);
                const{id , ...withoutuserData} = user_Data[0]

                data.push({...r,balance : wallet_data[0].balance,...withoutuserData})

            }))
            res.status(200).json({status :200 , data});
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    async wallet_details(req, res) {
        const { user_id } = req.body;

        try {
            const [userQuery] = await sequelize.query(`SELECT * FROM users WHERE id = '${user_id}'`,);

            const [walletDetails] = await sequelize.query(
                `SELECT * FROM wallets WHERE user_id = :user_id`,
                { replacements: { user_id } }
            );

            if (!walletDetails.length) {
                return res.status(404).json({ message: 'Wallet not found' });
            }

            res.status(200).json({status : 200,data : { ...walletDetails[0], ...userQuery[0] }});
        } catch (error) {
            console.error(error);
            res.status(500).json({ status : 500 , error: error.message });
        }
    }
    async get_plans(req, res) {
        try {
            const [plans] = await sequelize.query(`SELECT * FROM plans`);

            res.status(200).json({
                status:200,
                message: 'Plans retrieved successfully!',
                plans
            });
        } catch (error) {
            console.error('Error retrieving plans:', error);
            res.status(500).json({ status :500 , error: 'Failed to retrieve plans' });
        }
    }

    async plan_requests(req, res) {
        try {
            let data = []
            const [user_plans] = await sequelize.query(`select * from user_plans where status = 'inactive'`);
            await Promise.all(user_plans.map(async (u) => {
                const [plans] = await sequelize.query(`select * from plans where id = '${u.plan_id}'`)
                console.log(u)
                console.log(plans[0])
                const { id, ...planWithoutId } = plans[0];
                const [user_data] = await sequelize.query(`select * from users where id = '${u.user_id}'`)
                console.log(user_data);
                const { id: userId, ...userWithoutId } = user_data[0];

                // Combine u with the rest of planWithoutId, keeping u.id
                data.push({ ...u, ...planWithoutId ,...userWithoutId});
            }))
            res.status(200).json({
                status:200,
                message: 'data retrieved successfully!',
                data
            });
        } catch (error) {
            console.error('Error retrieving plan request data:', error);
            res.status(500).json({ status : 500 , error: 'Failed to retrieve plan request data', message: error.message });
        }

    }

    async plan_status_update(req, res) {
        try {
            const { plan_request_id ,status} = req.body
            const start = new Date().toISOString();
            const [plan_request_data] = await sequelize.query(`select * from user_plans where id = '${plan_request_id}'`)
            
            const [plans_data] = await sequelize.query(`select * from plans where id = '${plan_request_data[0].plan_id}'`)
            console.log("plans",plans_data[0])
            const [wallet_data] = await sequelize.query(`select * from wallets where user_id = '${plan_request_data[0].user_id}'`)
            const balance =Number(wallet_data[0].balance) + Number(plans_data[0].amount)
            let updated_wallet_Data;
            if(status === 'active'){
            [updated_wallet_Data] = await sequelize.query(`update wallets set balance = '${balance}' returning *`)
            }
            console.log(updated_wallet_Data)
            const response = await sequelize.query(`update user_plans set status = '${status}',start_date = '${start}' where id = '${plan_request_id}'  returning *`)
            console.log(response)
            res.status(201).json({
                status: 201,
                message: 'plan added to user successfully!',
                plan_data: response[0],
                plans : plans_data[0],
                wallet : updated_wallet_Data
            });
        } catch (error) {
            console.log(error)
            res.status(500).json({ status : 500 ,error: 'Failed to update plan request data', message: error.message });

        }


    }
    async get_user_plan(req,res){
        const {user_id} = req.body
        try {
            let data = []
            const [user_plans] = await sequelize.query(`select * from user_plans where user_id = '${user_id}'`);
            await Promise.all(user_plans.map(async (u) => {
                const [plans] = await sequelize.query(`select * from plans where id = '${u.plan_id}'`)
                console.log(u)
                console.log(plans[0])
                const { id, ...planWithoutId } = plans[0];
                const [user_data] = await sequelize.query(`select * from users where id = '${u.user_id}'`)
                console.log(user_data);
                const { id: userId, ...userWithoutId } = user_data[0];

                // Combine u with the rest of planWithoutId, keeping u.id
                data.push({ ...u, ...planWithoutId ,...userWithoutId});
            }))
            res.status(200).json({
                status:200,
                message: 'data retrieved successfully!',
                data
            });
        } catch (error) {
            console.error('Error retrieving user plan  data:', error);
            res.status(500).json({ status : 500 , error: 'Failed to retrieve user plan  data', message: error.message });
        }

    }
    async update_user_status (req,res){
        const {user_id,is_verified} = req.body
        try{

             const [result] =  await sequelize.query(`update users set is_verified = ${is_verified} where id = '${user_id}' returning *`)
             res.status(200).json({status : 200 ,message : 'User status updated successfully',users_data: result[0]});

        }catch(error){
            console.error('Error user status update ', error);
            res.status(500).json({ status : 500 , error: 'Failed to update user status', message: error.message });
        }
    }
    async update_plan(req, res) {
        const { plan_id, ...fieldsToUpdate } = req.body;
    
        try {
            const setClause = Object.keys(fieldsToUpdate).map(key => `${key} = :${key}`).join(', ');
            
            const [updatedRows] = await sequelize.query(
                `UPDATE plans 
                 SET ${setClause} 
                 WHERE  id = :plan_id returning *`,
                {
                    replacements: {plan_id, ...fieldsToUpdate }
                }
            );
            console.log(updatedRows[0])
            // if (updatedRows === 0) {
            //     return res.status(404).json({ status: 404, message: 'Plan not found or no changes made.' });
            // }
    
            res.status(200).json({ status: 200, message: 'Plan updated successfully!' , data : updatedRows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async  approveWalletRequest(req, res) {
        const { request_id } = req.body;
    
        try {
            // Find and update the wallet request status to 'approved'
            const [request] = await sequelize.query(
                `UPDATE wallet_requests 
                SET status = 'approved', approved_at = CURRENT_TIMESTAMP 
                WHERE id = :request_id AND status = 'pending' RETURNING *`,
                { replacements: { request_id } }
            );
    
            if (!request.length) {
                return res.status(404).json({ status: 404, message: 'Request not found or already processed' });
            }
    
            // Credit the amount to the user's wallet
            const userId = request[0].user_id;
            const amount = request[0].amount;
    
            await sequelize.query(
                `UPDATE wallets SET balance = balance + :amount WHERE user_id = :user_id`,
                { replacements: { amount, user_id: userId } }
            );
    
            res.status(200).json({ status: 200, message: 'Wallet request approved and amount credited!', request: request[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async getAllWalletRequests(req, res) {
        try {
            // Query to get all wallet requests
            const [walletRequests] = await sequelize.query(
                `SELECT * FROM wallet_requests ORDER BY created_at DESC`
            );
    
            // Check if there are any wallet requests
            if (!walletRequests.length) {
                return res.status(404).json({ status: 404, message: 'No wallet requests found' });
            }
    
            // Send the wallet requests in the response
            res.status(200).json({ status: 200, data: walletRequests });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }

    // Function to handle admin approval/rejection
    async handleAdminDecision(req, res) {
        const { request_id, admin_decision } = req.body; // admin_decision should be 'approved' or 'rejected'
    
        try {
            // Check if the redeem request exists
            const [redeemRequest] = await sequelize.query(
                `SELECT * FROM redeem_requests WHERE id = :request_id AND status = 'pending'`,
                { replacements: { request_id } }
            );
    
            if (!redeemRequest.length) {
                return res.status(404).json({ status: 404, message: 'Redeem request not found or already processed' });
            }
    
            if (admin_decision === 'approved') {
                // Update the plan status to 'redeemed'
                await sequelize.query(
                    `UPDATE user_plans SET status = 'redeemed' WHERE user_id = :user_id AND plan_id = :plan_id`,
                    { replacements: { user_id: redeemRequest[0].user_id, plan_id: redeemRequest[0].plan_id } }
                );
    
                // Credit the redeem amount to the user's wallet (assume wallet handling code exists)
                await sequelize.query(
                    `UPDATE wallets SET balance = balance + :redeem_amount WHERE user_id = :user_id`,
                    { replacements: { redeem_amount: redeemRequest[0].redeem_amount, user_id: redeemRequest[0].user_id } }
                );
    
                res.status(200).json({ status: 200, message: 'Redeem request approved and amount credited' });
            } else if (admin_decision === 'rejected') {
                // Update the plan status to 'active' again
                await sequelize.query(
                    `UPDATE user_plans SET status = 'active' WHERE user_id = :user_id AND plan_id = :plan_id`,
                    { replacements: { user_id: redeemRequest[0].user_id, plan_id: redeemRequest[0].plan_id } }
                );
    
                res.status(200).json({ status: 200, message: 'Redeem request rejected, plan reactivated' });
            } else {
                res.status(400).json({ status: 400, message: 'Invalid admin decision' });
            }
    
            // Update the redeem request status
            await sequelize.query(
                `UPDATE redeem_requests SET status = :admin_decision WHERE id = :request_id`,
                { replacements: { admin_decision, request_id } }
            );
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async  getAllRedeemRequests(req, res) {
        try {
            // Query to get all redeem requests along with user and plan details
            const [redeemRequests] = await sequelize.query(
                `select * from redeem_requests`
            );
    
            if (redeemRequests.length === 0) {
                return res.status(404).json({ status: 404, message: 'No redeem requests found' });
            }
    
            res.status(200).json({ status: 200, data: redeemRequests });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, error: error.message });
        }
    }
    async spin_wheel_config(req, res) {
        try {
            const { amount } = req.body;
    
            if (!amount) {
                return res.status(400).json({ message: 'Amount is required' });
            }
    
            const [updated_result] = await sequelize.query(
                `UPDATE spin_wheel_config SET amount_deducted_per_spin = '${amount}' RETURNING *`
            );
    
            if (updated_result.length === 0) {
                return res.status(404).json({ message: 'No configuration found to update' });
            }
    
            res.status(200).json({
                status:200,
                message: 'Configuration updated successfully',
                data: updated_result
            });
        } catch (error) {
            console.error('Error updating spin wheel configuration:', error);
            res.status(500).json({ status:500,message: 'Internal server error', error: error.message });
        }
    }
    
    
    
}

export default new AdminApiControler();