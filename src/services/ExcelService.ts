import xlsx from 'xlsx';

export interface ColumnConfig {
	keep: string[];
	sum: string[];
}

export class ExcelService {
	private static readonly DEFAULT_COLUMNS = [
		'Предмет',
		'Код номенклатуры',
		'Бренд',
		'Артикул поставщика',
		'Название',
		'Баркод',
		'Тип документа',
		'Обоснование для оплаты',
		'Дата заказа покупателем',
		'Дата продажи',
		'Кол-во',
		'Цена розничная',
		'Вайлдберриз реализовал Товар (Пр)',
		'Итоговая согласованная скидка, %',
		'Цена розничная с учетом согласованной скидки',
		'Скидка постоянного Покупателя (СПП), %',
		'К перечислению Продавцу за реализованный Товар',
		'Количество доставок',
		'Количество возврата',
		'Услуги по доставке товара покупателю',
	];

	private static readonly DEFAULT_SUM_COLUMNS = [
		'К перечислению Продавцу за реализованный Товар',
		'Услуги по доставке товара покупателю',
	];

	public async processReport(file: Buffer, config?: ColumnConfig) {
		const workbook = xlsx.read(file);
		const worksheet = workbook.Sheets[workbook.SheetNames[0]];
		const jsonData = xlsx.utils.sheet_to_json(worksheet) as Record<
			string,
			any
		>[];

		if (jsonData.length === 0) {
			throw new Error('Файл пуст или имеет неверный формат');
		}

		// Проверяем наличие всех необходимых столбцов
		const availableColumns = Object.keys(jsonData[0] || {});
		const missingColumns = ExcelService.DEFAULT_COLUMNS.filter(
			col => !availableColumns.includes(col)
		);

		if (missingColumns.length > 0) {
			throw new Error('Видимо вы прикрепили не Финансовый отчет');
		}

		const columnsToKeep = config?.keep || ExcelService.DEFAULT_COLUMNS;
		// В автоматическом режиме всегда включаем DEFAULT_SUM_COLUMNS
		const columnsToSum = config?.sum
			? [...new Set([...config.sum, ...ExcelService.DEFAULT_SUM_COLUMNS])]
			: ExcelService.DEFAULT_SUM_COLUMNS;

		// Filter columns
		const filteredData = jsonData.map(row => {
			const newRow: any = {};
			columnsToKeep.forEach(column => {
				if (column in row) {
					newRow[column] = row[column];
				}
			});
			return newRow;
		});

		// Calculate sums
		const sums: { [key: string]: number } = {};
		columnsToSum.forEach(column => {
			sums[column] = jsonData.reduce(
				(sum: number, row: Record<string, any>) => {
					return sum + (parseFloat(row[column]) || 0);
				},
				0
			);
		});

		// Create a new workbook
		const newWorkbook = xlsx.utils.book_new();

		// Create headers array with styles
		const headers = columnsToKeep.map(header => ({
			v: header,
			t: 's',
			s: {
				font: { sz: 12, bold: true, name: 'Arial' },
				alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
				border: {
					top: { style: 'thin', color: { rgb: '000000' } },
					bottom: { style: 'thin', color: { rgb: '000000' } },
					left: { style: 'thin', color: { rgb: '000000' } },
					right: { style: 'thin', color: { rgb: '000000' } },
				},
			},
		}));

		// Create worksheet with headers
		const newWorksheet = xlsx.utils.aoa_to_sheet([headers]);

		// Add data rows
		xlsx.utils.sheet_add_json(newWorksheet, filteredData, {
			origin: 'A2',
			skipHeader: true,
		});

		// Style all data cells
		const range = xlsx.utils.decode_range(newWorksheet['!ref'] || 'A1');

		// Apply borders and styles to all data cells
		for (let row = 1; row <= range.e.r; row++) {
			for (let col = 0; col <= range.e.c; col++) {
				const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
				if (!newWorksheet[cellRef]) {
					newWorksheet[cellRef] = { v: '', t: 's' };
				}
				newWorksheet[cellRef].s = {
					font: { name: 'Arial' },
					border: {
						top: { style: 'thin', color: { rgb: '000000' } },
						bottom: { style: 'thin', color: { rgb: '000000' } },
						left: { style: 'thin', color: { rgb: '000000' } },
						right: { style: 'thin', color: { rgb: '000000' } },
					},
				};
			}
		}

		// Auto-adjust column widths
		for (let col = range.s.c; col <= range.e.c; col++) {
			newWorksheet['!cols'] = newWorksheet['!cols'] || [];
			newWorksheet['!cols'][col] = { wch: 20 };
		}

		// Get the last row number and add a blank row
		const lastRow = range.e.r + 1;

		// Add total row with styling
		const totalStyle = {
			font: { bold: true },
			alignment: { horizontal: 'right' },
		};

		// Add sums under respective columns
		columnsToSum.forEach(sumColumn => {
			// Найдем индекс столбца в columnsToKeep
			const colIndex = columnsToKeep.indexOf(sumColumn);
			if (colIndex !== -1) {
				// Add sum value
				const totalLabelCell = xlsx.utils.encode_cell({
					r: lastRow + 1,
					c: colIndex,
				});

				// Обновляем диапазон таблицы, чтобы включить строку с суммами
				const newRange = `${
					newWorksheet['!ref']?.split(':')[0]
				}:${xlsx.utils.encode_cell({
					r: lastRow + 1,
					c: range.e.c,
				})}`;
				newWorksheet['!ref'] = newRange;

				// Добавляем значение суммы
				newWorksheet[totalLabelCell] = {
					v: `Итого: ${sums[sumColumn].toLocaleString('ru-RU')} ₽`,
					t: 's',
					s: {
						font: { sz: 12, bold: true, name: 'Arial' },
						alignment: { horizontal: 'right', vertical: 'center' },
						border: {
							top: { style: 'thin', color: { rgb: '000000' } },
							bottom: { style: 'thin', color: { rgb: '000000' } },
							left: { style: 'thin', color: { rgb: '000000' } },
							right: { style: 'thin', color: { rgb: '000000' } },
						},
					},
				};

				// Adjust column width for sum
				if (!newWorksheet['!cols']) {
					newWorksheet['!cols'] = [];
				}
				newWorksheet['!cols'][colIndex] = {
					wch: Math.max(20, sumColumn.length),
				};
			}
		});

		// Add worksheet to workbook
		xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Отчет');

		// Generate buffer with specific options
		const excelBuffer = xlsx.write(newWorkbook, {
			type: 'buffer',
			bookType: 'xlsx',
			cellStyles: true,
			compression: true,
		});

		return excelBuffer;
	}

