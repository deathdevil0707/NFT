import dotenv from "dotenv";
dotenv.config();
export const config = {
    jwt_secret : process.env.JWT_SECRET,
    dburl: process.env.DATABSE_URL,
    db_name : process.env.DB_NAME,
    db_user : process.env.DB_USER,
    db_password : process.env.DB_PASSWORD,
    db_host : process.env.DB_HOST,
}