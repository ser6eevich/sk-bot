import { Router } from 'express';
import { ChinaCalculatorController } from '../controllers/ChinaCalculatorController';

const router = Router();
const controller = new ChinaCalculatorController();

router.post('/calculate', controller.calculateOrder.bind(controller));

export default router;
