// Инициализация Telegram WebApp
document.addEventListener('DOMContentLoaded', function () {
	console.log('🚀 Инициализация SellKit Mini App...');

	// Проверяем, запущен ли в Telegram
	if (window.TelegramWebApp.isRunningInTelegram()) {
		console.log('✅ Запущено в Telegram WebApp');

		// Получаем данные пользователя
		const userData = window.TelegramWebApp.getUserData();
		if (userData) {
			console.log('👤 Пользователь:', userData);

			// Показываем приветствие
			const welcomeMessage = document.createElement('div');
			welcomeMessage.className = 'alert alert-info';
			welcomeMessage.innerHTML = `
                <h5>👋 Привет, ${userData.firstName || 'Пользователь'}!</h5>
                <p>Добро пожаловать в SellKit - ваш помощник для продаж на Wildberries</p>
            `;
			document
				.querySelector('.container')
				.insertBefore(welcomeMessage, document.querySelector('.row'));
		}

		// Настраиваем кнопку "Назад"
		if (
			window.location.pathname !== '/' &&
			window.location.pathname !== '/index.html'
		) {
			window.TelegramWebApp.showBackButton(() => {
				window.history.back();
			});
		}
	} else {
		console.log('⚠️ Запущено в обычном браузере');

		// Показываем предупреждение для разработчиков
		const devWarning = document.createElement('div');
		devWarning.className = 'alert alert-warning';
		devWarning.innerHTML = `
            <h5>⚠️ Режим разработки</h5>
            <p>Этот Mini App предназначен для запуска в Telegram. Некоторые функции могут работать некорректно в обычном браузере.</p>
        `;
		document
			.querySelector('.container')
			.insertBefore(devWarning, document.querySelector('.row'));
	}

	// Настраиваем обработчики для карточек
	setupCardHandlers();
});

function setupCardHandlers() {
	// Обработчик для карточки финансового отчета
	const financialCard = document.querySelector(
		'a[href="financial-report.html"]'
	);
	if (financialCard) {
		financialCard.addEventListener('click', function (e) {
			e.preventDefault();

			if (window.TelegramWebApp.isRunningInTelegram()) {
				// Показываем главную кнопку для загрузки файла
				window.TelegramWebApp.showMainButton('📊 Загрузить отчет', function () {
					// Логика загрузки файла будет в financial-report.html
					window.location.href = 'financial-report.html';
				});
			}

			window.location.href = 'financial-report.html';
		});
	}

	// Обработчик для карточки калькулятора
	const calculatorCard = document.querySelector(
		'a[href="china-calculator.html"]'
	);
	if (calculatorCard) {
		calculatorCard.addEventListener('click', function (e) {
			e.preventDefault();

			if (window.TelegramWebApp.isRunningInTelegram()) {
				// Показываем главную кнопку для расчета
				window.TelegramWebApp.showMainButton(
					'🧮 Рассчитать стоимость',
					function () {
						window.location.href = 'china-calculator.html';
					}
				);
			}

			window.location.href = 'china-calculator.html';
		});
	}
}
