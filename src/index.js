
import {app} from './app.js'
import dotenv from "dotenv"
import connectDB  from "./DB/mongoDB.js";



dotenv.config({
    path: "./.env",
})


connectDB()
    .then(
        () => {
            app.listen(process.env.PORT||7000, () => {
             console.log(` ⚙️  srever is running at ${process.env.PORT}`)
         })
            
    }
)
    .catch((error) => {
    
        console.log(`DB Connction Error ${error}`);
})