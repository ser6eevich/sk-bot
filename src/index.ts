// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import { Bot } from 'grammy';
import express from 'express';
import path from 'path';
import https from 'https';
import fs from 'fs';
import excelRoutes from './routes/excel';
import calculatorRoutes from './routes/calculator';
import imageAnalysisRoutes from './routes/imageAnalysis';
import profileRoutes from './routes/profile';
import telegramRoutes from './routes/telegram';

// Initialize bot (только если есть токен)
let bot: Bot | null = null;
if (process.env.BOT_TOKEN) {
	bot = new Bot(process.env.BOT_TOKEN);
	console.log('✅ Telegram бот инициализирован');
	console.log('Bot token length:', process.env.BOT_TOKEN.length);
} else {
	console.log('⚠️ BOT_TOKEN не найден, бот не запущен');
	console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('BOT')));
}

// Initialize express app for web interface
const app = express();
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;
const baseUrl = process.env.BASE_URL || 'https://localhost:3443';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// CORS для Telegram WebApp
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ 
		status: 'ok', 
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
		port: process.env.PORT || 3000
	});
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({ 
		message: 'SellKit Mini App API',
		status: 'running',
		timestamp: new Date().toISOString()
	});
});

// Routes
app.use('/api/excel', excelRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/image-analysis', imageAnalysisRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/telegram', telegramRoutes);

// Error handling middleware
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error('Global error handler:', err);
		res.status(err.status || 500).json({
			error: err.message || 'Произошла внутренняя ошибка сервера',
		});
	}
);

// Error handler
if (bot) {
	bot.catch(err => {
		console.error('Error in bot:', err);
	});

	// Bot command handlers
	bot.command('start', async ctx => {
	await ctx.reply('Добро пожаловать в SellKit - помощник для селлеров на WB!', {
		reply_markup: {
			keyboard: [
				[
					{
						text: 'Финансовый отчет',
						web_app: { url: `${baseUrl}/financial-report.html` },
					},
				],
				[
					{
						text: 'Калькулятор заказа из Китая',
						web_app: { url: `${baseUrl}/china-calculator.html` },
					},
				],
			],
			resize_keyboard: true,
		},
	});
	});

	// Message handlers
	bot.on('message:text', async ctx => {
	const text = ctx.message.text;

	switch (text) {
		case 'Финансовый отчет':
			await ctx.reply(
				'Для работы с финансовым отчетом, пожалуйста, загрузите Excel файл.'
			);
			break;
		case 'Калькулятор заказа из Китая':
			await ctx.reply(
				'Для расчета стоимости заказа, пожалуйста, укажите следующие данные:\n\n' +
					'1. Ссылка на товар 1688\n' +
					'2. Стоимость единицы товара в юанях\n' +
					'3. Вес единицы товара в кг\n' +
					'4. Количество единиц\n' +
					'5. Стоимость доставки за кг'
			);
			break;
		default:
			await ctx.reply(
				'Пожалуйста, используйте кнопки меню для работы с ботом.'
			);
	}
	});
}

// Start bot (только если инициализирован)
if (bot) {
	bot.start();
}

// Функция для запуска HTTPS сервера
function startHttpsServer() {
	try {
		const privateKey = fs.readFileSync(
			path.join(__dirname, '../ssl/private-key.pem'),
			'utf8'
		);
		const certificate = fs.readFileSync(
			path.join(__dirname, '../ssl/certificate.pem'),
			'utf8'
		);

		const credentials = { key: privateKey, cert: certificate };
		const httpsServer = https.createServer(credentials, app);

		httpsServer.listen(httpsPort, () => {
			console.log(
				`🔐 HTTPS Server is running on https://localhost:${httpsPort}`
			);
			console.log(`🌐 Mini App URL: ${baseUrl}`);
		});

		return httpsServer;
	} catch (error) {
		console.error(
			'❌ Ошибка при запуске HTTPS сервера:',
			error instanceof Error ? error.message : String(error)
		);
		console.log('💡 Создайте SSL сертификаты: node ssl/generate-certs.js');
		return null;
	}
}

// На Railway используем только HTTP сервер
if (process.env.NODE_ENV === 'production') {
	// В продакшене Railway автоматически обеспечивает HTTPS
	app.listen(port, () => {
		console.log(`🚀 Server is running on port ${port}`);
		console.log(`🌐 Mini App URL: ${baseUrl}`);
	});
} else {
	// В разработке пытаемся запустить HTTPS
	const httpsServer = startHttpsServer();
	if (!httpsServer) {
		app.listen(port, () => {
			console.log(`⚠️  HTTP Server is running on http://localhost:${port}`);
			console.log(
				'💡 Для Mini App нужен HTTPS! Создайте сертификаты: node ssl/generate-certs.js'
			);
		});
	}
}
