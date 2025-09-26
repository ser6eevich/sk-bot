export interface Analysis {
	id: number;
	userId: number;
	title: string;
	description: string;
	category: string;
	recommendedPrice: number;
	priceRange: {
		min: number;
		max: number;
	};
	competition: number;
	recommendations: string;
	avgRating?: number;
	imageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAnalysisData {
	userId: number;
	title: string;
	description: string;
	category: string;
	recommendedPrice: number;
	priceRange: {
		min: number;
		max: number;
	};
	competition: number;
	recommendations: string;
	avgRating?: number;
	imageUrl?: string;
}
