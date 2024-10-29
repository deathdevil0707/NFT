import express from 'express';
const app = express();
import { connectdb } from './db/index.js';
import router from './routes/index.js';
app.use(express.json())
app.use(router)

app.listen(7000, () => {
    console.log(`server is running on http://localhost:7000`);
    connectdb()
})

