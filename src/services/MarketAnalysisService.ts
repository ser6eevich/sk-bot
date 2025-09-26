import { OpenAI } from 'openai';
import { WildberriesService, ProductInfo } from './WildberriesService';
import { AlibabaService, AlibabaProduct } from './AlibabaService';
import dotenv from 'dotenv';

dotenv.config();

export interface MarketAnalysis {
	recommendedPrice: number;
	priceReasoning: string;
	competitionLevel: string;
	marketInsights: string;
	estimatedProfit: number;
	commission: number;
	logistics: number;
	averageMarketPrice?: number;
}

export interface MarketAnalysisWithCategory extends MarketAnalysis {
	category: string;
	similarProducts: string[];
}

export class MarketAnalysisService {
	private openai: OpenAI;
	private wbService: WildberriesService;
	private alibabaService: AlibabaService;
	private static readonly LOGISTICS_COST = 70; // Средняя стоимость логистики

	constructor() {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
		this.wbService = new WildberriesService();
		this.alibabaService = new AlibabaService();
	}

	public async analyze1688Product(
		productUrl: string,
		costPrice: number
	): Promise<MarketAnalysisWithCategory> {
		try {
			// Получаем информацию о товаре с 1688
			const alibabaProduct = await this.alibabaService.getProductInfo(
				productUrl
			);

			// Ищем похожие товары на WB
			const { queries, category } = await this.alibabaService.findSimilarOnWB(
				alibabaProduct
			);

			// Анализируем каждый найденный товар
			const similarProducts = [];
			let bestMatch: ProductInfo | null = null;
			let highestRating = -1;

			for (const query of queries) {
				try {
					const searchUrl = `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(
						query
					)}`;
					const productInfo = await this.wbService.getProductInfo(searchUrl);

					similarProducts.push(searchUrl);

					// Выбираем товар с лучшим рейтингом как основной для анализа
					if (productInfo.rating > highestRating) {
						highestRating = productInfo.rating;
						bestMatch = productInfo;
					}
				} catch (error) {
					console.error(`Error analyzing similar product: ${error}`);
					continue;
				}
			}

			if (!bestMatch) {
				throw new Error('Не удалось найти похожие товары на Wildberries');
			}

			// Анализируем лучший найденный товар
			const baseAnalysis = await this.analyzeProduct(
				`https://www.wildberries.ru/catalog/${bestMatch.id}/detail.aspx`,
				costPrice
			);

			return {
				...baseAnalysis,
				category,
				similarProducts,
			};
		} catch (error) {
			console.error('Error in 1688 market analysis:', error);
			throw new Error('Не удалось выполнить анализ рынка для товара с 1688');
		}
	}

	public async analyzeProduct(
		productUrl: string,
		costPrice: number
	): Promise<MarketAnalysis> {
		try {
			// Получаем информацию о товаре с WB
			const productInfo = await this.wbService.getProductInfo(productUrl);

			// Готовим данные для анализа
			const analysisPrompt = this.prepareAnalysisPrompt(productInfo, costPrice);

			// Получаем анализ от AI
			const analysis = await this.getAIAnalysis(analysisPrompt);

			return this.parseAIResponse(analysis, productInfo, costPrice);
		} catch (error) {
			console.error('Error in market analysis:', error);
			throw new Error('Не удалось выполнить анализ рынка');
		}
	}

	private prepareAnalysisPrompt(
		productInfo: ProductInfo,
		costPrice: number
	): string {
		return `Анализ товара на WB:

Товар: ${productInfo.name}
Цена: ${productInfo.currentPrice}₽, средняя: ${productInfo.averagePrice}₽
Рейтинг: ${productInfo.rating}, отзывы: ${productInfo.reviewsCount}
Продажи: ${productInfo.salesCount}, конкуренты: ${productInfo.competitorsCount}
Себестоимость: ${costPrice}₽

Рекомендации в JSON:
{
    "recommendedPrice": число,
    "priceReasoning": "объяснение",
    "competitionLevel": "уровень",
    "marketInsights": "анализ"
}`;
	}

	private async getAIAnalysis(prompt: string): Promise<string> {
		try {
			const response = await this.openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: `Ты эксперт по анализу рынка Wildberries. Проанализируй данные о товаре и предоставь рекомендации по ценообразованию.

ВАЖНО: Отвечай ТОЛЬКО на русском языке и возвращай ТОЛЬКО валидный JSON без дополнительного текста.

Формат ответа:
{
    "recommendedPrice": число_в_рублях,
    "priceReasoning": "подробное объяснение на русском языке",
    "competitionLevel": "Низкая/Средняя/Высокая",
    "marketInsights": "анализ рынка на русском языке"
}`,
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				max_tokens: 800,
				temperature: 0.3,
			});

			const content = response.choices[0]?.message?.content;
			if (!content) {
				throw new Error('ИИ не вернул ответ');
			}

