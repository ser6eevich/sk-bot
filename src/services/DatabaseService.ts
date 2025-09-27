import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { User, CreateUserData } from '../models/User';
import { Analysis, CreateAnalysisData } from '../models/Analysis';
import { Report, CreateReportData } from '../models/Report';

export class DatabaseService {
	private db: sqlite3.Database;

	constructor() {
		// Создаем папку data если её нет
		const dataDir = path.join(__dirname, '../../data');
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}
		
		const dbPath = path.join(dataDir, 'database.sqlite');
		this.db = new sqlite3.Database(dbPath);
		this.initializeDatabase();
	}

	private initializeDatabase(): void {
		try {
			// Создаем таблицу пользователей
			this.db.run(`
				CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					telegramId INTEGER UNIQUE NOT NULL,
					username TEXT,
					firstName TEXT,
					lastName TEXT,
					avatarUrl TEXT,
					createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
					updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
				)
			`);

		// Создаем таблицу анализов
		this.db.run(`
			CREATE TABLE IF NOT EXISTS analyses (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				userId INTEGER NOT NULL,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				category TEXT NOT NULL,
				recommendedPrice REAL NOT NULL,
				priceRangeMin REAL NOT NULL,
				priceRangeMax REAL NOT NULL,
				competition INTEGER NOT NULL,
				recommendations TEXT NOT NULL,
				avgRating REAL,
				imageUrl TEXT,
				createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES users (id)
			)
		`);

		// Создаем таблицу отчетов
		this.db.run(`
			CREATE TABLE IF NOT EXISTS reports (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				userId INTEGER NOT NULL,
				title TEXT NOT NULL,
				fileName TEXT NOT NULL,
				filePath TEXT NOT NULL,
				fileSize INTEGER NOT NULL,
				processedData TEXT NOT NULL,
				summary TEXT,
				createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES users (id)
			)
		`);

		console.log('База данных инициализирована');
		} catch (error) {
			console.error('Ошибка при инициализации базы данных:', error);
		}
	}

	// Методы для работы с пользователями
	async createUser(userData: CreateUserData): Promise<User> {
		return new Promise((resolve, reject) => {
			const sql = `
				INSERT INTO users (telegramId, username, firstName, lastName, avatarUrl)
				VALUES (?, ?, ?, ?, ?)
			`;
			this.db.run(
				sql,
				[
					userData.telegramId,
					userData.username,
					userData.firstName,
					userData.lastName,
					userData.avatarUrl,
				],
				function (err) {
					if (err) {
						reject(err);
					} else {
						resolve({
							id: this.lastID,
							telegramId: userData.telegramId,
							username: userData.username,
							firstName: userData.firstName,
							lastName: userData.lastName,
							avatarUrl: userData.avatarUrl,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						});
					}
				}
			);
		});
	}

	async getUserByTelegramId(telegramId: number): Promise<User | null> {
		return new Promise((resolve, reject) => {
			const sql = 'SELECT * FROM users WHERE telegramId = ?';
			this.db.get(sql, [telegramId], (err, row: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(row || null);
				}
			});
		});
	}

	async updateUser(
		telegramId: number,
		userData: Partial<CreateUserData>
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const fields = [];
			const values = [];

			if (userData.username !== undefined) {
				fields.push('username = ?');
				values.push(userData.username);
			}
			if (userData.firstName !== undefined) {
				fields.push('firstName = ?');
				values.push(userData.firstName);
			}
			if (userData.lastName !== undefined) {
				fields.push('lastName = ?');
				values.push(userData.lastName);
			}
			if (userData.avatarUrl !== undefined) {
				fields.push('avatarUrl = ?');
				values.push(userData.avatarUrl);
			}

			fields.push('updatedAt = CURRENT_TIMESTAMP');
			values.push(telegramId);

			const sql = `UPDATE users SET ${fields.join(', ')} WHERE telegramId = ?`;
			this.db.run(sql, values, err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	// Методы для работы с анализами
	async createAnalysis(analysisData: CreateAnalysisData): Promise<Analysis> {
		return new Promise((resolve, reject) => {
			const sql = `
				INSERT INTO analyses (userId, title, description, category, recommendedPrice, 
					priceRangeMin, priceRangeMax, competition, recommendations, avgRating, imageUrl)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`;
			this.db.run(
				sql,
				[
					analysisData.userId,
					analysisData.title,
					analysisData.description,
					analysisData.category,
					analysisData.recommendedPrice,
					analysisData.priceRange.min,
					analysisData.priceRange.max,
					analysisData.competition,
					analysisData.recommendations,
					analysisData.avgRating,
					analysisData.imageUrl,
				],
				function (err) {
					if (err) {
						reject(err);
					} else {
						resolve({
							id: this.lastID,
							userId: analysisData.userId,
							title: analysisData.title,
							description: analysisData.description,
							category: analysisData.category,
							recommendedPrice: analysisData.recommendedPrice,
							priceRange: analysisData.priceRange,
							competition: analysisData.competition,
							recommendations: analysisData.recommendations,
							avgRating: analysisData.avgRating,
							imageUrl: analysisData.imageUrl,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						});
					}
				}
			);
		});
	}

	async getAnalysesByUserId(
		userId: number,
		limit: number = 10,
		offset: number = 0
	): Promise<Analysis[]> {
		return new Promise((resolve, reject) => {
			const sql = `
				SELECT *, priceRangeMin as priceRangeMin, priceRangeMax as priceRangeMax
				FROM analyses 
				WHERE userId = ? 
				ORDER BY createdAt DESC 
				LIMIT ? OFFSET ?
			`;
			this.db.all(sql, [userId, limit, offset], (err, rows: any[]) => {
				if (err) {
					reject(err);
				} else {
					const analyses = rows.map(row => ({
						id: row.id,
						userId: row.userId,
						title: row.title,
						description: row.description,
						category: row.category,
						recommendedPrice: row.recommendedPrice,
						priceRange: {
							min: row.priceRangeMin,
							max: row.priceRangeMax,
						},
						competition: row.competition,
						recommendations: row.recommendations,
						avgRating: row.avgRating,
						imageUrl: row.imageUrl,
						createdAt: row.createdAt,
						updatedAt: row.updatedAt,
					}));
					resolve(analyses);
				}
			});
		});
	}

	async getAnalysisById(id: number): Promise<Analysis | null> {
		return new Promise((resolve, reject) => {
			const sql = `
				SELECT *, priceRangeMin as priceRangeMin, priceRangeMax as priceRangeMax
				FROM analyses WHERE id = ?
			`;
			this.db.get(sql, [id], (err, row: any) => {
				if (err) {
					reject(err);
				} else if (row) {
					resolve({
						id: row.id,
						userId: row.userId,
						title: row.title,
						description: row.description,
						category: row.category,
						recommendedPrice: row.recommendedPrice,
						priceRange: {
							min: row.priceRangeMin,
							max: row.priceRangeMax,
						},
						competition: row.competition,
						recommendations: row.recommendations,
						avgRating: row.avgRating,
						imageUrl: row.imageUrl,
						createdAt: row.createdAt,
						updatedAt: row.updatedAt,
					});
				} else {
					resolve(null);
				}
			});
		});
	}

	// Методы для работы с отчетами
	async createReport(reportData: CreateReportData): Promise<Report> {
		console.log('[DatabaseService] Creating report:', {
			userId: reportData.userId,
			title: reportData.title,
			fileName: reportData.fileName
		});
		
		return new Promise((resolve, reject) => {
			const sql = `
				INSERT INTO reports (userId, title, fileName, filePath, fileSize, processedData, summary)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`;
			this.db.run(
				sql,
				[
					reportData.userId,
					reportData.title,
					reportData.fileName,
					reportData.filePath,
					reportData.fileSize,
					reportData.processedData,
					reportData.summary,
				],
				function (err) {
					if (err) {
						console.error('[DatabaseService] Error creating report:', err);
						reject(err);
					} else {
						console.log('[DatabaseService] Report created successfully with ID:', this.lastID);
						resolve({
							id: this.lastID,
							userId: reportData.userId,
							title: reportData.title,
							fileName: reportData.fileName,
							filePath: reportData.filePath,
							fileSize: reportData.fileSize,
							processedData: reportData.processedData,
							summary: reportData.summary,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						});
					}
				}
			);
		});
	}

	async getReportsByUserId(
		userId: number,
		limit: number = 10,
		offset: number = 0
	): Promise<Report[]> {
		console.log('[DatabaseService] Getting reports for user:', userId);
		return new Promise((resolve, reject) => {
			const sql = `
				SELECT * FROM reports 
				WHERE userId = ? 
				ORDER BY createdAt DESC 
				LIMIT ? OFFSET ?
			`;
			this.db.all(sql, [userId, limit, offset], (err, rows: any[]) => {
				if (err) {
					console.error('[DatabaseService] Error getting reports:', err);
					reject(err);
				} else {
					console.log('[DatabaseService] Found reports:', rows.length);
					resolve(rows);
				}
			});
		});
	}

	async getReportById(id: number): Promise<Report | null> {
		return new Promise((resolve, reject) => {
			const sql = 'SELECT * FROM reports WHERE id = ?';
			this.db.get(sql, [id], (err, row: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(row || null);
				}
			});
		});
	}

	// Методы для получения статистики
	async getUserStats(
		userId: number
	): Promise<{ analysesCount: number; reportsCount: number }> {
		return new Promise((resolve, reject) => {
			const sql = `
				SELECT 
					(SELECT COUNT(*) FROM analyses WHERE userId = ?) as analysesCount,
					(SELECT COUNT(*) FROM reports WHERE userId = ?) as reportsCount
			`;
			this.db.get(sql, [userId, userId], (err, row: any) => {
				if (err) {
					reject(err);
				} else {
					resolve({
						analysesCount: row.analysesCount || 0,
						reportsCount: row.reportsCount || 0,
					});
				}
			});
		});
	}

	close(): void {
		this.db.close();
	}
}
