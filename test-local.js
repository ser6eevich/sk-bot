// Простой HTTP сервер для локального тестирования
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Простой API endpoint
app.get('/api/test', (req, res) => {
	res.json({
		message: 'SellKit API работает!',
		timestamp: new Date().toISOString(),
		environment: 'development',
	});
});

// Запуск сервера
app.listen(port, () => {
	console.log('🚀 Локальный сервер запущен!');
	console.log(`📱 Откройте: http://localhost:${port}`);
	console.log('⚠️  Для Telegram Mini App нужен HTTPS!');
	console.log('💡 Используйте ngrok или разверните на Railway');
});
