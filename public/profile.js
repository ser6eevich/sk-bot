// Глобальные переменные
let currentUser = null;
let currentAnalyses = [];
let currentReports = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
	initializeProfile();
});

// Инициализация профиля
async function initializeProfile() {
	try {
		// Проверяем авторизацию
		if (window.telegramAuth && window.telegramAuth.isAuthorized()) {
			const userData = window.telegramAuth.getUserData();
			await loadUserProfile(userData);
		} else {
			showAuthPrompt();
		}
	} catch (error) {
		console.error('Ошибка при инициализации профиля:', error);
		showAuthPrompt();
	}
}

// Показать форму авторизации
function showAuthPrompt() {
	document.getElementById('authPrompt').style.display = 'block';
	document.getElementById('authorizedContent').style.display = 'none';
	document.getElementById('statsCard').style.display = 'none';
	document.getElementById('userAnalyses').style.display = 'none';
	document.getElementById('userReports').style.display = 'none';
}

// Загрузить профиль пользователя
async function loadUserProfile(userData) {
	try {
		// Создаем или обновляем пользователя в базе данных
		const response = await fetch('/api/profile/user', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				telegramId: userData.id,
				username: userData.username,
				firstName: userData.first_name,
				lastName: userData.last_name,
				avatarUrl: userData.photo_url,
			}),
		});

		if (!response.ok) {
			throw new Error('Ошибка при сохранении пользователя');
		}

		const result = await response.json();
		currentUser = result.user;

		// Обновляем интерфейс
		updateUserInterface();

		// Загружаем статистику и данные
		await loadUserStats();
		await loadUserAnalyses();
		await loadUserReports();

		// Показываем авторизованный контент
		document.getElementById('authPrompt').style.display = 'none';
		document.getElementById('authorizedContent').style.display = 'block';
		document.getElementById('statsCard').style.display = 'block';
		document.getElementById('userAnalyses').style.display = 'block';
		document.getElementById('userReports').style.display = 'block';
	} catch (error) {
		console.error('Ошибка при загрузке профиля:', error);
		showAuthPrompt();
	}
}

// Обновить интерфейс пользователя
function updateUserInterface() {
	if (!currentUser) return;

	// Обновляем информацию о пользователе
	document.getElementById('userName').textContent =
		currentUser.firstName || currentUser.username || 'Пользователь';
	document.getElementById('userUsername').textContent = currentUser.username
		? `@${currentUser.username}`
		: '';
	document.getElementById(
		'userId'
	).textContent = `ID: ${currentUser.telegramId}`;

	// Обновляем аватар
	if (currentUser.avatarUrl) {
		const avatarImg = document.getElementById('userAvatar');
		avatarImg.src = currentUser.avatarUrl;
		avatarImg.style.display = 'block';
		document.getElementById('defaultAvatar').style.display = 'none';
	}
}

// Загрузить статистику пользователя
async function loadUserStats() {
	try {
		const response = await fetch(
			`/api/profile/user/${currentUser.telegramId}/stats`
		);
		if (!response.ok) {
			throw new Error('Ошибка при загрузке статистики');
		}

		const result = await response.json();
		document.getElementById('analysesCount').textContent =
			result.stats.analysesCount;
		document.getElementById('reportsCount').textContent =
			result.stats.reportsCount;
	} catch (error) {
		console.error('Ошибка при загрузке статистики:', error);
	}
}

// Загрузить анализы пользователя
async function loadUserAnalyses() {
	try {
		const response = await fetch(
			`/api/profile/user/${currentUser.telegramId}/analyses?limit=5`
		);
		if (!response.ok) {
			throw new Error('Ошибка при загрузке анализов');
		}

		const result = await response.json();
		currentAnalyses = result.analyses;
		displayAnalyses(result.analyses);
	} catch (error) {
		console.error('Ошибка при загрузке анализов:', error);
	}
}

