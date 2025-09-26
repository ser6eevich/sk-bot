import { Request, Response } from 'express';
import {
	ChinaCalculatorService,
	OrderCalculation,
} from '../services/ChinaCalculatorService';

export class ChinaCalculatorController {
	private calculatorService: ChinaCalculatorService;

	constructor() {
		this.calculatorService = new ChinaCalculatorService();
	}

	public async calculateOrder(req: Request, res: Response) {
		try {
			const orderData: OrderCalculation = req.body;

			// Проверяем наличие всех необходимых полей
			const missingFields = this.getMissingFields(orderData);
			if (missingFields.length > 0) {
				return res.status(400).json({
					error: `Пожалуйста, заполните следующие поля: ${missingFields.join(
						', '
					)}`,
				});
			}

			// Проверяем корректность значений
			if (!this.validateOrderData(orderData)) {
				return res.status(400).json({
					error:
						'Пожалуйста, проверьте введенные значения. Все числовые поля должны быть больше 0',
				});
			}

			const result = await this.calculatorService.calculateOrder(orderData);
			res.json(result);
		} catch (error) {
			console.error('Error calculating order:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Ошибка при расчете';
			res.status(400).json({ error: errorMessage });
		}
	}

	private getMissingFields(data: Partial<OrderCalculation>): string[] {
		const requiredFields = {
			priceYuan: 'Стоимость единицы товара',
			weightKg: 'Вес единицы товара (в граммах)',
			quantity: 'Количество единиц',
			shippingPricePerKg: 'Стоимость доставки за кг',
			wbCommissionPercent: 'Процент комиссии WB',
			logisticsCostRub: 'Логистика за единицу',
		};

		return Object.entries(requiredFields)
			.filter(([key]) => !data[key as keyof OrderCalculation])
			.map(([_, label]) => label);
	}

	private validateOrderData(data: OrderCalculation): boolean {
		return !!(
			data.priceYuan > 0 &&
			data.weightKg > 0 &&
			data.quantity > 0 &&
			data.shippingPricePerKg > 0 &&
			(data.wbCommissionPercent === undefined ||
				(data.wbCommissionPercent >= 0 && data.wbCommissionPercent <= 100)) &&
			(data.logisticsCostRub === undefined || data.logisticsCostRub >= 0)
		);
	}
}
