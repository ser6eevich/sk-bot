import OpenAI from 'openai';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export interface AnalysisResult {
	description: string;
	category: string;
	recommendedPrice: number;
	priceRange: { min: number; max: number };
	competition: number;
	recommendations: string;
	avgRating?: number;
}

export class OpenAIAssistantService {
	private openai: OpenAI | null = null;
	private assistantId: string;

	constructor() {
		this.assistantId = process.env.OPENAI_ASSISTANT_ID || '';
		console.log('OpenAIAssistantService инициализирован:', {
			assistantId: this.assistantId,
			hasApiKey: !!process.env.OPENAI_API_KEY,
		});
	}

	private getOpenAI(): OpenAI {
		if (!this.openai) {
			if (!process.env.OPENAI_API_KEY) {
				throw new Error('OPENAI_API_KEY не найден в переменных окружения');
			}
			this.openai = new OpenAI({
				apiKey: process.env.OPENAI_API_KEY,
			});
		}
		return this.openai;
	}

	async analyzeProductImage(imageBuffer: Buffer): Promise<AnalysisResult> {
		const openai = this.getOpenAI();

		// Проверяем ID ассистента
		if (!this.assistantId?.startsWith('asst_')) {
			throw new Error(`Некорректный OPENAI_ASSISTANT_ID: ${this.assistantId}`);
		}

		try {
			console.log('[OA] Загружаем файл...');
			// Создаем временный файл для загрузки
			const tempDir = path.join(__dirname, '../../temp');
			if (!fs.existsSync(tempDir)) {
				fs.mkdirSync(tempDir, { recursive: true });
			}
			const tempFilePath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);
			fs.writeFileSync(tempFilePath, imageBuffer);
			
			const file = await openai.files.create({
				file: fs.createReadStream(tempFilePath),
				purpose: 'assistants',
			});
			
			// Удаляем временный файл
			fs.unlinkSync(tempFilePath);
			console.log('[OA] Файл загружен:', file.id);

			console.log('[OA] Создаем thread...');
			const thread = await openai.beta.threads.create();
			console.log('[OA] Thread создан:', thread.id);

			console.log('[OA] Отправляем изображение ассистенту...');
			await openai.beta.threads.messages.create(thread.id, {
				role: 'user',
				content: [
					{
						type: 'text',
						text: 'Проанализируй товар на фото.',
					},
					{
						type: 'image_file',
						image_file: { file_id: file.id },
					},
				],
			});

			console.log('[OA] Запускаем ассистента...');
			const run = await openai.beta.threads.runs.create(thread.id, {
				assistant_id: this.assistantId,
			});
			console.log('[OA] Run создан:', run.id, 'статус:', run.status);

			// Ждем завершения с правильными параметрами
			let currentRun = run;
			while (true) {
				console.log(
					'[OA] Проверяем статус run:',
					currentRun.id,
					'статус:',
					currentRun.status
				);

				if (
					['completed', 'failed', 'cancelled', 'expired'].includes(
						currentRun.status
					)
				) {
					break;
				}

				await new Promise(r => setTimeout(r, 1000));

				// Получаем обновленный статус run - используем простой подход
				try {
					currentRun = await openai.beta.threads.runs.retrieve(currentRun.id, {
						thread_id: thread.id,
					});
				} catch (error) {
					console.error('[OA] Ошибка при получении статуса run:', error);
					throw error;
				}
			}

			if (currentRun.status !== 'completed') {
				throw new Error(`Ассистент не завершил анализ: ${currentRun.status}`);
			}

			console.log('[OA] Получаем ответ ассистента...');
			const messages = await openai.beta.threads.messages.list(thread.id, {
				order: 'desc',
				limit: 1,
			});

			const message = messages.data[0];
			if (!message) {
				throw new Error('Пустой ответ от ассистента');
			}

			// Извлекаем текст из ответа
			const responseText =
				message.content
					?.filter((c: any) => c.type === 'text' || c.type === 'output_text')
					?.map((c: any) => c.text?.value || c.text)
					?.join('\n')
					?.trim() || '';

			console.log('[OA] Ответ ассистента:', responseText);

			// Отправляем ответ ассистента в GPT для обработки
			return await this.processAssistantResponse(responseText);
		} catch (error) {
			console.error('[OA] Ошибка при работе с ассистентом:', error);
			throw error;
		}
	}

	private async processAssistantResponse(
		assistantResponse: string
	): Promise<AnalysisResult> {
		const openai = this.getOpenAI();

		try {
			console.log('[OA] Обрабатываем ответ ассистента через GPT...');

			const response = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{
						role: 'system',
						content: `Ты анализируешь ответ ассистента о товаре и формируешь структурированный анализ для продавца. 
					Верни результат в JSON формате:
					{
						"description": "краткое описание товара",
						"category": "категория товара",
						"recommendedPrice": число_в_рублях,
						"priceRange": {"min": минимальная_цена, "max": максимальная_цена},
						"competition": число_от_1_до_10,
						"recommendations": "рекомендации по продаже",
						"avgRating": число_от_1_до_5_средний_рейтинг
					}`,
					},
					{
						role: 'user',
						content: `Ответ ассистента о товаре: ${assistantResponse}`,
					},
				],
				max_tokens: 1000,
				temperature: 0.3,
			});

			const content = response.choices[0]?.message?.content;
			if (!content) {
				throw new Error('Пустой ответ от GPT');
			}

			console.log('[OA] Ответ GPT:', content);

			// Очищаем ответ от markdown блоков кода
			let cleanContent = content;
			if (cleanContent.includes('```json')) {
				cleanContent = cleanContent
					.replace(/```json\s*/, '')
					.replace(/```\s*$/, '');
			}
			if (cleanContent.includes('```')) {
				cleanContent = cleanContent
					.replace(/```\s*/, '')
					.replace(/```\s*$/, '');
			}

			console.log('[OA] Очищенный контент:', cleanContent);

			// Парсим JSON ответ
			const parsed = JSON.parse(cleanContent);

			return {
				description: parsed.description || 'Описание не найдено',
				category: parsed.category || 'Категория не определена',
				recommendedPrice: parsed.recommendedPrice || 0,
				priceRange: parsed.priceRange || { min: 0, max: 0 },
				competition: parsed.competition || 5,
				recommendations: parsed.recommendations || 'Рекомендации не найдены',
				avgRating: parsed.avgRating || 4.6,
			};
		} catch (error) {
			console.error('[OA] Ошибка при обработке ответа GPT:', error);
			// Возвращаем дефолтные значения при ошибке
			return {
				description: 'Не удалось проанализировать изображение',
				category: 'Неизвестная категория',
				recommendedPrice: 0,
				priceRange: { min: 0, max: 0 },
				competition: 5,
				recommendations: 'Анализ недоступен',
				avgRating: 4.6,
			};
		}
	}
}
