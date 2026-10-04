import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'logtopost',  
                resource_type: 'auto'  
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

