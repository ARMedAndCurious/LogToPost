import { runAgentPipeline } from "../agent/pipeline.js";
import { uploadToCloudinary } from "../Utils/uploadToCloudinary.js";
import Log from "../models/Log.model.js";
import Content from "../models/Content.model.js";

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let image = null;



        if (!text && !req.file) {
            return res.status(400).json({ message: "Add a caption or an image" });
        }

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(req.file.buffer);
            image = uploadedImage.secure_url;
        }


        const profession = req.user.profession
        const result = await runAgentPipeline(text, image, profession)

        const log = await Log.create({
            user: req.user._id,
            text,
            image
        })

        const platforms = ['instagram', 'linkedin', 'twitter']

        const contentDocs = await Promise.all(
            platforms.map(platform =>
                Content.create({
                    user: req.user._id,
                    log: log._id,
                    platform,
                    options: result.platforms[platform].options,
                    refined: result.platforms[platform].refined
                })
            )
        )

        return res.status(201).json({
            message: "Post created successfully!",
            log,
            content: contentDocs,
            analysis: result.analysis,
            platforms: result.platforms
        })
    } catch (error) {
        console.error("Create post error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const approveContent = async (req, res) => {
  try {
    const { contentId, approvedText } = req.body

    if (!contentId || !approvedText) {
      return res.status(400).json({ message: 'contentId and approvedText are required' })
    }

    const content = await Content.findByIdAndUpdate(
      contentId,
      { approved: approvedText, status: 'approved' },
      { new: true }
    )

    if (!content) {
      return res.status(404).json({ message: 'Content not found' })
    }

    return res.status(200).json({ message: 'Content approved', content })

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message })
  }
}
