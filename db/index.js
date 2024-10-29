import Sequelize from 'sequelize';
import { config } from '../config/index.js';

const { db_name , db_password , db_user , db_host} = config;
console.log("database credentials",db_name , db_host , db_password , db_user)
console.log("after database connection")

export const sequelize = new Sequelize(
    db_name,
    db_user,    
    db_password,   
    {
        host: db_host,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,  // Enforce SSL
                rejectUnauthorized: false  // This allows self-signed certificates, useful for certain cloud providers
            },
            connectTimeout: 60000,  // Timeout after 60 seconds
        },

        pool: {
            max: 20,
            min: 0,
            acquire: 120000,  // Try for 120 seconds to get a connection before throwing an error
            idle: 10000,  // Remove idle connections after 10 seconds
        },
        logging: false  // Disable SQL logging, you can enable this if debugging
    }
);

// export const sequelize = new Sequelize(dburl, {
//     dialect: 'postgres',
//     dialectOptions: {
//         connectTimeout: 60000, 
//     },
//     pool: {
//         max: 20,    
//         min: 0,     
//         acquire: 120000,  
//         idle: 10000  
//     },
//     logging: false  
// });
export const connectdb = async () => {
    try {
        await sequelize.authenticate();
        console.log('database connected successfully !');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
} 