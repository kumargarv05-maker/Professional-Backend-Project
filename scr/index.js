import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({path: "./.env"})
import { app } from "./app.js";

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERROR: ", error)
        throw error
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`** SERVER IS RUNNING ON PORT: ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("DB CONNECTION is Failed: ", error)
})












/*
import express from "express";

const app = express();

( async ()  => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT || 8000, () =>{
            console.log(`app is listneing on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()
*/