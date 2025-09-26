// Простая версия для тестирования Railway
import express from 'express';
import { DatabaseService } from './services/DatabaseService';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Инициализация базы данных
let db: DatabaseService;
try {
	db = new DatabaseService();
	console.log('✅ База данных инициализирована');
} catch (error) {
	console.error('❌ Ошибка инициализации БД:', error);
}

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
		port: port,
	});
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({
		message: 'SellKit Mini App API - Simple Version',
		status: 'running',
		timestamp: new Date().toISOString(),
	});
});

// Start server
app.listen(port, () => {
	console.log(`🚀 Simple server is running on port ${port}`);
	console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
