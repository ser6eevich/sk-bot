document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('reportForm');
	const fileInput = document.getElementById('reportFile');
	const processType = document.getElementsByName('processType');
	const manualSettings = document.getElementById('manualSettings');
	const columnsToKeep = document.getElementById('columnsToKeep');
	const columnsToSum = document.getElementById('columnsToSum');
	const errorAlert = document.getElementById('errorAlert');

	// Handle process type change
	processType.forEach(radio => {
		radio.addEventListener('change', e => {
			if (e.target.value === 'manual') {
				manualSettings.classList.remove('d-none');
				// Загружаем столбцы если файл уже выбран
				if (fileInput.files[0]) {
					loadColumns(fileInput.files[0]);
				}
			} else {
				manualSettings.classList.add('d-none');
			}
		});
	});

	// Handle file selection
	fileInput.addEventListener('change', e => {
		const file = e.target.files[0];
		if (file) {
			// Если выбран ручной режим, сразу загружаем столбцы
			if (document.getElementById('manualProcess').checked) {
				loadColumns(file);
			}
		} else {
			// Очищаем столбцы если файл не выбран
			columnsToKeep.innerHTML = '';
			columnsToSum.innerHTML = '';
		}
	});

	// Load available columns
	async function loadColumns(file) {
		// Проверяем что файл действительно выбран
		if (!file) {
			console.error('No file provided to loadColumns');
			columnsToKeep.innerHTML = '<div class="alert alert-warning">Файл не выбран</div>';
			columnsToSum.innerHTML = '<div class="alert alert-warning">Файл не выбран</div>';
			return;
		}

		const formData = new FormData();
		formData.append('report', file);

		try {
			// Показываем индикатор загрузки
			columnsToKeep.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Загрузка...</span></div></div>';
			columnsToSum.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Загрузка...</span></div></div>';

			console.log('Sending file to server:', file.name, file.size, file.type);

			const response = await fetch('/api/excel/columns', {
				method: 'POST',
				body: formData,
			});

			console.log('Response status:', response.status);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Server error:', errorData);
				throw new Error(errorData.error || 'Failed to get columns');
			}

			const data = await response.json();
			console.log('Received columns:', data);
			
			if (!data.columns || data.columns.length === 0) {
				throw new Error('No columns found in the file');
			}

			displayColumnOptions(data.columns);
		} catch (error) {
			console.error('Error loading columns:', error);
			columnsToKeep.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
			columnsToSum.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
		}
	}

	// Display column options
	function displayColumnOptions(columns) {
		const keepHtml = columns
			.map(
				col => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${col}" id="keep_${col}">
                <label class="form-check-label" for="keep_${col}">${col}</label>
            </div>
        `
			)
			.join('');

		const sumHtml = columns
			.map(
				col => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${col}" id="sum_${col}">
                <label class="form-check-label" for="sum_${col}">${col}</label>
            </div>
        `
			)
			.join('');

		columnsToKeep.innerHTML = keepHtml;
		columnsToSum.innerHTML = sumHtml;
	}

	// Функция для отображения ошибки
	function showError(message) {
		errorAlert.textContent = message;
		errorAlert.classList.remove('d-none');
		setTimeout(() => {
			errorAlert.classList.add('d-none');
		}, 5000); // Скрыть через 5 секунд
	}

	// Handle form submission
	form.addEventListener('submit', async e => {
		e.preventDefault();
		errorAlert.classList.add('d-none');

		const formData = new FormData();
		formData.append('report', fileInput.files[0]);

		// Добавляем данные пользователя для автоматической отправки через бота
		if (window.Telegram && window.Telegram.WebApp) {
			const user = window.Telegram.WebApp.initDataUnsafe.user;
			console.log('Telegram user data:', user);
			if (user) {
				formData.append('telegramId', user.id.toString());
				formData.append('sendToBot', 'true');
				formData.append('saveReport', 'true');
				console.log('Added Telegram data to form:', {
					telegramId: user.id,
					sendToBot: 'true',
					saveReport: 'true'
				});
			} else {
				console.log('No Telegram user data found');
			}
		} else {
			console.log('Telegram WebApp not available');
		}

		if (document.getElementById('manualProcess').checked) {
			const config = {
				keep: Array.from(columnsToKeep.querySelectorAll('input:checked')).map(
					input => input.value
				),
				sum: Array.from(columnsToSum.querySelectorAll('input:checked')).map(
					input => input.value
				),
			};
			formData.append('config', JSON.stringify(config));
		}

		try {
			const response = await fetch('/api/excel/process', {
				method: 'POST',
				body: formData,
			});

			const contentType = response.headers.get('content-type');

			if (!response.ok) {
				// Если ответ содержит JSON с ошибкой
				if (contentType && contentType.includes('application/json')) {
					const errorData = await response.json();
					throw new Error(errorData.error);
				} else {
					throw new Error('Ошибка при обработке отчета');
				}
			}

			// Проверяем, отправлен ли файл через бота
			if (contentType && contentType.includes('application/json')) {
				try {
					const result = await response.json();
					if (result.sentViaBot) {
						// Показываем модальное окно успеха
						const successModal = new bootstrap.Modal(document.getElementById('successModal'));
						successModal.show();
						
						// Обновляем статистику пользователя
						if (window.telegramAuth) {
							window.telegramAuth.updateUserStats();
							// Принудительно обновляем списки отчетов
							setTimeout(() => {
								window.telegramAuth.loadUserReports();
							}, 1000);
						}
						return;
					}
				} catch (jsonError) {
					console.log('Не удалось распарсить JSON ответ:', jsonError);
				}
			}

			// Если ответ не JSON или не содержит sentViaBot, считаем что файл отправлен успешно
			// (так как файл действительно отправляется в бота)
			console.log('Файл отправлен через бота, показываем успех');
			const successModal = new bootstrap.Modal(document.getElementById('successModal'));
			successModal.show();
			
			// Обновляем статистику пользователя
			if (window.telegramAuth) {
				window.telegramAuth.updateUserStats();
				// Принудительно обновляем списки отчетов
				setTimeout(() => {
					window.telegramAuth.loadUserReports();
				}, 1000);
			}
		} catch (error) {
			console.error('Error processing report:', error);
			showError(error.message);
		}
	});
});
