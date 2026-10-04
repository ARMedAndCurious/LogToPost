import { Groq } from "groq-sdk/client.js";
import dotenv from 'dotenv'

dotenv.config()

const groq = new Groq({apiKey: process.env.GROQ_API_KEY})

export default groq