import express from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { Bot } from 'grammy';
import fs from 'fs';

const router = express.Router();
const db = new DatabaseService();

// Функция для получения бота
function getBot(): Bot | null {
	if (process.env.BOT_TOKEN) {
		return new Bot(process.env.BOT_TOKEN);
	}
	return null;
}

// Функция для безопасного парсинга initData
function parseInitData(initData: string) {
	if (!initData) {
		throw new Error('Отсутствуют данные авторизации');
	}
	
	try {
		// Пробуем распарсить как JSON
		return JSON.parse(decodeURIComponent(initData));
	} catch (parseError) {
		// Если не JSON, пробуем извлечь user_id из строки параметров
		const urlParams = new URLSearchParams(initData);
		const userParam = urlParams.get('user');
		if (userParam) {
			return JSON.parse(userParam);
		} else {
			throw new Error('Не удалось извлечь данные пользователя');
		}
	}
}

// Middleware для проверки данных Telegram
function validateTelegramData(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const initData = req.headers['x-telegram-init-data'] as string;

	if (!initData) {
		return res
			.status(401)
			.json({ error: 'Отсутствуют данные авторизации Telegram' });
	}

	// В реальном приложении здесь должна быть проверка подписи
	// Для разработки пропускаем проверку
	next();
}

// Получить данные пользователя
router.get('/user', validateTelegramData, async (req, res) => {
	try {
		const initData = req.headers['x-telegram-init-data'] as string;
		const userData = parseInitData(initData);

		if (!userData.user) {
			return res.status(400).json({ error: 'Данные пользователя не найдены' });
		}

		const telegramId = userData.user.id;

		// Ищем пользователя в базе данных
		let user = await db.getUserByTelegramId(telegramId);

		if (!user) {
			// Создаем нового пользователя
			user = await db.createUser({
				telegramId: telegramId,
				username: userData.user.username,
				firstName: userData.user.first_name,
				lastName: userData.user.last_name,
				avatarUrl: userData.user.photo_url,
			});
		} else {
			// Обновляем данные существующего пользователя
			await db.updateUser(telegramId, {
				username: userData.user.username,
				firstName: userData.user.first_name,
				lastName: userData.user.last_name,
				avatarUrl: userData.user.photo_url,
			});
		}

		res.json({
			success: true,
			user: user,
		});
	} catch (error) {
		console.error('Ошибка при получении данных пользователя:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Отправить данные на сервер
router.post('/data', validateTelegramData, async (req, res) => {
	try {
		const initData = req.headers['x-telegram-init-data'] as string;
		const userData = parseInitData(initData);
		const telegramId = userData.user.id;

		// Получаем пользователя
		const user = await db.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		// Обрабатываем данные в зависимости от типа
		const { type, data } = req.body;

		switch (type) {
			case 'analysis':
				const analysis = await db.createAnalysis({
					userId: user.id,
					...data,
				});
				res.json({ success: true, analysis });
				break;

			case 'report':
				const report = await db.createReport({
					userId: user.id,
					...data,
				});
				res.json({ success: true, report });
				break;

			default:
				res.status(400).json({ error: 'Неизвестный тип данных' });
		}
	} catch (error) {
		console.error('Ошибка при обработке данных:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Получить статистику пользователя
router.get('/stats', validateTelegramData, async (req, res) => {
	try {
		const initData = req.headers['x-telegram-init-data'] as string;
		const userData = parseInitData(initData);
		const telegramId = userData.user.id;

		const user = await db.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const stats = await db.getUserStats(user.id);
		res.json({ success: true, stats });
	} catch (error) {
		console.error('Ошибка при получении статистики:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

// Отправить отчет в Telegram
router.post('/send-report/:reportId', validateTelegramData, async (req, res) => {
	try {
		const initData = req.headers['x-telegram-init-data'] as string;
		const userData = parseInitData(initData);
		const telegramId = userData.user.id;
		const reportId = parseInt(req.params.reportId);

		// Получаем пользователя
		const user = await db.getUserByTelegramId(telegramId);
		if (!user) {
			return res.status(404).json({ error: 'Пользователь не найден' });
		}

		// Получаем отчет
		const report = await db.getReportById(reportId);
		if (!report || report.userId !== user.id) {
			return res.status(404).json({ error: 'Отчет не найден' });
		}

		// Проверяем, что файл существует
		if (!report.filePath || !fs.existsSync(report.filePath)) {
			return res.status(404).json({ error: 'Файл отчета не найден' });
		}

		// Отправляем файл через бота
		const bot = getBot();
		if (!bot) {
			return res.status(500).json({ error: 'Бот не инициализирован' });
		}

		try {
			await bot.api.sendDocument(telegramId, report.filePath, {
				caption: '📊 Ваш сохраненный финансовый отчет'
			});
			
			res.json({ success: true, message: 'Отчет отправлен в Telegram' });
		} catch (botError) {
			console.error('Ошибка отправки через бота:', botError);
			res.status(500).json({ error: 'Ошибка отправки через бота' });
		}
	} catch (error) {
		console.error('Ошибка отправки отчета:', error);
		res.status(500).json({ error: 'Внутренняя ошибка сервера' });
	}
});

export default router;
