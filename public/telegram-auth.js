// Telegram Web App API интеграция
class TelegramAuth {
	constructor() {
		this.user = null;
		this.isAuthorized = false;
		this.init();
	}

	init() {
		// Проверяем сохраненную авторизацию
		const savedUser = localStorage.getItem('telegramUser');
		if (savedUser) {
			this.user = JSON.parse(savedUser);
			this.isAuthorized = true;
			this.updateProfile();
			this.showAuthorizedContent();
			return;
		}

		// Проверяем, что мы в Telegram Web App
		if (window.Telegram && window.Telegram.WebApp) {
			this.webApp = window.Telegram.WebApp;
			this.webApp.ready();
			this.webApp.expand();

			// Получаем данные пользователя
			this.user = this.webApp.initDataUnsafe?.user;
			this.isAuthorized = !!this.user;

			if (this.isAuthorized) {
				// Сохраняем данные пользователя
				localStorage.setItem('telegramUser', JSON.stringify(this.user));
				this.updateProfile();
				this.showAuthorizedContent();
			} else {
				this.showAuthPrompt();
			}
		} else {
			// Для тестирования вне Telegram
			this.showTestMode();
		}
	}

	updateProfile() {
		if (!this.user) return;

		// Обновляем информацию в профиле
		const profileElements = {
			avatar: document.getElementById('userAvatar'),
			name: document.getElementById('userName'),
			username: document.getElementById('userUsername'),
			id: document.getElementById('userId'),
		};

		// Аватар
		if (profileElements.avatar && this.user.photo_url) {
			profileElements.avatar.src = this.user.photo_url;
			profileElements.avatar.style.display = 'block';
		}

		// Имя
		if (profileElements.name) {
			profileElements.name.textContent =
				this.user.first_name +
				(this.user.last_name ? ' ' + this.user.last_name : '');
		}

		// Username
		if (profileElements.username) {
			profileElements.username.textContent = this.user.username
				? '@' + this.user.username
				: 'Не указан';
		}

		// ID
		if (profileElements.id) {
			profileElements.id.textContent = 'ID: ' + this.user.id;
		}
	}

	showAuthorizedContent() {
		// Скрываем форму авторизации
		const authPrompt = document.getElementById('authPrompt');
		if (authPrompt) {
			authPrompt.style.display = 'none';
		}

		// Показываем авторизованный контент
		const authorizedContent = document.getElementById('authorizedContent');
		if (authorizedContent) {
			authorizedContent.style.display = 'block';
		}

		// Показываем пользовательский контент
		this.showUserContent();

		// Показываем приветствие на главной странице
		this.showGreeting();

		// Обновляем статистику
		this.updateUserStats();
	}

	showGreeting() {
		const userGreeting = document.getElementById('userGreeting');
		const userGreetingName = document.getElementById('userGreetingName');

		if (userGreeting && userGreetingName && this.user) {
			userGreetingName.textContent = this.user.first_name;
			userGreeting.style.display = 'block';
		}
	}

	showAuthPrompt() {
		// Показываем форму авторизации
		const authPrompt = document.getElementById('authPrompt');
		if (authPrompt) {
			authPrompt.style.display = 'block';
		}

		// Скрываем авторизованный контент
		const authorizedContent = document.getElementById('authorizedContent');
		if (authorizedContent) {
			authorizedContent.style.display = 'none';
		}

		// Скрываем пользовательский контент
		this.hideUserContent();
	}

	showTestMode() {
		// Для тестирования вне Telegram
		console.log('Тестовый режим: Telegram Web App не доступен');

		// Создаем тестового пользователя
		this.user = {
			id: 123456789,
			first_name: 'Тестовый',
			last_name: 'Пользователь',
			username: 'test_user',
			photo_url: 'https://via.placeholder.com/100x100/3E1659/ffffff?text=T',
		};
		this.isAuthorized = true;

		// Сохраняем тестового пользователя
		localStorage.setItem('telegramUser', JSON.stringify(this.user));

		this.updateProfile();
		this.showAuthorizedContent();
	}

	updateUserStats() {
		// Здесь можно загрузить статистику пользователя с сервера
		// Пока используем заглушки
		const stats = {
			analyses: 0,
			reports: 0,
		};

		// Обновляем счетчики
		const analysesCount = document.getElementById('analysesCount');
		const reportsCount = document.getElementById('reportsCount');

		if (analysesCount) analysesCount.textContent = stats.analyses;
		if (reportsCount) reportsCount.textContent = stats.reports;
	}

	// Метод для выхода (если нужен)
	logout() {
		// Очищаем сохраненные данные
		localStorage.removeItem('telegramUser');
		this.user = null;
		this.isAuthorized = false;

		// Скрываем авторизованный контент
		const authorizedContent = document.getElementById('authorizedContent');
		if (authorizedContent) {
			authorizedContent.style.display = 'none';
		}

		// Скрываем статистику и другие разделы
		this.hideUserContent();

		// Показываем форму авторизации
		this.showAuthPrompt();

		// Скрываем приветствие
		const userGreeting = document.getElementById('userGreeting');
		if (userGreeting) {
			userGreeting.style.display = 'none';
		}

		if (this.webApp) {
			this.webApp.close();
		} else {
			// Для тестирования
			location.reload();
		}
	}

	// Получение данных пользователя
	getUser() {
		return this.user;
	}

	// Проверка авторизации
	isUserAuthorized() {
		return this.isAuthorized;
	}

	// Скрытие контента для неавторизованных пользователей
	hideUserContent() {
		// Скрываем статистику
		const statsCard = document.getElementById('statsCard');
		if (statsCard) {
			statsCard.style.display = 'none';
		}

		// Скрываем разделы "Мои анализы" и "Мои отчеты"
		const userAnalyses = document.getElementById('userAnalyses');
		const userReports = document.getElementById('userReports');
		if (userAnalyses) userAnalyses.style.display = 'none';
		if (userReports) userReports.style.display = 'none';
	}

	// Показ контента для авторизованных пользователей
	showUserContent() {
		// Показываем статистику
		const statsCard = document.getElementById('statsCard');
		if (statsCard) {
			statsCard.style.display = 'block';
		}

		// Показываем разделы "Мои анализы" и "Мои отчеты"
		const userAnalyses = document.getElementById('userAnalyses');
		const userReports = document.getElementById('userReports');
		if (userAnalyses) userAnalyses.style.display = 'block';
		if (userReports) userReports.style.display = 'block';
	}
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
	window.telegramAuth = new TelegramAuth();
});
