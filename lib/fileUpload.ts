import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResponse {
  filePath: string;
  publicId: string;
}

export async function uploadFile(file: File, customName?: string): Promise<UploadResponse> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const options: any = {
      resource_type: 'auto',
      folder: 'bnb-id-proofs',
    };

    if (customName) {
      // Clean name: replace spaces with underscores and remove special chars
      const cleanName = customName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      options.public_id = cleanName;
    }

    cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
          return;
        }
        resolve({
          filePath: result!.secure_url,
          publicId: result!.public_id,
        });
      }
    ).end(buffer);
  });
}

export async function deleteFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
}