// Отобразить анализы
function displayAnalyses(analyses) {
	const analysesList = document.getElementById('analysesList');
	const analysesEmpty = document.getElementById('analysesEmpty');

	if (analyses.length === 0) {
		analysesList.style.display = 'none';
		analysesEmpty.style.display = 'block';
		return;
	}

	analysesList.style.display = 'block';
	analysesEmpty.style.display = 'none';

	analysesList.innerHTML = analyses
		.map(
			analysis => `
		<div class="card mb-3">
			<div class="card-body">
				<div class="d-flex justify-content-between align-items-start">
					<div class="flex-grow-1">
						<h6 class="card-title mb-1">${analysis.title}</h6>
						<p class="card-text text-muted small mb-2">${analysis.category}</p>
						<div class="d-flex gap-3 small text-muted">
							<span>💰 ${analysis.recommendedPrice} ₽</span>
							<span>⭐ ${analysis.avgRating || 'N/A'}</span>
							<span>📊 ${analysis.competition}/10</span>
						</div>
					</div>
					<button 
						class="btn btn-sm btn-outline-primary"
						onclick="showAnalysis(${analysis.id})"
					>
						Просмотр
					</button>
				</div>
			</div>
		</div>
	`
		)
		.join('');
}

// Загрузить отчеты пользователя
async function loadUserReports() {
	try {
		const response = await fetch(
			`/api/profile/user/${currentUser.telegramId}/reports?limit=5`
		);
		if (!response.ok) {
			throw new Error('Ошибка при загрузке отчетов');
		}

		const result = await response.json();
		currentReports = result.reports;
		displayReports(result.reports);
	} catch (error) {
		console.error('Ошибка при загрузке отчетов:', error);
	}
}

// Отобразить отчеты
function displayReports(reports) {
	const reportsList = document.getElementById('reportsList');
	const reportsEmpty = document.getElementById('reportsEmpty');

	if (reports.length === 0) {
		reportsList.style.display = 'none';
		reportsEmpty.style.display = 'block';
		return;
	}

	reportsList.style.display = 'block';
	reportsEmpty.style.display = 'none';

	reportsList.innerHTML = reports
		.map(
			report => `
		<div class="card mb-3">
			<div class="card-body">
				<div class="d-flex justify-content-between align-items-start">
					<div class="flex-grow-1">
						<h6 class="card-title mb-1">${report.title}</h6>
						<p class="card-text text-muted small mb-2">${report.fileName}</p>
						<div class="d-flex gap-3 small text-muted">
							<span>📁 ${formatFileSize(report.fileSize)}</span>
							<span>📅 ${formatDate(report.createdAt)}</span>
						</div>
					</div>
					<button 
						class="btn btn-sm btn-outline-primary"
						onclick="showReport(${report.id})"
					>
						Просмотр
					</button>
				</div>
			</div>
		</div>
	`
		)
		.join('');
}

// Показать анализ в модальном окне
async function showAnalysis(analysisId) {
	try {
		const response = await fetch(`/api/profile/analysis/${analysisId}`);
		if (!response.ok) {
			throw new Error('Ошибка при загрузке анализа');
		}

		const result = await response.json();
		const analysis = result.analysis;

		// Обновляем заголовок модального окна
		document.getElementById('analysisModalLabel').textContent = analysis.title;

		// Заполняем содержимое
		document.getElementById('analysisContent').innerHTML = `
			<div class="row">
				<div class="col-md-6">
					<h6>Описание</h6>
					<p>${analysis.description}</p>
					
					<h6>Категория</h6>
					<p><span class="badge bg-primary">${analysis.category}</span></p>
					
					<h6>Рекомендации</h6>
					<p>${analysis.recommendations}</p>
				</div>
				<div class="col-md-6">
					<h6>Ценовая информация</h6>
					<div class="mb-3">
						<strong>Рекомендуемая цена:</strong> ${analysis.recommendedPrice} ₽
					</div>
					<div class="mb-3">
						<strong>Диапазон цен:</strong> ${analysis.priceRange.min} - ${
			analysis.priceRange.max
		} ₽
					</div>
					
					<h6>Анализ конкуренции</h6>
					<div class="mb-3">
						<strong>Уровень конкуренции:</strong> ${analysis.competition}/10
						<div class="progress mt-1">
							<div class="progress-bar" style="width: ${analysis.competition * 10}%"></div>
						</div>
					</div>
					
					${
						analysis.avgRating
							? `
						<h6>Средний рейтинг</h6>
						<div class="mb-3">
							<strong>Рейтинг:</strong> ${analysis.avgRating}/5
							<div class="progress mt-1">
								<div class="progress-bar bg-warning" style="width: ${
									analysis.avgRating * 20
								}%"></div>
							</div>
						</div>
					`
							: ''
					}
					
					<h6>Дата создания</h6>
					<p class="text-muted">${formatDate(analysis.createdAt)}</p>
				</div>
			</div>
		`;

		// Показываем модальное окно
		const modal = new bootstrap.Modal(document.getElementById('analysisModal'));
		modal.show();
	} catch (error) {
		console.error('Ошибка при загрузке анализа:', error);
		alert('Ошибка при загрузке анализа');
	}
}

