import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFiles: {
            type: String,  //coludinery URL
            required: true,
        },
        thumbnail: {
            type: String,  //coludinery URL
            required: true,
        },
        title: {
            type: String,  
            required: true,
        },
        description: {
            type: String,  
            required: true,
        },
        duration: {
            type: Number,  
            required: true,
        },
        view: {
            type: Number,
            default: 0,
            required: true
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            tyep: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)