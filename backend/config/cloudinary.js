import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de base
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Le format de sauvegarde dans le cloud
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'btp-market-portfolio', // Le dossier dans votre espace Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

export { cloudinary, storage };
