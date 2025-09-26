// Обработка данных анализа на странице упаковки
document.addEventListener('DOMContentLoaded', function () {
	// Очищаем данные анализа при загрузке страницы упаковки
	localStorage.removeItem('packagingData');
});

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
