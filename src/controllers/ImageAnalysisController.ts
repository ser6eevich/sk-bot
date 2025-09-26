import { Request, Response } from 'express';
import { OpenAIAssistantService } from '../services/OpenAIAssistantService';
import { DatabaseService } from '../services/DatabaseService';

const assistantService = new OpenAIAssistantService();
const dbService = new DatabaseService();

export class ImageAnalysisController {
	static async analyzeImage(req: Request, res: Response) {
		try {
			if (!req.file) {
				return res.status(400).json({
					success: false,
					error: 'Изображение не найдено',
				});
			}

			const { telegramId, saveAnalysis } = req.body;

			console.log('[Controller] Начинаем анализ изображения...');

			const analysisResult = await assistantService.analyzeProductImage(
				req.file.buffer
			);

			console.log('[Controller] Анализ завершен:', analysisResult);

			// Сохраняем анализ в базу данных, если пользователь авторизован и запросил сохранение
			if (saveAnalysis === 'true' && telegramId) {
				try {
					// Получаем или создаем пользователя
					let user = await dbService.getUserByTelegramId(parseInt(telegramId));
					if (!user) {
						// Создаем пользователя с базовой информацией
						user = await dbService.createUser({
							telegramId: parseInt(telegramId),
						});
					}

					// Сохраняем анализ
					const savedAnalysis = await dbService.createAnalysis({
						userId: user.id,
						title: `Анализ: ${analysisResult.description}`,
						description: analysisResult.description,
						category: analysisResult.category,
						recommendedPrice: analysisResult.recommendedPrice,
						priceRange: analysisResult.priceRange,
						competition: analysisResult.competition,
						recommendations: analysisResult.recommendations,
						avgRating: analysisResult.avgRating,
					});

					console.log(
						'[Controller] Анализ сохранен в базу данных:',
						savedAnalysis.id
					);
				} catch (dbError) {
					console.error('[Controller] Ошибка при сохранении анализа:', dbError);
					// Не прерываем выполнение, просто логируем ошибку
				}
			}

			res.json({
				success: true,
				data: analysisResult,
			});
		} catch (error) {
			console.error('[Controller] Ошибка при анализе изображения:', error);
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : 'Неизвестная ошибка',
			});
		}
	}
}
