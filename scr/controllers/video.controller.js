import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Video } from '../models/video.model.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

const getAllVideos = asyncHandler(async (req, res) => {

    /*
    1.extract query params
    2.validate userId
    3.buils matchage - owner(userId), isPublished(true), option $regex search(title and description)
    4.aggregation pipeline 
        $match for filter 
        $lookup for join info 
        $unwind for flatten 
        $sort for dynamic sort(createdAt, View, etc.)
        $project fot send require fields

    5.agregatePaginates for handling page, limit efficiently
    6.return responce
    */
    const {
        page = 1,
        limit = 10,
        query, sortBy,
        sortType,
        userId
    } = req.query

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User")
    }

    const matchstage = {
        owner: new mongoose.Types.ObjectId(userId),
        isPublished: true
    }

    if (query?.trim()) {
        matchstage.$or = [
            { title: { $regex: query, $options: "i" } },
            {description : { $regex: query, $options: "i" } }
        ]
    }

    const pipeline = [
        { $match: matchstage },

        {
            $lookup: {
                from: "user",
                localField: "owner",
                foreignField: "_id",
                as: "wonerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $project: {
                videoFiles: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                view: 1,
                isPublished: 1,
                createdAt: 1,
                ownerDetails: 1
            }
        }
    ]

    const option = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const videos = await Video.aggregatePaginate([
        Video.aggregate(pipeline),
        options
    ])

    if (!video.docs.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No video found for this user"))
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Video fetcheed succesfully")
        )
})

const publishVideo = asyncHandler(async ( req, res) => {
    const { title, decription } = req.body

    if(!title?.trim() || !decription?.trim()){
        throw new ApiError(400, "Title and decription are required")
    }

    videoLocalPath = req.files?.videofile?.[0]?.videoLocalPath
    thumbnailLocalPath = req.files?.videofile?.[0]?.thumbnailLocalPath

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is required")
    }
})


export {
    getAllVideos
}

