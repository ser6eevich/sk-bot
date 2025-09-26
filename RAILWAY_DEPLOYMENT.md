# 🚀 Развертывание на Railway

## 📋 Пошаговая инструкция

### 1. Подготовка проекта

```bash
# Убедитесь, что у вас есть все файлы
ls -la
# Должны быть: package.json, dist/, public/, ssl/
```

### 2. Регистрация на Railway

1. Перейдите на https://railway.app
2. Нажмите "Login" → "Login with GitHub"
3. Авторизуйтесь через GitHub

### 3. Создание проекта

1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Найдите ваш репозиторий `sk-bot`
4. Нажмите "Deploy Now"

### 4. Настройка переменных окружения

В панели Railway:

1. Перейдите в "Variables"
2. Добавьте переменные:

```env
BOT_TOKEN=your_telegram_bot_token
BASE_URL=https://your-app-name.railway.app
PORT=3000
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id
NODE_ENV=production
```

### 5. Настройка базы данных

Railway автоматически предоставит PostgreSQL, но мы используем SQLite:

1. В панели Railway нажмите "New"
2. Выберите "Database" → "PostgreSQL" (опционально)
3. Или оставьте SQLite (файловая база)

### 6. Получение URL

После развертывания Railway даст вам URL вида:
`https://your-app-name.railway.app`

### 7. Настройка Telegram бота

1. Откройте [@BotFather](https://t.me/botfather)
2. Выберите вашего бота
3. Выполните:

```
/setmenubutton
Выберите бота → Menu Button → Configure Menu Button
URL: https://your-app-name.railway.app
Text: SellKit
```

### 8. Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите кнопку "Start"
3. Проверьте, что Mini App открывается
4. Протестируйте функции

## 🔧 Настройка для продакшена

### Обновление кода

```bash
# Внесите изменения в код
git add .
git commit -m "Update Mini App"
git push origin main

# Railway автоматически пересоберет и развернет
```

### Мониторинг

1. В панели Railway перейдите в "Metrics"
2. Смотрите логи в "Deployments"
3. Настройте алерты в "Settings"

### Резервное копирование

```bash
# Скачайте базу данных
railway connect
# Или используйте Railway CLI для бэкапа
```

## 💰 Стоимость

- **Бесплатный тариф**: 500 часов/месяц
- **Pro план**: $5/месяц за неограниченное время
- **Дополнительные ресурсы**: По необходимости

## 🆘 Устранение неполадок

### Проблема: Приложение не запускается

**Решение:**

1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте, что `npm start` работает локально

### Проблема: Mini App не открывается в Telegram

**Решение:**

1. Убедитесь, что URL в BotFather правильный
2. Проверьте, что приложение доступно по HTTPS
3. Проверьте CORS настройки

### Проблема: База данных не работает

**Решение:**

1. Проверьте права доступа к папке `data/`
2. Убедитесь, что SQLite файл создается
3. Проверьте логи на ошибки базы данных

## 🎉 Готово!

Ваш SellKit Mini App развернут на Railway и готов к использованию!

### Следующие шаги:

1. ✅ Развертывание на Railway
2. ✅ Настройка Telegram бота
3. ✅ Тестирование Mini App
4. 🔄 Мониторинг и оптимизация
