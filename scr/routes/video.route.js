import { Router } from "express";
import {
<<<<<<< HEAD
    getAllVideos,
    publishAVideo

=======
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo
>>>>>>> 715bc62e127371c4e432197470f8edde1e66a131
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

<<<<<<< HEAD
const router = Router();

router.use(verifyJWT);

router.route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFiles",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo
    )

export default router 
=======
const router = Router()
>>>>>>> 715bc62e127371c4e432197470f8edde1e66a131
