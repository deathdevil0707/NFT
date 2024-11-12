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
            const response = await sequelize.query(`update user_plans set status = '${status}' where id = '${plan_request_id}'  returning *`)
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
}

export default new AdminApiControler();