			// Очищаем ответ от возможных префиксов
			let cleanContent = content.trim();
			if (cleanContent.startsWith('```json')) {
				cleanContent = cleanContent
					.replace(/^```json\s*/, '')
					.replace(/\s*```$/, '');
			}
			if (cleanContent.startsWith('```')) {
				cleanContent = cleanContent
					.replace(/^```\s*/, '')
					.replace(/\s*```$/, '');
			}

			return cleanContent;
		} catch (error) {
			console.error('Ошибка при получении анализа от ИИ:', error);
			// Fallback к детерминированному анализу
			return this.getFallbackAnalysis(prompt);
		}
	}

	private getFallbackAnalysis(prompt: string): string {
		// Парсим данные из промпта
		const lines = prompt.split('\n');
		const productName =
			lines
				.find(l => l.includes('Товар:'))
				?.split(':')[1]
				?.trim() || 'Товар';
		const currentPrice = parseFloat(
			lines
				.find(l => l.includes('Цена:'))
				?.split('₽')[0]
				?.split(' ')
				.pop() || '0'
		);
		const averagePrice = parseFloat(
			lines
				.find(l => l.includes('средняя:'))
				?.split('₽')[0]
				?.split(' ')
				.pop() || '0'
		);
		const rating = parseFloat(
			lines
				.find(l => l.includes('Рейтинг:'))
				?.split(',')[0]
				?.split(':')[1]
				?.trim() || '0'
		);
		const reviewsCount = parseInt(
			lines
				.find(l => l.includes('отзывы:'))
				?.split(':')[1]
				?.trim() || '0'
		);
		const salesCount = parseInt(
			lines
				.find(l => l.includes('Продажи:'))
				?.split(',')[0]
				?.split(':')[1]
				?.trim() || '0'
		);
		const competitorsCount = parseInt(
			lines
				.find(l => l.includes('конкуренты:'))
				?.split(':')[1]
				?.trim() || '0'
		);
		const costPrice = parseFloat(
			lines
				.find(l => l.includes('Себестоимость:'))
				?.split('₽')[0]
				?.split(' ')
				.pop() || '0'
		);

		// Рассчитываем рекомендуемую цену на основе реальных данных
		const marketPrice = averagePrice > 0 ? averagePrice : currentPrice;
		const minProfitMargin = 0.3; // Минимальная наценка 30%
		const commission = 0.15; // Комиссия WB 15%
		const logistics = MarketAnalysisService.LOGISTICS_COST;

		// Базовая цена: себестоимость + минимальная прибыль
		const basePrice = costPrice * (1 + minProfitMargin);

		// Учитываем рыночную цену
		const recommendedPrice = Math.max(
			basePrice,
			marketPrice * 0.8, // Не ниже 80% от средней рыночной цены
			costPrice * 2.5 // Минимум 2.5x от себестоимости
		);

		// Определяем уровень конкуренции
		let competitionLevel = 'Низкая';
		if (competitorsCount > 20) competitionLevel = 'Высокая';
		else if (competitorsCount > 10) competitionLevel = 'Средняя';

		// Рассчитываем прибыль
		const estimatedProfit =
			recommendedPrice * (1 - commission) - costPrice - logistics;

		// Формируем обоснование на русском
		const priceReasoning = `Цена рассчитана на основе себестоимости (${costPrice}₽), рыночной цены (${Math.round(
			marketPrice
		)}₽) и уровня конкуренции (${competitionLevel}). Учитывается комиссия WB (15%) и логистика (${logistics}₽).`;

		const marketInsights = `Анализ рынка: ${competitorsCount} конкурентов, средняя цена ${Math.round(
			marketPrice
		)}₽, рейтинг товара ${rating}/5 (${reviewsCount} отзывов). Продажи: ${salesCount} шт. Рекомендуемая цена обеспечивает конкурентоспособность и прибыльность.`;

		return JSON.stringify({
			recommendedPrice: Math.round(recommendedPrice),
			priceReasoning,
			competitionLevel,
			marketInsights,
		});
	}

	private parseAIResponse(
		response: string,
		productInfo: ProductInfo,
		costPrice: number
	): MarketAnalysis {
		try {
			const aiAnalysis = JSON.parse(response);
			const recommendedPrice = Number(aiAnalysis.recommendedPrice);

			// Расчет комиссии (примерно 15% от цены продажи)
			const commission = 0.15;

			// Расчет примерной прибыли
			const estimatedProfit =
				recommendedPrice * (1 - commission) -
				costPrice -
				MarketAnalysisService.LOGISTICS_COST;

			return {
				recommendedPrice,
				priceReasoning: aiAnalysis.priceReasoning,
				competitionLevel: aiAnalysis.competitionLevel,
				marketInsights: aiAnalysis.marketInsights,
				estimatedProfit,
				commission: commission * 100, // Переводим в проценты
				logistics: MarketAnalysisService.LOGISTICS_COST,
				averageMarketPrice: productInfo.averagePrice,
			};
		} catch (error) {
			console.error('Error parsing AI response:', error);
			throw new Error('Ошибка при обработке анализа рынка');
		}
	}
}
