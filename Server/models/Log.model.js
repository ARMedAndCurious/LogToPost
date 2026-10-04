import mongoose from "mongoose";

const logSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },

    text:{
        type: String
    },

    image:{
        type: String
    }
}, {timestamps: true})

const Log = mongoose.model('Log', logSchema)

export default Log