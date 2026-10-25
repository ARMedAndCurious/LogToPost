import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'logtopost',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    console.log('Cloudinary error:', JSON.stringify(error))
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

