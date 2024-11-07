import express from 'express';
const app = express();
import { connectdb } from './db/index.js';
import router from './routes/index.js';
import cors from 'cors'
app.use(express.json())
app.use(cors());
app.use((req, res, next) => {
    res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Content-Security-Policy": "default-src *",
        "X-Content-Security-Policy": "default-src *",
        "X-WebKit-CSP": "default-src *"
    })
    next();
});
app.use(router)

app.get("/",(req,res)=>{
    try {
        res.status(200).json({
            status: 200,
            message: "health is ok!"
        });
    } catch (error) {
        res.status(200).json({
            status: 500,
            message: "flag0"
        });
    }
})
app.listen(7000, () => {
    console.log(`server is running on http://localhost:7000`);
    connectdb()
})

