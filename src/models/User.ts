export interface User {
	id: number;
	telegramId: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserData {
	telegramId: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
}
