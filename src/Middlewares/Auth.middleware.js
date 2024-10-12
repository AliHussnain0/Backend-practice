
import jwt from "jsonwebtoken"
import { User } from "../Models/user.model.js"
import  ApiError  from "../Utils/ApiError.js"
import { asyncHandler } from "../Utils/AsyncHandler.js"
const verifyJwt = asyncHandler(async (req,_,next) => {
    try {
        
        const token = (req.cookies.accessToken || req.header("Authorization").replace("Bearer ", ""))
        if (!token) {
            throw new ApiError(400, "token is not recived!!!");
        }
        console.log(token);
        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decode._id).select(
            "-password -refreshToken"
        )
        if (!user) {
            throw new ApiError(402, "User not exist!!!");
        }
        req.user = user;
        next();
    } catch (error) {

        next();
       // throw new ApiError(400, "authentication failed!!!");
    }
})

export { verifyJwt };