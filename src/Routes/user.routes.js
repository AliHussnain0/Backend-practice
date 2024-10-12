import { Router } from "express";
import {upload} from '../Middlewares/multer.middleware.js'
import {
    RegisterUser,
    login,
    test,
    logout,
    refreshAccessToken,
    changePassword,
    currentUser,
    getSubscription,
    subscriptionRequest,
    changeAvatar
} from "../Controllers/user.controllers.js";
import { verify } from "crypto";
import { verifyJwt } from "../Middlewares/Auth.middleware.js";
const router = Router();

router.route("/test").get(test);
router.route("/register").post(
    upload.fields([{
        name: "avatar",
        maxCount:1,
    },
        {
            name: "coverImage",
            maxCount:1,
        }
    ]),
    
RegisterUser);
router.route("/User").post(verifyJwt, currentUser);
router.route("/refresh").post(refreshAccessToken)
router.route("/login").post(login);
router.route("/logout").post(verifyJwt, logout)
router.route("/changePass").post(verifyJwt, changePassword)
router.route("/c/:username").get(verifyJwt, getSubscription)
router.route("/s/:username").get(verifyJwt, subscriptionRequest)
router.route("/changep").get(verifyJwt,
    upload.fields([{
        name: "avatar",
        maxCount:1,
    }]),
    changeAvatar)
router.route().delete()


export default router