// Показать отчет в модальном окне
async function showReport(reportId) {
	try {
		const response = await fetch(`/api/profile/report/${reportId}`);
		if (!response.ok) {
			throw new Error('Ошибка при загрузке отчета');
		}

		const result = await response.json();
		const report = result.report;

		// Обновляем заголовок модального окна
		document.getElementById('reportModalLabel').textContent = report.title;

		// Парсим обработанные данные
		let processedData;
		try {
			processedData = JSON.parse(report.processedData);
		} catch (e) {
			processedData = { error: 'Не удалось загрузить данные отчета' };
		}

		// Заполняем содержимое
		document.getElementById('reportContent').innerHTML = `
			<div class="row mb-3">
				<div class="col-md-6">
					<h6>Информация о файле</h6>
					<p><strong>Имя файла:</strong> ${report.fileName}</p>
					<p><strong>Размер:</strong> ${formatFileSize(report.fileSize)}</p>
					<p><strong>Дата создания:</strong> ${formatDate(report.createdAt)}</p>
				</div>
				<div class="col-md-6">
					${
						report.summary
							? `
						<h6>Краткое описание</h6>
						<p>${report.summary}</p>
					`
							: ''
					}
				</div>
			</div>
			
			<div class="table-responsive">
				<h6>Обработанные данные</h6>
				${generateReportTable(processedData)}
			</div>
		`;

		// Показываем модальное окно
		const modal = new bootstrap.Modal(document.getElementById('reportModal'));
		modal.show();
	} catch (error) {
		console.error('Ошибка при загрузке отчета:', error);
		alert('Ошибка при загрузке отчета');
	}
}

// Генерировать таблицу отчета
function generateReportTable(data) {
	if (data.error) {
		return `<p class="text-danger">${data.error}</p>`;
	}

	if (Array.isArray(data) && data.length > 0) {
		const headers = Object.keys(data[0]);
		return `
			<table class="table table-striped table-sm">
				<thead>
					<tr>
						${headers.map(header => `<th>${header}</th>`).join('')}
					</tr>
				</thead>
				<tbody>
					${data
						.slice(0, 100)
						.map(
							row => `
						<tr>
							${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
						</tr>
					`
						)
						.join('')}
				</tbody>
			</table>
			${
				data.length > 100
					? `<p class="text-muted">Показано первых 100 записей из ${data.length}</p>`
					: ''
			}
		`;
	}

	return '<p class="text-muted">Нет данных для отображения</p>';
}

// Показать все анализы
function showAllAnalyses() {
	// Здесь можно реализовать переход на отдельную страницу со всеми анализами
	alert('Функция "Все анализы" будет реализована в следующих версиях');
}

// Показать все отчеты
function showAllReports() {
	// Здесь можно реализовать переход на отдельную страницу со всеми отчетами
	alert('Функция "Все отчеты" будет реализована в следующих версиях');
}

// Вспомогательные функции
function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('ru-RU', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}
