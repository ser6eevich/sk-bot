import { Router } from 'express';
import { ExcelController } from '../controllers/ExcelController';

const router = Router();
const controller = new ExcelController();

router.post('/process', controller.processReport.bind(controller));
router.post('/columns', controller.getAvailableColumns.bind(controller));

export default router;


