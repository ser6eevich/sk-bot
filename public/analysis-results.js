document.addEventListener('DOMContentLoaded', () => {
	// Получаем данные из localStorage
	const analysisData = JSON.parse(localStorage.getItem('analysisData') || '{}');
	const formData = JSON.parse(localStorage.getItem('formData') || '{}');

	if (!analysisData.description) {
		// Если нет данных, перенаправляем на калькулятор
		window.location.href = '/china-calculator.html';
		return;
	}

	// Отображаем данные
	displayAnalysisResults(analysisData, formData);
});

function displayAnalysisResults(analysis, formData) {
	// Фото товара
	const productImage = document.getElementById('productImage');
	if (formData.imageData) {
		productImage.src = formData.imageData;
	}

	// Описание и категория
	document.getElementById('productDescription').textContent =
		analysis.description;
	document.getElementById('productCategory').textContent = analysis.category;

	// Ценовые рекомендации
	document.getElementById(
		'recommendedPrice'
	).textContent = `${analysis.recommendedPrice} ₽`;
	document.getElementById(
		'priceRange'
	).textContent = `${analysis.priceRange.min} - ${analysis.priceRange.max} ₽`;

	// Конкуренция
	const competitionBar = document.getElementById('competitionBar');
	const competitionText = document.getElementById('competitionText');
	competitionBar.style.width = `${analysis.competition * 10}%`;
	competitionText.textContent = `${analysis.competition}/10`;

	// Рекомендации по упаковке
	displayPackagingRecommendations(analysis.recommendations);

	// Детальная информация
	displayDetailedInfo(analysis, formData);

	// Подробный расчет затрат
	displayCostBreakdown(formData);

	// Расчет прибыли
	calculateAndDisplayProfits(analysis, formData);
}

function displayDetailedInfo(analysis, formData) {
	// Средний рейтинг (из анализа ассистента, если есть)
	const avgRating = analysis.avgRating || 4.6; // По умолчанию 4.6
	document.getElementById('ratingStars').innerHTML = generateStars(avgRating);
	document.getElementById('ratingText').textContent = `${avgRating}/5.0`;

	// Количество товара
	document.getElementById('totalQuantity').textContent = formData.quantity || 1;

	// Общий вес партии (в кг, с одной цифрой после запятой)
	const totalWeight = (formData.weightKg || 0) * (formData.quantity || 1);
	document.getElementById('totalWeight').textContent = totalWeight.toFixed(1);
}

function displayCostBreakdown(formData) {
	const quantity = formData.quantity || 1;
	const priceYuan = formData.priceYuan || 0;
	const weightKg = formData.weightKg || 0;
	const shippingPricePerKg = formData.shippingPricePerKg || 0;

	// Расчеты согласно новым формулам
	// 1. Стоимость товара = цена за единицу * количество партии
	const totalCostYuan = priceYuan * quantity;

	// 2. Стоимость доставки = стоимость доставки за кг * количество партии
	const totalShippingCostUSD = shippingPricePerKg * quantity;

	// 3. Общая стоимость = стоимость товара в рублях + стоимость доставки в рублях
	const totalCostRub = totalCostYuan * 13.5 + totalShippingCostUSD * 13.5;

	// 4. Себестоимость за единицу = цена за единицу в рублях + доставка за 1 кг в рублях
	const costPerUnit = priceYuan * 13.5 + shippingPricePerKg * 13.5;

	// Отображение затрат на закупку
	document.getElementById('costYuan').textContent = `${totalCostYuan.toFixed(
		2
	)} ¥`;
	document.getElementById(
		'shippingCost'
	).textContent = `$${totalShippingCostUSD.toFixed(2)}`;
	document.getElementById('totalCostRub').textContent = `${totalCostRub.toFixed(
		2
	)} ₽`;
	document.getElementById('costPerUnit').textContent = `${costPerUnit.toFixed(
		2
	)} ₽`;
}

