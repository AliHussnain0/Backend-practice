import { asyncHandler } from "../Utils/AsyncHandler.js";
import { User } from "../Models/user.model.js"
import ApiError from "../Utils/ApiError.js";
import { cloudinary_p, cloudinary_ret } from "../Utils/Cloudinary.js";
import { ApiResponce } from "../Utils/ApiResponce.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../Models/subscription.model.js";

import mongoose from "mongoose";

const generateRefreshTokenAndAccessToken = async (user_id) => {
    const user = await User.findById(user_id);
    const accessTok = user.generateAccessToken();

    const refreshTok = user.generateRefreshToken();
    user.refreshToken = refreshTok;
    await user.save({ validateBeforeSave: false });
    console.log(accessTok);
    return { accessTok, refreshTok };
}

const test = asyncHandler(async (req, res) => {
    res.status(200).json({
        working: "good!!!",
    })
})

const RegisterUser = asyncHandler(async (req, res) => {

    const { fullname, username, email, password } = req.body;
    if ([fullname, username, email, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "all fields are required!!!");
    }



    const user_exist = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (user_exist) {
        throw new ApiError(400, "User already exist!!!");
    }
    const localavatar = req.files?.avatar[0]?.path;
    let localcoverImage = null;
    // if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
    //     localavatar=req.files.avatar[0]?.path
    // }  
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        localcoverImage = req.files.coverImage[0]?.path
    }
    if (!localavatar) {
        throw new ApiError(400, "there exist some error while retriveing avatar")
    }
    const c_avatar = await cloudinary_p(localavatar);
    const c_coverImage = await cloudinary_p(localcoverImage);
    if (!c_avatar) {
        throw new ApiError(500, "Some server side issue while uploading avatar file");
    }
    const userss = await User.create({

        fullname,
        avatar: c_avatar.url,
        coverImage: c_coverImage?.url || "",
        email,
        username: username,
        password,

    });
    console.log("okkkkkk");
    if (!userss) {

        throw new ApiError(500, "user is not retrived!!!")
    }
    const created_userss = await User.findById(userss._id).select(
        "-password -refreshToken"
    )


    return res.status(200).json(new ApiResponce(200, created_userss, "user has been registered!!"));
})

const login = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body;
    console.log(username, email)
    if (username === "" && email === "") {

        throw new ApiError(410, "provide me either name or email");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        console.log("we are inn")
        throw new ApiError(400, "Already User Exist!!!");

    }

    const pass = user.IsPassword(password);
    if (!pass) {
        throw new ApiError(409, "Incorrect Password!!!");
    }
    const { accessTok, refreshTok } = await generateRefreshTokenAndAccessToken(user._id);
    console.log("okkkkkk", accessTok);
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    res.status(200)
        .cookie("refreshToken", refreshTok, options)
        .cookie("accessToken", accessTok, options)
        .json(new ApiResponce(200, { user: loggedInUser, refreshTok, accessTok }, "User successfully logged in!!!"));

})

const logout = asyncHandler(async (req, res) => {
                                                //USER is provided by authentication (middleware)
    const verified_user = await User.findById(req.user._id);

    if (!verified_user) {
        throw new ApiError(400, "User not verified");
    }
    verified_user.refreshToken = undefined;
    verified_user.save({ validateBeforeSave: false });
    const options = {
        httpOnly: true,
        secure: true,
    }
    res.status(200).clearCookie("refreshToken", options).clearCookie("accessToken", options).json(new ApiResponce(200, verified_user.username, "user successfully logged out"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingToken) {
        throw new ApiError(500, "Unable to access Token!!!");
    }
    const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
        throw new ApiError(400, "Unable to find User")
    }
    if (!(user.refreshToken === incomingToken)) {
        throw new ApiError(400, "you are unauthorized! Access denied");
    }

    const { refreshTok, accessTok } = await generateRefreshTokenAndAccessToken(user._id);
    const idenUser = await User.findById(user._id).select("-password -refreshToken");

    if (!idenUser) {
        throw new ApiError(400, "Unable to find User")
    }
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("refreshToken", refreshTok, options).cookie("accessToken", accessTok, options).json(new ApiResponce(200, idenUser, "Access Provided"));

})

