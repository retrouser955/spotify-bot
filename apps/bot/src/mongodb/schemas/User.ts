import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    access_token: {
        type: String,
        required: true
    },
    token_type: {
        type: String,
        required: true
    },
    expires_in: {
        type: Number,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    scope: {
        type: String,
        required: true
    },
    requested_on: {
        type: Number,
        required: true
    }
})

export const User = mongoose.model("user", userSchema)