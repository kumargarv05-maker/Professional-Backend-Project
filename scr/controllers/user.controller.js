import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

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
    console.log("email :", email)

    if([username, email, fullName, password].some((field) => field?.trim() === "")){
        throw new apiError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new apiError(409, "username and email are already existed in the system")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400, "Avatar is required")
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
        throw new apiError(500, "Something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )


})

export { registerUser } 