function calculateAndDisplayProfits(analysis, formData) {
	// Параметры из формы
	const quantity = formData.quantity || 1;
	const wbCommissionPercent = formData.wbCommissionPercent || 20;
	const logisticsCostRub = formData.logisticsCostRub || 0;
	const priceYuan = formData.priceYuan || 0;
	const shippingPricePerKg = formData.shippingPricePerKg || 0;
	const yourPrice = formData.targetPrice || 0;

	// Себестоимость за единицу с учетом доставки (в рублях)
	const costPerUnitWithShipping = priceYuan * 13.5 + shippingPricePerKg * 13.5;

	// Расчет с вашей ценой
	if (yourPrice > 0) {
		const yourProfit = calculateDetailedProfit(
			yourPrice,
			costPerUnitWithShipping,
			wbCommissionPercent,
			logisticsCostRub,
			quantity
		);

		document.getElementById('yourPrice').textContent = `${yourPrice} ₽`;
		document.getElementById(
			'yourWbCommission'
		).textContent = `${yourProfit.wbCommissionPerUnit.toFixed(2)} ₽`;
		document.getElementById(
			'yourLogistics'
		).textContent = `${logisticsCostRub.toFixed(2)} ₽`;
		document.getElementById(
			'yourProfit'
		).textContent = `${yourProfit.netProfitPerUnit.toFixed(2)} ₽`;
		document.getElementById(
			'yourTotalRevenue'
		).textContent = `${yourProfit.totalRevenue.toFixed(2)} ₽`;
		document.getElementById(
			'yourTotalProfit'
		).textContent = `${yourProfit.totalNetProfit.toFixed(2)} ₽`;
		document.getElementById(
			'yourProfitability'
		).textContent = `${yourProfit.profitability.toFixed(2)}%`;
	} else {
		document.getElementById('yourPrice').textContent = 'Не указана';
		document.getElementById('yourWbCommission').textContent = '—';
		document.getElementById('yourLogistics').textContent = '—';
		document.getElementById('yourProfit').textContent = '—';
		document.getElementById('yourTotalRevenue').textContent = '—';
		document.getElementById('yourTotalProfit').textContent = '—';
		document.getElementById('yourProfitability').textContent = '—';
	}

	// Расчет с рекомендуемой ценой
	const recommendedProfit = calculateDetailedProfit(
		analysis.recommendedPrice,
		costPerUnitWithShipping,
		wbCommissionPercent,
		logisticsCostRub,
		quantity
	);

	document.getElementById(
		'recommendedPriceValue'
	).textContent = `${analysis.recommendedPrice} ₽`;
	document.getElementById(
		'recommendedWbCommission'
	).textContent = `${recommendedProfit.wbCommissionPerUnit.toFixed(2)} ₽`;
	document.getElementById(
		'recommendedLogistics'
	).textContent = `${logisticsCostRub.toFixed(2)} ₽`;
	document.getElementById(
		'recommendedProfit'
	).textContent = `${recommendedProfit.netProfitPerUnit.toFixed(2)} ₽`;
	document.getElementById(
		'recommendedTotalRevenue'
	).textContent = `${recommendedProfit.totalRevenue.toFixed(2)} ₽`;
	document.getElementById(
		'recommendedTotalProfit'
	).textContent = `${recommendedProfit.totalNetProfit.toFixed(2)} ₽`;
	document.getElementById(
		'recommendedProfitability'
	).textContent = `${recommendedProfit.profitability.toFixed(2)}%`;
}

function calculateDetailedProfit(
	sellingPrice,
	costPriceWithShipping,
	wbCommissionPercent,
	logisticsCostRub,
	quantity
) {
	// Комиссия WB за единицу
	const wbCommissionPerUnit = (sellingPrice * wbCommissionPercent) / 100;

	// Чистая прибыль за единицу = цена продажи - комиссия WB - логистика - себестоимость с доставкой
	const netProfitPerUnit =
		sellingPrice -
		wbCommissionPerUnit -
		logisticsCostRub -
		costPriceWithShipping;

	// Общая выручка = цена продажи * количество партии
	const totalRevenue = sellingPrice * quantity;

	// Общая прибыль = общая выручка - (себестоимость с доставкой * количество партии)
	const totalNetProfit = totalRevenue - costPriceWithShipping * quantity;

	// Рентабельность
	const profitability =
		costPriceWithShipping > 0
			? (netProfitPerUnit / costPriceWithShipping) * 100
			: 0;

	return {
		wbCommissionPerUnit,
		netProfitPerUnit,
		totalRevenue,
		totalNetProfit,
		profitability,
	};
}

function generateStars(rating) {
	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 >= 0.5;
	const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

	let stars = '';

	// Полные звезды
	for (let i = 0; i < fullStars; i++) {
		stars += '★';
	}

	// Половина звезды
	if (hasHalfStar) {
		stars += '☆';
	}

	// Пустые звезды
	for (let i = 0; i < emptyStars; i++) {
		stars += '☆';
	}

	return stars;
}

function calculateProfit(
	sellingPrice,
	costPrice,
	wbCommissionPercent,
	logisticsCostRub
) {
	const wbCommission = (sellingPrice * wbCommissionPercent) / 100;
	const netProfitPerUnit =
		sellingPrice - costPrice - wbCommission - logisticsCostRub;
	const totalNetProfit =
		netProfitPerUnit * (document.getElementById('quantity')?.value || 1);
	const profitability =
		costPrice > 0 ? (netProfitPerUnit / costPrice) * 100 : 0;

	return {
		netProfitPerUnit,
		totalNetProfit,
		profitability,
	};
}

function newAnalysis() {
	// Очищаем данные и переходим к калькулятору
	localStorage.removeItem('analysisData');
	localStorage.removeItem('formData');
	window.location.href = '/china-calculator.html';
}

