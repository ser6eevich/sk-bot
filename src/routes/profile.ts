import express from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { CreateUserData } from '../models/User';
import { CreateAnalysisData } from '../models/Analysis';
import { CreateReportData } from '../models/Report';

const router = express.Router();
const dbService = new DatabaseService();

// Получить или создать пользователя
router.post('/user', async (req, res) => {
	try {
		const { telegramId, username, firstName, lastName, avatarUrl } = req.body;

		if (!telegramId) {
			return res.status(400).json({ error: 'Telegram ID обязателен' });
		}

		// Проверяем, существует ли пользователь
		let user = await dbService.getUserByTelegramId(telegramId);

		if (!user) {
			// Создаем нового пользователя
			const userData: CreateUserData = {
				telegramId,
				username,
				firstName,
				lastName,
				avatarUrl,
			};
			user = await dbService.createUser(userData);
		} else {
			// Обновляем существующего пользователя
			await dbService.updateUser(telegramId, {
				username,
				firstName,
				lastName,
				avatarUrl,
			});
			user = await dbService.getUserByTelegramId(telegramId);
		}

		res.json({ user });
	} catch (error) {
		console.error('Ошибка при работе с пользователем:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Получить статистику пользователя
router.get('/user/:telegramId/stats', async (req, res) => {
	try {
		const telegramId = parseInt(req.params.telegramId);

		const user = await dbService.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const stats = await dbService.getUserStats(user.id);
		res.json({ stats });
	} catch (error) {
		console.error('Ошибка при получении статистики:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Сохранить анализ
router.post('/analysis', async (req, res) => {
	try {
		const {
			telegramId,
			title,
			description,
			category,
			recommendedPrice,
			priceRange,
			competition,
			recommendations,
			avgRating,
			imageUrl,
		} = req.body;

		if (!telegramId) {
			return res.status(400).json({ error: 'Telegram ID обязателен' });
		}

		// Получаем пользователя
		const user = await dbService.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const analysisData: CreateAnalysisData = {
			userId: user.id,
			title: title || 'Анализ товара',
			description,
			category,
			recommendedPrice,
			priceRange,
			competition,
			recommendations,
			avgRating,
			imageUrl,
		};

		const analysis = await dbService.createAnalysis(analysisData);
		res.json({ analysis });
	} catch (error) {
		console.error('Ошибка при сохранении анализа:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Получить анализы пользователя
router.get('/user/:telegramId/analyses', async (req, res) => {
	try {
		const telegramId = parseInt(req.params.telegramId);
		const limit = parseInt(req.query.limit as string) || 10;
		const offset = parseInt(req.query.offset as string) || 0;

		const user = await dbService.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const analyses = await dbService.getAnalysesByUserId(
			user.id,
			limit,
			offset
		);
		res.json({ analyses });
	} catch (error) {
		console.error('Ошибка при получении анализов:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Получить конкретный анализ
router.get('/analysis/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const analysis = await dbService.getAnalysisById(id);

		if (!analysis) {
			return res.status(404).json({ error: 'Анализ не найден' });
		}

		res.json({ analysis });
	} catch (error) {
		console.error('Ошибка при получении анализа:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Сохранить отчет
router.post('/report', async (req, res) => {
	try {
		const {
			telegramId,
			title,
			fileName,
			filePath,
			fileSize,
			processedData,
			summary,
		} = req.body;

		if (!telegramId) {
			return res.status(400).json({ error: 'Telegram ID обязателен' });
		}

		// Получаем пользователя
		const user = await dbService.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const reportData: CreateReportData = {
			userId: user.id,
			title: title || fileName,
			fileName,
			filePath,
			fileSize,
			processedData,
			summary,
		};

		const report = await dbService.createReport(reportData);
		res.json({ report });
	} catch (error) {
		console.error('Ошибка при сохранении отчета:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Получить отчеты пользователя
router.get('/user/:telegramId/reports', async (req, res) => {
	try {
		const telegramId = parseInt(req.params.telegramId);
		const limit = parseInt(req.query.limit as string) || 10;
		const offset = parseInt(req.query.offset as string) || 0;

		const user = await dbService.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const reports = await dbService.getReportsByUserId(user.id, limit, offset);
		res.json({ reports });
	} catch (error) {
		console.error('Ошибка при получении отчетов:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Получить конкретный отчет
router.get('/report/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const report = await dbService.getReportById(id);

		if (!report) {
			return res.status(404).json({ error: 'Отчет не найден' });
		}

		res.json({ report });
	} catch (error) {
		console.error('Ошибка при получении отчета:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

export default router;