	public getAllAvailableColumns(file: Buffer): string[] {
		const workbook = xlsx.read(file);
		const worksheet = workbook.Sheets[workbook.SheetNames[0]];
		const jsonData = xlsx.utils.sheet_to_json(worksheet) as Record<
			string,
			any
		>[];

		if (jsonData.length === 0) {
			return [];
		}

		return Object.keys(jsonData[0]);
	}

	public async getProcessedData(
		file: Buffer,
		config?: ColumnConfig
	): Promise<any[]> {
		const workbook = xlsx.read(file);
		const worksheet = workbook.Sheets[workbook.SheetNames[0]];
		const jsonData = xlsx.utils.sheet_to_json(worksheet) as Record<
			string,
			any
		>[];

		if (jsonData.length === 0) {
			return [];
		}

		// Используем конфигурацию или значения по умолчанию
		const columnsToKeep = config?.keep || ExcelService.DEFAULT_COLUMNS;
		const columnsToSum = config?.sum || ExcelService.DEFAULT_SUM_COLUMNS;

		// Фильтруем данные по выбранным столбцам
		const filteredData = jsonData.map(row => {
			const filteredRow: Record<string, any> = {};
			columnsToKeep.forEach(column => {
				if (row[column] !== undefined) {
					filteredRow[column] = row[column];
				}
			});
			return filteredRow;
		});

		return filteredData;
	}
}
