import mongoose from "mongoose";


const contentSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    log: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Log",
        required: true
    },

    platform: {
        type: String,
        required: true,
        enum: ['instagram', 'linkedin', 'twitter']
    },

    options: [
        {
            text: String,
            reasoning: String,
            tone: String
        }
    ],
    approved: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    refined: {
        bestOptionIndex: Number,
        whyBest: String,
        weakness: String,
        refinedText: String
    }
}, { timestamps: true })

const Content = mongoose.model('Content', contentSchema)
export default Content