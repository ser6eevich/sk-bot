import { Router } from 'express';
import multer from 'multer';
import { ImageAnalysisController } from '../controllers/ImageAnalysisController';

const router = Router();

// Настройка multer для загрузки файлов
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Только изображения разрешены'));
		}
	},
});

// Маршрут для анализа изображения
router.post(
	'/analyze',
	upload.single('image'),
	ImageAnalysisController.analyzeImage
);

export default router;

