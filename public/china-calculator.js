document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('calculatorForm');
	const results = document.getElementById('results');
	const errorAlert = document.getElementById('errorAlert');
	const calculateBtn = document.getElementById('calculateBtn');
	const imageInput = document.getElementById('productImage');
	const imagePreview = document.getElementById('imagePreview');
	const previewImg = document.getElementById('previewImg');
	const aiAnalysisSection = document.getElementById('aiAnalysisSection');
	const aiAnalysisContent = document.getElementById('aiAnalysisContent');

	// Функция для отображения ошибки
	function showError(message) {
		errorAlert.textContent = message;
		errorAlert.classList.remove('d-none');
		setTimeout(() => {
			errorAlert.classList.add('d-none');
		}, 5000);
	}

	// Функция для показа загрузки
	function showLoading() {
		calculateBtn.disabled = true;
		calculateBtn.innerHTML = 'Рассчитываем...';
	}

	// Функция для скрытия загрузки
	function hideLoading() {
		calculateBtn.disabled = false;
		calculateBtn.innerHTML = 'Рассчитать стоимость';
	}

	form.addEventListener('submit', async e => {
		e.preventDefault();

		// Проверяем, есть ли изображение для анализа
		if (imageInput.files && imageInput.files[0]) {
			// Если есть изображение, сразу запускаем ИИ-анализ
			showProgressModal();
			await performImageAnalysis(imageInput.files[0]);
		} else {
			// Если нет изображения, делаем обычный расчет
			const formData = {
				priceYuan: parseFloat(document.getElementById('priceYuan').value),
				weightKg: Math.round(
					parseFloat(document.getElementById('weight').value)
				),
				quantity: parseInt(document.getElementById('quantity').value),
				shippingPricePerKg: parseFloat(
					document.getElementById('shippingPrice').value
				),
				targetPrice: document.getElementById('targetPrice').value
					? parseFloat(document.getElementById('targetPrice').value)
					: undefined,
				wbCommissionPercent: parseFloat(
					document.getElementById('wbCommissionPercent').value
				),
				logisticsCostRub: parseFloat(
					document.getElementById('logisticsCostRub').value
				),
			};

			showLoading();

			try {
				const response = await fetch('/api/calculator/calculate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(formData),
				});

				const data = await response.json();

				if (data.success) {
					displayResults(data.data);
				} else {
					showError(data.error || 'Ошибка при расчете');
				}
			} catch (error) {
				console.error('Error:', error);
				showError('Ошибка при отправке запроса');
			} finally {
				hideLoading();
			}
		}
	});

	// Обработка загрузки изображения
	imageInput.addEventListener('change', e => {
		if (e.target.files && e.target.files[0]) {
			showImagePreview(e.target.files[0]);
		}
	});

	function showImagePreview(file) {
		const reader = new FileReader();
		reader.onload = e => {
			previewImg.src = e.target.result;
			imagePreview.style.display = 'block';
		};
		reader.readAsDataURL(file);
	}

	// Функции для работы с модальным окном прогресса
	function showProgressModal() {
		const modal = new bootstrap.Modal(
			document.getElementById('analysisProgressModal')
		);
		modal.show();
		updateProgress(
			10,
			'Загрузка изображения...',
			'Отправка изображения на анализ'
		);
	}

	function updateProgress(percent, title, description, step) {
		document.getElementById('progressBar').style.width = percent + '%';
		document.getElementById('progressTitle').textContent = title;
		document.getElementById('progressDescription').textContent = description;
		if (step) {
			document.getElementById('progressStep').textContent = step;
		}
	}

	function hideProgressModal() {
		const modal = bootstrap.Modal.getInstance(
			document.getElementById('analysisProgressModal')
		);
		if (modal) {
			modal.hide();
		}
	}

	// Функция для анализа изображения
	async function performImageAnalysis(imageFile) {
		try {
			updateProgress(
				20,
				'Анализ изображения...',
				'ИИ анализирует товар на изображении'
			);

			const formData = new FormData();
			formData.append('image', imageFile);

			updateProgress(
				40,
				'Отправка на сервер...',
				'Передача данных для анализа'
			);

			const response = await fetch('/api/image-analysis/analyze', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Ошибка при анализе изображения');
			}

			updateProgress(
				70,
				'Обработка ответа...',
				'Получение результатов анализа'
			);
			const data = await response.json();

			if (data.success) {
				updateProgress(90, 'Формирование отчета...', 'Подготовка результатов');

				// Сохраняем данные для страницы результатов
				saveAnalysisData(data.data, imageFile);

				updateProgress(100, 'Анализ завершен!', 'Переход к результатам...');

				setTimeout(() => {
					hideProgressModal();
					// Перенаправляем на страницу результатов
					window.location.href = '/analysis-results.html';
				}, 1000);
			} else {
				hideProgressModal();
				showError('Ошибка при анализе изображения: ' + data.error);
			}
		} catch (error) {
			hideProgressModal();
			console.error('Ошибка при анализе изображения:', error);
			showError('Ошибка при анализе изображения: ' + error.message);
		}
	}

	// Функция для сохранения данных анализа
	function saveAnalysisData(analysis, imageFile) {
		// Сохраняем данные анализа
		localStorage.setItem('analysisData', JSON.stringify(analysis));

		// Сохраняем данные формы
		const formData = {
			priceYuan: parseFloat(document.getElementById('priceYuan').value),
			weightKg: Math.round(parseFloat(document.getElementById('weight').value)),
			quantity: parseInt(document.getElementById('quantity').value),
			shippingPricePerKg: parseFloat(
				document.getElementById('shippingPrice').value
			),
			targetPrice: document.getElementById('targetPrice').value
				? parseFloat(document.getElementById('targetPrice').value)
				: undefined,
			wbCommissionPercent: parseFloat(
				document.getElementById('wbCommissionPercent').value
			),
			logisticsCostRub: parseFloat(
				document.getElementById('logisticsCostRub').value
			),
		};

		// Добавляем себестоимость за единицу (рассчитываем согласно новым формулам)
		// Себестоимость за единицу = цена за единицу в рублях + доставка за 1 кг в рублях
		formData.pricePerUnit =
			formData.priceYuan * 13.5 + formData.shippingPricePerKg * 13.5;

		// Сохраняем изображение как base64
		if (imageFile) {
			const reader = new FileReader();
			reader.onload = function (e) {
				formData.imageData = e.target.result;
				localStorage.setItem('formData', JSON.stringify(formData));
			};
			reader.readAsDataURL(imageFile);
		} else {
			localStorage.setItem('formData', JSON.stringify(formData));
		}
	}

	// Функция для отображения результатов ИИ-анализа
	function displayAIAnalysis(analysis) {
		aiAnalysisContent.innerHTML = `
			<div class="row">
				<div class="col-md-6">
					<h5>Описание товара</h5>
					<p>${analysis.description}</p>

					<h5>Категория</h5>
					<p>${analysis.category}</p>

					<h5>Рекомендуемая цена</h5>
					<p class="h4 text-primary">${analysis.recommendedPrice} ₽</p>

					<h5>Диапазон цен</h5>
					<p>${analysis.priceRange.min} - ${analysis.priceRange.max} ₽</p>
				</div>
				<div class="col-md-6">
					<h5>Конкуренция</h5>
					<div class="progress mb-3">
						<div class="progress-bar" role="progressbar" style="width: ${
							analysis.competition * 10
						}%">
							${analysis.competition}/10
						</div>
					</div>

					<h5>Рекомендации</h5>
					<p>${analysis.recommendations}</p>
				</div>
			</div>
		`;
		aiAnalysisSection.style.display = 'block';
	}

	function displayResults(data) {
		const resultsHTML = `
			<div class="card mt-4">
				<div class="card-body">
					<h4 class="card-title mb-4">Результаты расчета</h4>
					
					<div class="row">
						<div class="col-md-6">
							<h5>Затраты на закупку</h5>
							<ul class="list-unstyled">
								<li><strong>Стоимость товара (юань):</strong> ${data.totalPriceYuan} ¥</li>
								<li><strong>Стоимость доставки (USD):</strong> $${data.totalShippingCost}</li>
								<li><strong>Общая стоимость (руб):</strong> ${data.totalCostRub} ₽</li>
								<li><strong>Себестоимость за единицу:</strong> ${data.pricePerUnit} ₽</li>
							</ul>
						</div>
						<div class="col-md-6">
							<h5>Расчет прибыли</h5>
							<ul class="list-unstyled">
								<li><strong>Рекомендуемая цена продажи:</strong> ${
									data.profitCalculation.sellingPrice
								} ₽</li>
								<li><strong>Комиссия WB (${
									data.profitCalculation.wbCommissionPercent
								}%):</strong> ${data.profitCalculation.wbCommission} ₽</li>
								<li><strong>Логистика WB за единицу:</strong> ${
									data.profitCalculation.logisticsCost
								} ₽</li>
								<li><strong>Чистая прибыль за единицу:</strong> ${
									data.profitCalculation.netProfitPerUnit
								} ₽</li>
								<li><strong>Общая чистая прибыль:</strong> ${
									data.profitCalculation.totalNetProfit
								} ₽</li>
								<li><strong>Рентабельность:</strong> ${data.profitability.toFixed(2)}%</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		`;

		results.innerHTML = resultsHTML;
		results.classList.remove('d-none');
	}
});
