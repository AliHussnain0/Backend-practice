import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: process.env.CORS,
    Credential: true,
}))


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static('public'))
app.use(cookieParser())


//routes
import useRouters from "./Routes/user.routes.js"

app.use('/api/v1/users', useRouters);


export {app}