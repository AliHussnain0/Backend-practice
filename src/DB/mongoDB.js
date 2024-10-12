import mongoose from "mongoose";
import { DB_Name } from "../constants.js"
import {app} from "../app.js"
const connectDB = async ()=> {
    

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB}/${DB_Name}`);
        console.log("Connected with", connectionInstance.connection.host);
        // app.on('error', (error) => {
        //     console.log('error', error);
        //     throw err;
        // })
    } catch (error) {
        console.log("Database Connection Failed!!!", error);
        process.exit(1);
    }

}

export default connectDB 