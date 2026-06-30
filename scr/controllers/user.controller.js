import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const registerUser = asyncHandler( async (req, res) => {
    // get user data from the frontend
    // validation - not empty
    // check the user is already exists : username, email
    // check the image, check the avatar
    // upload the image and avatar to cloudinary 
    // create an obejct - create the entry in DB
    // remove the password and refresh token feild from the response
    // check the user creation is successful
    // send resoponse

    const { username, email, password, fullName } = req.body
    // console.log("email :", email)

    if([username, email, fullName, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "username and email are already existed in the system")
    }
    // console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )


})

const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        // console.log(userId)
        const user = await User.findById(userId)
        // console.log("user -- :", user)
        const accessToken = user.gernerateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // console.log("refreshtoken :",refreshToken)

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        // console.log(userId)
        throw new ApiError(500, "something went wrong while gernaerating refresh token and access token")
    }
}

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> data
    // email and password
    // find user
    // check password
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body
    console.log(email);

    if( !email && !username ){
        throw new ApiError(400, "username or email is required")
    }

    // if( !(email || username) ){
    //     throw new ApiError(400, "username or email is required")
    // }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(user)

    if (!user){
        throw new ApiError(404, "User is not existed")        
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(403, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)

    const loggedInUser = await User.find(user._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option) 
    .json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
    )
})

const logoutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invailid refresh token")
        }
        console.log("user refresh token :", user.refreshToken)
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or used")
        }   
    
        const option = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessTokenandRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", newRefreshToken, option)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => { 
    const { oldPassword, newPassword, confPassword} = req.body

    if(!(newPassword === confPassword)){
        throw new ApiError(400, "Password does not match")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (isPasswordCorrect) {
        throw new ApiError(400, "Invailid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false})

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Passeord changed successfully"))

})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fateched succcessfully")
    )
})

const updateUserDetails = asyncHandler( async (req, res) => {
    const { fullName, email } = req.body
    
    if (!(fullName && email)) {
        throw new ApiError(400, "All fields are required:")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200, user, "User Details Updated Successfully"))

})

const updateUserAvatar = asyncHandler( async (req, res) => { 
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //TODO delete old image - assgnment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

     if(avatar.url && user.avatar){
        await deleteFromCloudinary(user.avatar)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User avatar upadated successfully")
    )
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    if(coverImage.url && user.coverImage){
        await deleteFromCloudinary(user.coverImage)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User cover Image upadated successfully")
    )
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
                }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {    
                    $size: ["$subscribers"]
                },
                channelsSubscribedToCount: {
                    $size: ["$subscribedTo"]
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [ req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }      
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
                
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getUserHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    // getting only required fields
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // for getting the first index of the owner array
                        $addFields: {
                            owner: { 
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "User watch history fetched successfully")
    )
})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserHistory
    
 } 