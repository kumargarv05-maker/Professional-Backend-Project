import { Router } from "express";
import { 
    logoutUser, 
    loginUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getUserHistory 
    } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

//secure routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route('/current-user').get(verifyJWT, getCurrentUser)

// patch use for the update only the perticuler fields
router.route('/update-account').patch(verifyJWT, updateUserDetails)
router.route('/user-avatar').post().patch(verifyJWT, upload.single("avatar"), updateUserAvatar) 
router.route('/cover-image').patch(verifyJWT, upload.single("coverImage"),updateUserCoverImage)

// get used for the fetching the data
router.route('/c/:username').get(verifyJWT, getUserChannelProfile)
router.route('/history').get(verifyJWT, getUserHistory)
    

export default router 