const changePassword = asyncHandler(async (req, res) => {
    const { pre_password, newPassword, ConfirmPassword, email } = req.body;

    if (!req.user) {
        if (!email) {
            throw new ApiError(`Please provide email address`);
        }
        const logout_user = await User.findOne({ email });
        if (!logout_user) {
            throw new ApiError(499, `user does'nt exist! with email: ${email} `);
        }
        const req_user = await logout_user.IsPassword(pre_password);
        if (!req_user) {
            throw new ApiError(400, "Previous password is not Correct!!!");
        }
        if (!(newPassword === ConfirmPassword)) {
            throw new ApiError(402, "Recheck your confirm password!!!");
        }
        logout_user.password = newPassword;

        await logout_user.save({ validateBeforeSave: false });
        const user = await User.findById(logout_user._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(500, `Server is unable to recognize user with id = ${user._id}`)
        }
        return res.status(200).json(new ApiResponce(200, user, "Password Changed Successfully!!!"));
    }


    console.log(req.user.email)
    const req_user = await User.findById(req.user._id);
    if (!req_user) {
        throw new ApiError(500, `UnAuthorized user!!!`);
    }
    const authUser = await req_user.IsPassword(pre_password);

    if (!authUser) {

        throw new ApiError(400, "Previous password is not Correct!!!");
    }
    if (!(newPassword === ConfirmPassword)) {
        throw new ApiError(402, "Recheck your confirm password!!!");
    }

    req_user.password = newPassword;
    await req_user.save({ validateBeforeSave: false });

    const user = await User.findById(req_user._id);
    if (!user) {
        throw new ApiError(500, `Server is unable to recognize user with id = ${user._id}`)
    }
    return res.status(200).json(new ApiResponce(200, user, "Password Changed Successfully!!!"));
})

const currentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponce(200, req.user.username, "User fetched successfully"));
})

const getSubscription = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(499, "user does not exist!!!");
    }
    console.log(username);
    const channel = await User.aggregate([
        {
            $match: {
                username: username
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers",

            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribeTO",
            }
        }, {
            $addFields: {

                Subscribers: {
                    $size: "$Subscribers"
                },
                Subscribed: {
                    $size: "$SubscribeTO",
                },
                SubscribeState: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$Subscribers.subscriber"]
                        },
                        then: true,
                        else: false,

                    }
                }
            }

        }, {
            $project: {
                username: 1,
                fullname: 1,
                Subscribers: 1,
                Subscribed: 1,
                SubscribeState: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ]);

    if (!channel) {
        throw new ApiError(472, "No channel exist like that!!!");
    }
    return res.status(200).json(new ApiResponce(200, channel, "channel credentials fetched."))

})

const subscriptionRequest = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, 'channel not exist!!!');
    }

    const chan = await User.aggregate([{
        $match: {
            username: username?.toLowerCase(),
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "Subscribers"
        }

    }, {
        $addFields: {
            _id: "$_id",
            channelSubscribers: "$Subscribers",
            alreadySubscribed: {
                $cond: {
                    if: { $in: [req.user._id, "$Subscribers.subscriber"] },
                    then: true,
                    else: false,
                }
            },
            selfSubscribe: {
                $cond: {
                    if: { $eq: [req.user._id, "$_id"] },
                    then: true,
                    else: false,
                }
            }
        }
    }, {
        $project: {
            selfSubscribe: 1,
            alreadySubscribed: 1,
            id: 1,
            channelSubscribers: 1,
        }
    }


    ]);
    console.log(chan[0].channelSubscribers);
    if (chan[0].alreadySubscribed || chan[0].selfSubscribe) {
        console.log("Either you have already subscribed this channel or you are trying to subscribe your own channel")
        throw new ApiError(400, "Either you have already subscribed this channel or you are trying to subscribe your own channel");
    }

    const details = await Subscription.create({
        channel: chan[0]._id,
        subscriber: new mongoose.Types.ObjectId(req.user._id)
    });
    console.log(details.channel);
    res.status(200).json(new ApiResponce(200, details, "subsribSCRIPTION has beEN decleared!"))
});

const changeAvatar = asyncHandler(async (req, res) => {
    let { newavatar } = req.body
    if (!newavatar) {
        throw new ApiError(400, ("avatar is missing"));
    }
    let local_image;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        local_image = req.files.avatar[0].path;
    } else {
        throw new ApiError(400, "local image is missing or unable to fetch file from cloudinary!!!");
    }


    // using regex extract public id from user url
    // const regex = `/\/(?:v\d+/\)?([^/.]+)(?:\.[a-zA-Z]+)?$/`;
    // const match = avatar_url.match(regex);
    // const public_id = match ? match[1] : null;
    console.log(local_image);
    const temp = new URL(newavatar);
    const arr = temp.pathname.split("/");
    const public_image = arr[arr.length - 1];
    const public_id = public_image.split(".");
    if (!public_id) {
        throw new ApiError(402, "public_ id is not fetched!!!");
    }

    console.log(public_id[0]);
    await cloudinary_ret(public_id[0]);

    const uploaded_pic = await cloudinary_p(local_image);
    if (!uploaded_pic) {
        throw new ApiError(402, "Uploading is not done!!!");
    }

    console.log(uploaded_pic);

    req.user.avatar = uploaded_pic.url;
    await req.user.save({ validateBeforeSave: false });



    return res.status(200).json(new ApiResponce(200, uploaded_pic.url, "file"))

})
export {
    test,
    RegisterUser,
    login, logout,
    refreshAccessToken,
    changePassword,
    currentUser,
    getSubscription,
    subscriptionRequest,
    changeAvatar
}