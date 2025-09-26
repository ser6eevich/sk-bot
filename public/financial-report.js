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
		if (e.target.files[0] && document.getElementById('manualProcess').checked) {
			loadColumns(e.target.files[0]);
		}
	});

	// Load available columns
	async function loadColumns(file) {
		const formData = new FormData();
		formData.append('report', file);

		try {
			const response = await fetch('/api/excel/columns', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) throw new Error('Failed to get columns');

			const data = await response.json();
			displayColumnOptions(data.columns);
		} catch (error) {
			console.error('Error loading columns:', error);
			alert('Ошибка при загрузке столбцов');
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

			// Проверяем, что ответ - это Excel файл
			if (!contentType || !contentType.includes('spreadsheet')) {
				throw new Error('Ошибка при формировании файла');
			}

			// Get the blob from response
			const blob = await response.blob();

			// Create download link
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = 'processed_report.xlsx';

			// Trigger download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Cleanup
			window.URL.revokeObjectURL(downloadUrl);

			// Show success message
			alert('Ваш файл скачивается');
		} catch (error) {
			console.error('Error processing report:', error);
			showError(error.message);
		}
	});
});
