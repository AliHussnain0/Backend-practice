import { v2 as cloudinary } from 'cloudinary';
import exp from 'constants';
import { unlinkSync } from 'fs';
import ApiError from './ApiError.js';
  cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET 
    });
const cloudinary_p=async function(localPath) {
    // Configuration 
    // Upload an image
    try {
        const uploadResult = await cloudinary.uploader
            .upload(
                localPath, {
                resource_type: 'auto',
            }
        )
        console.log(uploadResult);
        unlinkSync(localPath)
        return uploadResult
    }
    catch (error) {
             unlinkSync(localPath);
        console.log(error);
        throw new ApiError(400, "some api issue at cloudinary configuration.");
       };

}


const cloudinary_ret =async function(user_id){
 try {
       const user = await cloudinary.uploader.destroy(user_id, (error, result) => {
        if (error) {
          console.error('Error fetching resource:', error);
        } else {
          console.log("Deleted", result);
        }
      }
     )
     if (!user) {
         throw new ApiError(400,"No file(video, picture) exist in database")
     }
     return user
 
 } catch (error) {
    throw new ApiError(400,"no file found")
 }

}

export {
    cloudinary_p,
    cloudinary_ret,
}