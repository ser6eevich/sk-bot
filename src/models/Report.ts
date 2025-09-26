export interface Report {
	id: number;
	userId: number;
	title: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	processedData: string; // JSON string с обработанными данными
	summary?: string; // Краткое описание отчета
	createdAt: string;
	updatedAt: string;
}

export interface CreateReportData {
	userId: number;
	title: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	processedData: string;
	summary?: string;
}