async function saveAnalysis() {
	try {
		// Получаем данные анализа
		const analysisData = JSON.parse(
			localStorage.getItem('analysisData') || '{}'
		);
		const formData = JSON.parse(localStorage.getItem('formData') || '{}');

		// Проверяем авторизацию
		if (!window.telegramAuth || !window.telegramAuth.isAuthorized()) {
			alert('Для сохранения анализа необходимо авторизоваться');
			return;
		}

		const userData = window.telegramAuth.getUserData();

		// Отправляем запрос на сохранение
		const response = await fetch('/api/profile/analysis', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				telegramId: userData.id,
				title: `Анализ: ${analysisData.description}`,
				description: analysisData.description,
				category: analysisData.category,
				recommendedPrice: analysisData.recommendedPrice,
				priceRange: analysisData.priceRange,
				competition: analysisData.competition,
				recommendations: analysisData.recommendations,
				avgRating: analysisData.avgRating,
			}),
		});

		if (!response.ok) {
			throw new Error('Ошибка при сохранении анализа');
		}

		alert('Анализ успешно сохранен!');
	} catch (error) {
		console.error('Ошибка при сохранении анализа:', error);
		alert('Ошибка при сохранении анализа. Попробуйте еще раз.');
	}
}

// Обработка нижнего меню
document.querySelectorAll('.bottom-menu-item').forEach(item => {
	item.addEventListener('click', e => {
		e.preventDefault();
		const page = item.dataset.page;

		// Убираем активный класс у всех элементов
		document.querySelectorAll('.bottom-menu-item').forEach(el => {
			el.classList.remove('active');
		});

		// Добавляем активный класс к текущему элементу
		item.classList.add('active');

		// Переходим на страницу
		switch (page) {
			case 'home':
				window.location.href = '/';
				break;
			case 'tools':
				window.location.href = '/tools.html';
				break;
			case 'packaging':
				window.location.href = '/packaging.html';
				break;
			case 'profile':
				window.location.href = '/profile.html';
				break;
		}
	});
});

function displayPackagingRecommendations(recommendations) {
	// Парсим рекомендации и разделяем на категории
	const photoTips = [];
	const descriptionTips = [];
	const generalTips = [];

	// Разбиваем рекомендации на предложения
	const sentences = recommendations
		.split(/[.!?]+/)
		.filter(s => s.trim().length > 0);

	sentences.forEach(sentence => {
		const lowerSentence = sentence.toLowerCase();

		if (
			lowerSentence.includes('фото') ||
			lowerSentence.includes('снимк') ||
			lowerSentence.includes('изображен') ||
			lowerSentence.includes('демонстрац') ||
			lowerSentence.includes('показать') ||
			lowerSentence.includes('визуал')
		) {
			photoTips.push(sentence.trim());
		} else if (
			lowerSentence.includes('описан') ||
			lowerSentence.includes('текст') ||
			lowerSentence.includes('заголовок') ||
			lowerSentence.includes('назван') ||
			lowerSentence.includes('ключевые слова')
		) {
			descriptionTips.push(sentence.trim());
		} else {
			generalTips.push(sentence.trim());
		}
	});

	// Если не удалось разделить, помещаем все в общие рекомендации
	if (photoTips.length === 0 && descriptionTips.length === 0) {
		generalTips.push(...sentences.map(s => s.trim()));
	}

	// Отображаем фото рекомендации
	const photoList = document.getElementById('photoRecommendations');
	photoList.innerHTML = '';
	if (photoTips.length > 0) {
		photoTips.forEach(tip => {
			const li = document.createElement('li');
			li.innerHTML = `• ${tip}`;
			photoList.appendChild(li);
		});
	} else {
		photoList.innerHTML =
			'<li class="text-muted">• Используйте качественные фото на белом фоне</li><li class="text-muted">• Покажите товар в использовании</li>';
	}

	// Отображаем рекомендации по описанию
	const descriptionList = document.getElementById('descriptionRecommendations');
	descriptionList.innerHTML = '';
	if (descriptionTips.length > 0) {
		descriptionTips.forEach(tip => {
			const li = document.createElement('li');
			li.innerHTML = `• ${tip}`;
			descriptionList.appendChild(li);
		});
	} else {
		descriptionList.innerHTML =
			'<li class="text-muted">• Подчеркните ключевые преимущества</li><li class="text-muted">• Используйте эмоциональные слова</li>';
	}

	// Отображаем общие рекомендации
	const generalElement = document.getElementById('generalRecommendations');
	if (generalTips.length > 0) {
		generalElement.textContent = generalTips.join('. ') + '.';
	} else {
		generalElement.textContent =
			'Следуйте рекомендациям выше для создания успешной карточки товара.';
	}
}
