import axios from 'axios';

export interface ProductInfo {
	id: string;
	name: string;
	brand: string;
	category: string;
	currentPrice: number;
	averagePrice: number;
	rating: number;
	reviewsCount: number;
	salesCount: number;
	competitorsCount: number;
	url?: string;
	image?: string;
}

export interface CompetitorInfo {
	id: string;
	name: string;
	brand: string;
	price: number;
	rating: number;
	reviewsCount: number;
	salesCount: number;
	url: string;
	image: string;
	position: number;
}

export class WildberriesService {
	private readonly baseUrl = 'https://card.wb.ru/cards/v1/detail';

	public async getProductInfo(url: string): Promise<ProductInfo> {
		try {
			const productId = this.extractProductId(url);
			const response = await axios.get(`${this.baseUrl}?nm=${productId}`);
			const product = response.data.data.products[0];

			const competitorsResponse = await axios.get(
				`https://catalog.wb.ru/catalog/${product.subjectId}/v1/catalog?kind=${product.subjectId}&curr=rub&locale=ru`
			);

			return {
				id: productId,
				name: product.name,
				brand: product.brand,
				category: product.subjectName,
				currentPrice: product.salePriceU / 100,
				averagePrice: this.calculateAveragePrice(
					competitorsResponse.data.data.products
				),
				rating: product.rating || 0,
				reviewsCount: product.feedbacks,
				salesCount: product.sale || 0,
				competitorsCount: competitorsResponse.data.data.products.length,
			};
		} catch (error) {
			console.error('Error fetching product info from WB:', error);
			throw new Error(
				'Не удалось получить информацию о товаре. Проверьте ссылку.'
			);
		}
	}

	private extractProductId(url: string): string {
		try {
			// Поддержка разных форматов ссылок WB
			const patterns = [
				/\/catalog\/(\d+)\/detail/,
				/\/product\/([^/]+)\/(\d+)/,
				/card\/(\d+)/,
			];

			for (const pattern of patterns) {
				const match = url.match(pattern);
				if (match) {
					return match[1];
				}
			}
			throw new Error('Invalid WB product URL');
		} catch (error) {
			throw new Error('Неверный формат ссылки на товар WB');
		}
	}

	private calculateAveragePrice(products: any[]): number {
		if (!products.length) return 0;
		const prices = products.map(p => p.salePriceU / 100);
		return prices.reduce((a, b) => a + b, 0) / prices.length;
	}

	public async findCompetitors(
		searchQueries: string[],
		category: string,
		limit: number = 10
	): Promise<CompetitorInfo[]> {
		try {
			const allCompetitors: CompetitorInfo[] = [];

			// Ищем по каждому запросу
			for (const query of searchQueries.slice(0, 2)) {
				// Берем только первые 2 запроса
				try {
					const competitors = await this.searchProducts(query, limit);
					allCompetitors.push(...competitors);
				} catch (error) {
					console.error(`Error searching for query "${query}":`, error);
				}
			}

			// Убираем дубликаты и сортируем по рейтингу и количеству отзывов
			const uniqueCompetitors = this.removeDuplicates(allCompetitors);
			const sortedCompetitors = uniqueCompetitors
				.sort((a, b) => {
					// Сначала по рейтингу, потом по количеству отзывов
					if (b.rating !== a.rating) {
						return b.rating - a.rating;
					}
					return b.reviewsCount - a.reviewsCount;
				})
				.slice(0, limit);

			return sortedCompetitors;
		} catch (error) {
			console.error('Error finding competitors:', error);
			return [];
		}
	}

	private async searchProducts(
		query: string,
		limit: number
	): Promise<CompetitorInfo[]> {
		try {
			// Используем API поиска Wildberries
			const searchUrl = `https://search.wb.ru/exactmatch/ru/common/v4/search`;
			const params = {
				appType: 1,
				curr: 'rub',
				dest: -1257786,
				query: query,
				resultset: 'catalog',
				sort: 'popular',
				spp: 27,
				limit: limit,
			};

			const response = await axios.get(searchUrl, { params });
			const products = response.data.data?.products || [];

			return products.map((product: any, index: number) => ({
				id: product.id.toString(),
				name: product.name,
				brand: product.brand || 'Неизвестно',
				price: product.salePriceU / 100,
				rating: product.rating || 0,
				reviewsCount: product.feedbacks || 0,
				salesCount: product.sale || 0,
				url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
				image: this.getProductImage(product.id),
				position: index + 1,
			}));
		} catch (error) {
			console.error('Error searching products:', error);
			return [];
		}
	}

	private getProductImage(productId: number): string {
		// Генерируем URL изображения товара WB
		const vol = Math.floor(productId / 100000);
		const part = Math.floor(productId / 1000);
		return `https://basket-${vol}.wb.ru/vol${vol}/part${part}/${productId}/images/c516x688/1.jpg`;
	}

	private removeDuplicates(competitors: CompetitorInfo[]): CompetitorInfo[] {
		const seen = new Set<string>();
		return competitors.filter(competitor => {
			if (seen.has(competitor.id)) {
				return false;
			}
			seen.add(competitor.id);
			return true;
		});
	}
}
