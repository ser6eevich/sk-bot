// Управление активным состоянием нижнего меню
class BottomMenuManager {
	constructor() {
		this.currentPage = this.getCurrentPage();
		this.init();
	}

	init() {
		// Добавляем класс active к текущей странице
		this.setActiveMenuItem();

		// Добавляем обработчики для плавных переходов
		this.addTransitionEffects();
	}

	getCurrentPage() {
		const path = window.location.pathname;
		const page = path.split('/').pop() || 'index.html';

		// Маппинг страниц на классы меню
		const pageMap = {
			'index.html': 'home',
			'': 'home',
			'tools.html': 'tools',
			'packaging.html': 'packaging',
			'profile.html': 'profile',
			'china-calculator.html': 'tools',
			'financial-report.html': 'tools',
		};

		return pageMap[page] || 'home';
	}

	setActiveMenuItem() {
		// Убираем active класс со всех элементов
		const menuItems = document.querySelectorAll('.bottom-menu-item');
		menuItems.forEach(item => {
			item.classList.remove('active');
		});

		// Добавляем active класс к текущему элементу
		const activeItem = document.querySelector(
			`[data-page="${this.currentPage}"]`
		);
		if (activeItem) {
			activeItem.classList.add('active');
		}
	}

	addTransitionEffects() {
		const menuItems = document.querySelectorAll('.bottom-menu-item');

		menuItems.forEach(item => {
			// Добавляем эффект при клике
			item.addEventListener('click', e => {
				// Убираем active со всех элементов
				menuItems.forEach(menuItem => {
					menuItem.classList.remove('active');
				});

				// Добавляем active к кликнутому элементу
				item.classList.add('active');

				// Добавляем временный эффект клика
				item.style.transform = 'translateY(-1px) scale(0.95)';
				setTimeout(() => {
					item.style.transform = '';
				}, 150);
			});

			// Добавляем эффект при наведении
			item.addEventListener('mouseenter', () => {
				if (!item.classList.contains('active')) {
					item.style.transform = 'translateY(-2px)';
				}
			});

			item.addEventListener('mouseleave', () => {
				if (!item.classList.contains('active')) {
					item.style.transform = '';
				}
			});
		});
	}

	// Метод для обновления активного состояния (если нужно изменить программно)
	updateActivePage(page) {
		this.currentPage = page;
		this.setActiveMenuItem();
	}
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
	window.bottomMenuManager = new BottomMenuManager();
});

