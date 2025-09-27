import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { ExcelService, ColumnConfig } from '../services/ExcelService';
import { DatabaseService } from '../services/DatabaseService';
import path from 'path';
import fs from 'fs';
import { Bot } from 'grammy';

export class ExcelController {
	private excelService: ExcelService;
	private dbService: DatabaseService;
	private bot: Bot | null;

	constructor(bot: Bot | null) {
		this.excelService = new ExcelService();
		this.dbService = new DatabaseService();
		this.bot = bot;
	}

	public async processReport(req: Request, res: Response) {
		try {
			// Проверка наличия файла
			if (!req.file) {
				return res.status(400).json({ error: 'Пожалуйста, прикрепите файл' });
			}

			const file = req.file;

			// Логирование для отладки
			console.log('Processing file:', {
				originalname: file.originalname,
				size: file.size,
				mimetype: file.mimetype,
			});

			// Парсинг конфигурации
			let config: ColumnConfig | undefined = undefined;
			if (req.body && req.body.config) {
				try {
					config = JSON.parse(req.body.config);
				} catch (e) {
					console.error('Error parsing config:', e);
				}
			}

			const excelBuffer = await this.excelService.processReport(
				file.buffer,
				config
			);
			console.log('Processing completed successfully');

			// Сохраняем отчет в базу данных, если пользователь авторизован
			const { telegramId: userId, saveReport } = req.body;
			console.log('Save report check:', { saveReport, userId, hasUserId: !!userId });
			let savedReport = null;
			
			// Всегда сохраняем отчет, если есть telegramId
			if (userId) {
				try {
					// Получаем или создаем пользователя
					let user = await this.dbService.getUserByTelegramId(
						parseInt(userId)
					);
					if (!user) {
						user = await this.dbService.createUser({
							telegramId: parseInt(userId),
						});
					}

					// Сохраняем обработанный файл
					const fileName = `processed_${Date.now()}_${file.originalname}`;
					const filePath = path.join(__dirname, '../../data/reports', fileName);

					// Создаем папку для отчетов, если её нет
					const reportsDir = path.dirname(filePath);
					if (!fs.existsSync(reportsDir)) {
						fs.mkdirSync(reportsDir, { recursive: true });
					}

					fs.writeFileSync(filePath, excelBuffer);

					// Получаем обработанные данные для сохранения в JSON
					const processedData = await this.excelService.getProcessedData(
						file.buffer,
						config
					);

					// Сохраняем отчет в базу данных
					savedReport = await this.dbService.createReport({
						userId: user.id,
						title: `Отчет: ${file.originalname}`,
						fileName: fileName,
						filePath: filePath,
						fileSize: excelBuffer.length,
						processedData: JSON.stringify(processedData),
						summary: `Обработанный отчет из файла ${file.originalname}`,
					});

					console.log('[Controller] Отчет сохранен в базу данных:', {
						reportId: savedReport.id,
						userId: user.id,
						fileName: fileName
					});
				} catch (dbError) {
					console.error('[Controller] Ошибка при сохранении отчета:', dbError);
					// Не прерываем выполнение, просто логируем ошибку
				}
			}

			// Set headers for file download
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
			res.setHeader(
				'Content-Disposition',
				'attachment; filename=processed_report.xlsx'
			);
			res.setHeader('Content-Length', excelBuffer.length);

			// Отправляем файл через бота, если он доступен
			const { telegramId, sendToBot } = req.body;
			console.log('Bot sending check:', { sendToBot, telegramId, hasBot: !!this.bot });
			
			if (sendToBot === 'true' && telegramId && this.bot) {
				try {
					// Используем сохраненный файл, если он есть, иначе создаем временный
					let fileToSend: string;
					
					if (savedReport && savedReport.filePath && fs.existsSync(savedReport.filePath)) {
						fileToSend = savedReport.filePath;
						console.log('Using saved file:', fileToSend);
					} else {
						// Создаем временный файл
						const tempFileName = `temp_report_${Date.now()}.xlsx`;
						const tempFilePath = path.join(__dirname, '../../temp', tempFileName);
						
						// Создаем папку temp если её нет
						const tempDir = path.dirname(tempFilePath);
						if (!fs.existsSync(tempDir)) {
							fs.mkdirSync(tempDir, { recursive: true });
						}
						
						// Сохраняем файл
						fs.writeFileSync(tempFilePath, excelBuffer);
						fileToSend = tempFilePath;
						console.log('Using temp file:', fileToSend);
					}
					
					console.log('Sending document to Telegram user:', telegramId);
					
					// Отправляем файл через бота
					await this.bot.api.sendDocument(parseInt(telegramId), fileToSend, {
						caption: '📊 Ваш обработанный финансовый отчет готов!'
					});
					
					// Удаляем временный файл только если он был создан
					if (!savedReport || !savedReport.filePath) {
						fs.unlinkSync(fileToSend);
					}
					
					console.log('✅ Файл отправлен через бота пользователю', telegramId);
					
					// Отправляем подтверждение в веб-интерфейс
					res.json({ 
						success: true, 
						message: 'Файл отправлен в Telegram!',
						sentViaBot: true 
					});
					return;
				} catch (botError) {
					console.error('Ошибка отправки через бота:', botError);
					// Если не удалось отправить через бота, отправляем файл обычным способом
				}
			} else {
				console.log('Bot sending conditions not met:', { 
					sendToBot, 
					telegramId, 
					hasBot: !!this.bot 
				});
			}

			// Send file (обычная отправка)
			res.send(excelBuffer);
		} catch (error) {
			console.error('Error processing report:', error);

			// Отправляем понятное сообщение об ошибке пользователю
			const errorMessage =
				error instanceof Error ? error.message : 'Неизвестная ошибка';
			res.status(400).json({
				error: errorMessage,
			});
		}
	}

	public async getAvailableColumns(req: Request, res: Response) {
		try {
			if (!req.file) {
				return res.status(400).json({ error: 'No file uploaded' });
			}

			const file = req.file;

			const columns = this.excelService.getAllAvailableColumns(file.buffer);
			res.json({ columns });
		} catch (error) {
			console.error('Error getting columns:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to get columns';
			res.status(500).json({ error: errorMessage });
		}
	}
}
