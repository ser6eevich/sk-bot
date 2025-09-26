import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { ExcelService, ColumnConfig } from '../services/ExcelService';
import { DatabaseService } from '../services/DatabaseService';
import path from 'path';
import fs from 'fs';

export class ExcelController {
	private excelService: ExcelService;
	private dbService: DatabaseService;

	constructor() {
		this.excelService = new ExcelService();
		this.dbService = new DatabaseService();
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
			const { telegramId, saveReport } = req.body;
			if (saveReport === 'true' && telegramId) {
				try {
					// Получаем или создаем пользователя
					let user = await this.dbService.getUserByTelegramId(
						parseInt(telegramId)
					);
					if (!user) {
						user = await this.dbService.createUser({
							telegramId: parseInt(telegramId),
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
					await this.dbService.createReport({
						userId: user.id,
						title: `Отчет: ${file.originalname}`,
						fileName: fileName,
						filePath: filePath,
						fileSize: excelBuffer.length,
						processedData: JSON.stringify(processedData),
						summary: `Обработанный отчет из файла ${file.originalname}`,
					});

					console.log('[Controller] Отчет сохранен в базу данных');
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

			// Send file
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
