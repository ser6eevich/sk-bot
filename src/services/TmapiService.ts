export interface TmapiProduct {
	id: string;
	title: string;
	description: string;
	price: {
		min: number;
		max: number;
	};
	mainImage: string;
	properties: any[];
}

export class TmapiService {
	constructor() {
		// Заглушка для TmapiService
	}

	async getProductInfo(url: string): Promise<TmapiProduct | null> {
		// Заглушка - возвращаем null
		return null;
	}
}
