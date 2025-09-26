// Telegram WebApp API интеграция
class TelegramWebApp {
	constructor() {
		this.isTelegram = window.Telegram && window.Telegram.WebApp;
		this.webApp = this.isTelegram ? window.Telegram.WebApp : null;

		if (this.isTelegram) {
			this.init();
		} else {
			console.log(
				'⚠️ Telegram WebApp API не доступен. Запуск в обычном браузере.'
			);
		}
	}

	init() {
		console.log('🚀 Инициализация Telegram WebApp...');

		// Расширяем WebApp на весь экран
		this.webApp.expand();

		// Включаем кнопку закрытия
		this.webApp.enableClosingConfirmation();

		// Настраиваем тему
		this.setupTheme();

		// Обработчики событий
		this.setupEventHandlers();

		console.log('✅ Telegram WebApp инициализирован');
	}

	setupTheme() {
		if (!this.webApp) return;

		const theme = this.webApp.themeParams;
		const root = document.documentElement;

		// Применяем цвета темы Telegram
		if (theme.bg_color) {
			root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
		}
		if (theme.text_color) {
			root.style.setProperty('--tg-theme-text-color', theme.text_color);
		}
		if (theme.button_color) {
			root.style.setProperty('--tg-theme-button-color', theme.button_color);
		}
		if (theme.button_text_color) {
			root.style.setProperty(
				'--tg-theme-button-text-color',
				theme.button_text_color
			);
		}
	}

	setupEventHandlers() {
		if (!this.webApp) return;

		// Обработчик изменения темы
		this.webApp.onEvent('themeChanged', () => {
			this.setupTheme();
		});

		// Обработчик изменения размера окна
		this.webApp.onEvent('viewportChanged', () => {
			console.log('📱 Размер окна изменен');
		});
	}

	// Получить данные пользователя
	getUserData() {
		if (!this.webApp) return null;

		return {
			id: this.webApp.initDataUnsafe?.user?.id,
			username: this.webApp.initDataUnsafe?.user?.username,
			firstName: this.webApp.initDataUnsafe?.user?.first_name,
			lastName: this.webApp.initDataUnsafe?.user?.last_name,
			languageCode: this.webApp.initDataUnsafe?.user?.language_code,
			isPremium: this.webApp.initDataUnsafe?.user?.is_premium || false,
		};
	}

	// Получить данные авторизации
	getAuthData() {
		if (!this.webApp) return null;

		return {
			initData: this.webApp.initData,
			initDataUnsafe: this.webApp.initDataUnsafe,
		};
	}

	// Показать главную кнопку
	showMainButton(text, callback) {
		if (!this.webApp) return;

		this.webApp.MainButton.setText(text);
		this.webApp.MainButton.onClick(callback);
		this.webApp.MainButton.show();
	}

	// Скрыть главную кнопку
	hideMainButton() {
		if (!this.webApp) return;
		this.webApp.MainButton.hide();
	}

	// Показать кнопку "Назад"
	showBackButton(callback) {
		if (!this.webApp) return;

		this.webApp.BackButton.onClick(callback);
		this.webApp.BackButton.show();
	}

	// Скрыть кнопку "Назад"
	hideBackButton() {
		if (!this.webApp) return;
		this.webApp.BackButton.hide();
	}

	// Показать всплывающее окно
	showPopup(params) {
		if (!this.webApp) return;
		this.webApp.showPopup(params);
	}

	// Показать уведомление
	showAlert(message) {
		if (!this.webApp) return;
		this.webApp.showAlert(message);
	}

	// Показать подтверждение
	showConfirm(message, callback) {
		if (!this.webApp) return;
		this.webApp.showConfirm(message, callback);
	}

	// Отправить данные на сервер
	async sendData(data) {
		if (!this.webApp) return null;

		try {
			const response = await fetch('/api/telegram/data', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Telegram-Init-Data': this.webApp.initData,
				},
				body: JSON.stringify(data),
			});

			return await response.json();
		} catch (error) {
			console.error('Ошибка при отправке данных:', error);
			return null;
		}
	}

	// Закрыть WebApp
	close() {
		if (!this.webApp) return;
		this.webApp.close();
	}

	// Проверить, запущен ли в Telegram
	isRunningInTelegram() {
		return this.isTelegram;
	}

	// Получить информацию о платформе
	getPlatform() {
		if (!this.webApp) return 'unknown';
		return this.webApp.platform;
	}

	// Получить версию WebApp
	getVersion() {
		if (!this.webApp) return 'unknown';
		return this.webApp.version;
	}
}

// Создаем глобальный экземпляр
window.TelegramWebApp = new TelegramWebApp();

// Экспортируем для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
	module.exports = TelegramWebApp;
}
