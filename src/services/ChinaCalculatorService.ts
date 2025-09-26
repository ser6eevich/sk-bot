// Убрали импорт MarketAnalysisService для упрощения

export interface OrderCalculation {
	priceYuan: number;
	weightKg: number;
	quantity: number;
	shippingPricePerKg: number;
	targetPrice?: number;
	wbCommissionPercent?: number;
	logisticsCostRub?: number;
}

export interface CalculationResult {
	totalPriceYuan: number;
	totalWeightKg: number;
	totalShippingCost: number;
	totalCostRub: number;
	pricePerUnit: number;
	shippingPerUnit: number;
	// Добавляем расчеты прибыли
	profitCalculation: {
		sellingPrice: number; // Цена продажи за единицу
		wbCommissionPercent: number; // Процент комиссии ВБ
		wbCommission: number; // Комиссия ВБ в рублях
		logisticsCost: number; // Логистика в рублях
		netProfitPerUnit: number; // Чистая прибыль за единицу
		totalNetProfit: number; // Общая чистая прибыль
	};
}

export interface MarketAnalysis {
	recommendedPrice: number;
	estimatedProfit: number;
	commission: number;
	logistics: number;
}

export class ChinaCalculatorService {
	private static readonly LOGISTICS_COST = 70; // Average logistics cost in RUB
	private static readonly YUAN_TO_USD = 0.14; // Example rate
	private static readonly USD_TO_RUB = 75; // Example rate
	// Убрали marketAnalysisService для упрощения

	constructor() {
		// Убрали инициализацию marketAnalysisService
	}

	// Функция для округления до одного знака после запятой
	private round(num: number): number {
		return Math.round(num * 10) / 10;
	}

	public async calculateOrder(
		data: OrderCalculation
	): Promise<CalculationResult> {
		const totalPriceYuan = this.round(data.priceYuan * data.quantity);
		// Конвертируем вес из грамм в килограммы
		const totalWeightKg = this.round((data.weightKg / 1000) * data.quantity);
		// Стоимость доставки уже в USD
		const shippingCostUsd = this.round(totalWeightKg * data.shippingPricePerKg);

		// Конвертируем цену товара в USD
		const priceInUsd = this.round(
			totalPriceYuan * ChinaCalculatorService.YUAN_TO_USD
		);

		// Общая стоимость в рублях
		const totalCostRub = this.round(
			(priceInUsd + shippingCostUsd) * ChinaCalculatorService.USD_TO_RUB
		);

		const costPerUnit = this.round(totalCostRub / data.quantity);
		const sellingPrice = data.targetPrice || costPerUnit * 2; // Если цена не указана, берем 2x от себестоимости

		// Используем переданные значения (обязательные поля)
		const wbCommissionRate = (data.wbCommissionPercent || 0) / 100; // Процент комиссии ВБ
		const logisticsCost = data.logisticsCostRub || 0; // Логистика в рублях

		const wbCommission = this.round(sellingPrice * wbCommissionRate);
		const netProfitPerUnit = this.round(
			sellingPrice - costPerUnit - wbCommission - logisticsCost
		);
		const totalNetProfit = this.round(netProfitPerUnit * data.quantity);

		const result: CalculationResult = {
			totalPriceYuan,
			totalWeightKg,
			totalShippingCost: shippingCostUsd, // В долларах
			totalCostRub,
			pricePerUnit: costPerUnit,
			shippingPerUnit: this.round(
				(shippingCostUsd * ChinaCalculatorService.USD_TO_RUB) / data.quantity
			),
			profitCalculation: {
				sellingPrice: this.round(sellingPrice),
				wbCommissionPercent: data.wbCommissionPercent || 0,
				wbCommission: wbCommission,
				logisticsCost: logisticsCost,
				netProfitPerUnit: netProfitPerUnit,
				totalNetProfit: totalNetProfit,
			},
		};

		return result;
	}

	// Убрали метод analyzeMarket - больше не используем ИИ для анализа
}
