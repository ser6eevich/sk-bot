# 🚀 SellKit Mini App

**SellKit** - это Telegram Mini App для селлеров на Wildberries, который помогает анализировать товары, рассчитывать стоимость заказов из Китая и обрабатывать финансовые отчеты.

## ✨ Возможности

- 📊 **Анализ товаров** - AI-анализ изображений товаров с рекомендациями по ценообразованию
- 🧮 **Калькулятор заказов** - Расчет стоимости товаров из Китая с учетом всех расходов
- 📈 **Финансовые отчеты** - Обработка и анализ Excel отчетов с Wildberries
- 💾 **База данных** - Сохранение анализов, отчетов и пользовательских данных
- 🤖 **Telegram интеграция** - Полная интеграция с Telegram WebApp API

## 🛠️ Технологии

- **Backend**: Node.js + Express + TypeScript
- **База данных**: SQLite
- **Frontend**: HTML5 + CSS3 + JavaScript
- **AI**: OpenAI GPT-4 + Vision API
- **Развертывание**: Railway / Vercel
- **Telegram**: Grammy.js + WebApp API

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонирование репозитория
git clone https://github.com/YOUR_USERNAME/sk-bot.git
cd sk-bot

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Сборка проекта
npm run build

# Запуск в режиме разработки
npm run dev

# Или запуск продакшн версии
npm start
```

### Развертывание на Railway

1. **Подключите GitHub репозиторий к Railway**
2. **Настройте переменные окружения**
3. **Получите HTTPS URL**
4. **Настройте Telegram бота**

Подробная инструкция: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

## 📱 Telegram Mini App

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Настройте Menu Button:
   ```
   /setmenubutton
   URL: https://your-app-name.railway.app
   Text: SellKit
   ```

### Функции Mini App

- **Главная страница** - Навигация по функциям
- **Анализ товаров** - Загрузка изображений и AI-анализ
- **Калькулятор** - Расчет стоимости заказов из Китая
- **Финансовые отчеты** - Обработка Excel файлов
- **Профиль** - Статистика и история анализов

## 🗄️ База данных

Проект использует SQLite базу данных с тремя основными таблицами:

- **users** - Пользователи Telegram
- **analyses** - Анализы товаров
- **reports** - Финансовые отчеты

Подробная документация: [DATABASE_README.md](DATABASE_README.md)

## 🔧 API Endpoints

### Пользователи
- `GET /api/profile/user/:telegramId` - Получить пользователя
- `POST /api/profile/user` - Создать/обновить пользователя

### Анализы
- `POST /api/profile/analysis` - Сохранить анализ
- `GET /api/profile/user/:telegramId/analyses` - Получить анализы пользователя

### Отчеты
- `POST /api/profile/report` - Сохранить отчет
- `GET /api/profile/user/:telegramId/reports` - Получить отчеты пользователя

### Telegram WebApp
- `GET /api/telegram/user` - Данные пользователя Telegram
- `POST /api/telegram/data` - Отправка данных
- `GET /api/telegram/stats` - Статистика пользователя

## 🔒 Безопасность

- ✅ Проверка подписи Telegram WebApp
- ✅ CORS настройки для Telegram
- ✅ Валидация входных данных
- ✅ Безопасное хранение переменных окружения

## 📊 Мониторинг

- **Логи** - Автоматическое логирование в Railway
- **Метрики** - Мониторинг производительности
- **Ошибки** - Отслеживание и уведомления

## 🆘 Устранение неполадок

### Проблемы с развертыванием
- Проверьте переменные окружения
- Убедитесь, что все зависимости установлены
- Проверьте логи в Railway Dashboard

### Проблемы с Telegram
- Убедитесь, что URL в BotFather правильный
- Проверьте HTTPS сертификат
- Проверьте CORS настройки

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

## 📞 Поддержка

При возникновении проблем:

1. Проверьте [Issues](https://github.com/YOUR_USERNAME/sk-bot/issues)
2. Создайте новый Issue с описанием проблемы
3. Приложите логи и скриншоты

## 🎉 Благодарности

- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
- [OpenAI API](https://openai.com/api/)
- [Railway](https://railway.app) за хостинг
- [Grammy.js](https://grammy.dev/) за Telegram интеграцию

---

**Создано с ❤️ для селлеров на Wildberries**
