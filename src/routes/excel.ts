import { Router } from 'express';
import multer from 'multer';
import { ExcelController } from '../controllers/ExcelController';

const router = Router();
const controller = new ExcelController();

// Настройка multer для загрузки файлов
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-excel',
			'application/vnd.ms-excel.sheet.macroEnabled.12'
		];
		
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type. Please upload an Excel file (.xlsx, .xls)'));
		}
	}
});

router.post('/process', upload.single('report'), controller.processReport.bind(controller));
router.post('/columns', upload.single('report'), controller.getAvailableColumns.bind(controller));

export default router;


