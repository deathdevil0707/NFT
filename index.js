import express from 'express';
const app = express();
import { connectdb } from './db/index.js';
import router from './routes/index.js';
app.use(express.json())
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

