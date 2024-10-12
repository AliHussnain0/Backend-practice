import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { type } from "os";

const UserSchema = new Schema({
    
    username: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        index: true,
        trim:true,

    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index:true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase:true,
    },
    avatar:{
        type: String,// from cloudinary
        required:true,
    },
    coverImage: {
        type: String,  
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    refreshToken: {
        type:String,        
    },
    password: {
        type: String,
        required: [true,"password is required"]   
    }
}, { timestamps: true });

//this.isModified method using schema context
//hash methode from bcrypt library

UserSchema.pre('save', async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();                       //    string     ,salt(encryption)
})
//compare method using bcrypt library

UserSchema.methods.IsPassword = async function (password) {
    return await bcrypt.compare(password, this.password); //this will return a bool type
}

//provided by server to provide access to user

UserSchema.methods.generateAccessToken = function () {
    console.log("okkkkkk");

   return jwt.sign({
        _id: this._id,
        username: this.username,
        fullname: this.fullname,
        email: this.email
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRESIN,
        }
    )
}
//generate a refresh token using sign methode of jwt library 

UserSchema.methods.generateRefreshToken = function() {
  return  jwt.sign({
        _id: this._id,

    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRESIN,
        }
    )
}

export const User = mongoose.model("User", UserSchema);