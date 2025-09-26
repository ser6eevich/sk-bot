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
				// Регистрируем пользователя на сервере
				this.registerUser();
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
			// Скрываем дефолтный аватар
			const defaultAvatar = document.getElementById('defaultAvatar');
			if (defaultAvatar) {
				defaultAvatar.style.display = 'none';
			}
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
			profileElements.id.textContent = 'ID в приложении: ' + this.user.id;
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
		// Для тестирования вне Telegram - показываем сообщение
		console.log('Telegram Web App не доступен - запуск в обычном браузере');
		
		// Показываем сообщение о том, что нужно открыть в Telegram
		const authPrompt = document.getElementById('authPrompt');
		if (authPrompt) {
			authPrompt.innerHTML = `
				<div class="card-body text-center">
					<div class="mb-4">
						<div class="display-6">📱</div>
					</div>
					<h4 class="card-title mb-3">Откройте в Telegram</h4>
					<p class="text-muted mb-4">
						Этот Mini App предназначен для запуска в Telegram. 
						Откройте бота в Telegram для полного доступа к функциям.
					</p>
					<div class="alert alert-info">
						<strong>Для тестирования:</strong> Откройте бота в Telegram и нажмите кнопку "Профиль"
					</div>
				</div>
			`;
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

	async updateUserStats() {
		if (!this.user) return;

		try {
			// Загружаем статистику с сервера
			const response = await fetch('/api/telegram/stats', {
				headers: {
					'X-Telegram-Init-Data': this.webApp?.initData || ''
				}
			});

			if (response.ok) {
				const data = await response.json();
				const stats = data.stats;

				// Обновляем счетчики в профиле
				const analysesCount = document.getElementById('analysesCount');
				const reportsCount = document.getElementById('reportsCount');

				if (analysesCount) analysesCount.textContent = stats.analysesCount || 0;
				if (reportsCount) reportsCount.textContent = stats.reportsCount || 0;

				// Обновляем счетчики на главной странице
				const homeAnalysesCount = document.getElementById('homeAnalysesCount');
				const homeReportsCount = document.getElementById('homeReportsCount');

				if (homeAnalysesCount) homeAnalysesCount.textContent = stats.analysesCount || 0;
				if (homeReportsCount) homeReportsCount.textContent = stats.reportsCount || 0;

				// Загружаем списки анализов и отчетов
				await this.loadUserAnalyses();
				await this.loadUserReports();
			} else {
				console.error('Ошибка загрузки статистики:', response.status);
				// Используем заглушки при ошибке
				this.showDefaultStats();
			}
		} catch (error) {
			console.error('Ошибка при загрузке статистики:', error);
			// Используем заглушки при ошибке
			this.showDefaultStats();
		}
	}

	showDefaultStats() {
		// Показываем заглушки при ошибке загрузки
		const analysesCount = document.getElementById('analysesCount');
		const reportsCount = document.getElementById('reportsCount');

		if (analysesCount) analysesCount.textContent = '0';
		if (reportsCount) reportsCount.textContent = '0';
	}

	async loadUserAnalyses() {
		try {
			const response = await fetch('/api/telegram/analyses', {
				headers: {
					'X-Telegram-Init-Data': this.webApp?.initData || ''
				}
			});

			if (response.ok) {
				const data = await response.json();
				this.displayAnalyses(data.analyses || []);
			}
		} catch (error) {
			console.error('Ошибка загрузки анализов:', error);
		}
	}

	async loadUserReports() {
		try {
			const response = await fetch('/api/telegram/reports', {
				headers: {
					'X-Telegram-Init-Data': this.webApp?.initData || ''
				}
			});

			if (response.ok) {
				const data = await response.json();
				this.displayReports(data.reports || []);
			}
		} catch (error) {
			console.error('Ошибка загрузки отчетов:', error);
		}
	}

	displayAnalyses(analyses) {
		const analysesList = document.getElementById('analysesList');
		const analysesEmpty = document.getElementById('analysesEmpty');

		if (!analysesList || !analysesEmpty) return;

		if (analyses.length === 0) {
			analysesList.innerHTML = '';
			analysesEmpty.style.display = 'block';
			return;
		}

		analysesEmpty.style.display = 'none';
		analysesList.innerHTML = analyses.map(analysis => `
			<div class="card mb-3">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-start">
						<div class="flex-grow-1">
							<h6 class="card-title mb-1">${analysis.productName || 'Анализ товара'}</h6>
							<p class="card-text text-muted small mb-2">
								${new Date(analysis.createdAt).toLocaleDateString('ru-RU')}
							</p>
							<p class="card-text small">${analysis.summary || 'Анализ завершен'}</p>
						</div>
						<button class="btn btn-sm btn-outline-primary" onclick="viewAnalysis(${analysis.id})">
							Просмотр
						</button>
					</div>
				</div>
			</div>
		`).join('');
	}

	displayReports(reports) {
		const reportsList = document.getElementById('reportsList');
		const reportsEmpty = document.getElementById('reportsEmpty');

		if (!reportsList || !reportsEmpty) return;

		if (reports.length === 0) {
			reportsList.innerHTML = '';
			reportsEmpty.style.display = 'block';
			return;
		}

		reportsEmpty.style.display = 'none';
		reportsList.innerHTML = reports.map(report => `
			<div class="card mb-3">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-start">
						<div class="flex-grow-1">
							<h6 class="card-title mb-1">${report.title || 'Финансовый отчет'}</h6>
							<p class="card-text text-muted small mb-2">
								${new Date(report.createdAt).toLocaleDateString('ru-RU')}
							</p>
							<p class="card-text small">Общая сумма: ${report.totalAmount || '0'} ₽</p>
						</div>
						<button class="btn btn-sm btn-outline-success" onclick="viewReport(${report.id})">
							Просмотр
						</button>
					</div>
				</div>
			</div>
		`).join('');
	}

	async registerUser() {
		if (!this.user || !this.webApp) return;

		try {
			// Регистрируем пользователя на сервере
			const response = await fetch('/api/telegram/user', {
				headers: {
					'X-Telegram-Init-Data': this.webApp.initData
				}
			});

			if (response.ok) {
				const data = await response.json();
				console.log('✅ Пользователь зарегистрирован:', data.user);
			} else {
				console.error('❌ Ошибка регистрации пользователя:', response.status);
			}
		} catch (error) {
			console.error('❌ Ошибка при регистрации пользователя:', error);
		}
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
