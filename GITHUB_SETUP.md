# 📚 Настройка GitHub репозитория

## 🚀 Пошаговая инструкция

### 1. Создание репозитория на GitHub

1. **Перейдите на GitHub.com** и войдите в свой аккаунт
2. **Нажмите "New repository"** (зеленая кнопка)
3. **Заполните форму:**
   - Repository name: `sk-bot` или `sellkit-mini-app`
   - Description: `SellKit Mini App for Telegram - помощник для селлеров на Wildberries`
   - Visibility: **Public** (чтобы можно было развернуть на Railway)
   - ✅ **Initialize this repository with a README** (НЕ отмечайте!)
   - ✅ **Add .gitignore** (НЕ отмечайте!)
   - ✅ **Choose a license** (опционально)

4. **Нажмите "Create repository"**

### 2. Подключение локального репозитория к GitHub

После создания репозитория GitHub покажет инструкции. Выполните:

```bash
# Добавьте remote origin (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sk-bot.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Отправьте код на GitHub
git push -u origin main
```

### 3. Альтернативный способ (если есть SSH ключи)

```bash
# Если у вас настроены SSH ключи
git remote add origin git@github.com:YOUR_USERNAME/sk-bot.git
git branch -M main
git push -u origin main
```

## 🔧 Настройка для развертывания

### 1. Railway автоматически подключится к GitHub

1. Перейдите на https://railway.app
2. Нажмите "New Project"
3. Выберите "Deploy from GitHub repo"
4. Найдите ваш репозиторий `sk-bot`
5. Нажмите "Deploy Now"

### 2. Настройка переменных окружения в Railway

После развертывания добавьте переменные:

```env
BOT_TOKEN=your_telegram_bot_token
BASE_URL=https://your-app-name.railway.app
PORT=3000
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id
NODE_ENV=production
```

## 📱 Настройка Telegram бота

1. Откройте [@BotFather](https://t.me/botfather)
2. Выберите вашего бота
3. Выполните команды:

```
/setmenubutton
Выберите бота → Menu Button → Configure Menu Button
URL: https://your-app-name.railway.app
Text: SellKit
```

## 🎉 Готово!

Ваш проект теперь на GitHub и готов к развертыванию на Railway!

### Следующие шаги:

1. ✅ Создать репозиторий на GitHub
2. ✅ Подключить локальный репозиторий
3. ✅ Развернуть на Railway
4. ✅ Настроить Telegram бота
5. 🔄 Тестирование и оптимизация
