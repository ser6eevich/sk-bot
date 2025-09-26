# 🚀 Развертывание SellKit Mini App

## 📋 Обзор

Этот документ описывает процесс развертывания SellKit как Mini App в Telegram боте.

## 🔧 Требования

- Node.js 18+
- SSL сертификат (для продакшена)
- Домен с HTTPS
- Telegram Bot Token

## 🛠️ Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Создание SSL сертификатов для разработки

```bash
node ssl/generate-certs.js
```

### 3. Настройка переменных окружения

Создайте файл `.env`:

```env
BOT_TOKEN=your_telegram_bot_token
BASE_URL=https://localhost:3443
PORT=3000
HTTPS_PORT=3443
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id
```

### 4. Сборка и запуск

```bash
# Сборка TypeScript
npm run build

# Запуск в режиме разработки
npm run dev

# Или запуск продакшн версии
npm start
```

### 5. Проверка работы

- Откройте https://localhost:3443 в браузере
- Проверьте, что все страницы загружаются
- Проверьте API endpoints

## 🌐 Продакшен развертывание

### 1. Подготовка сервера

```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2 для управления процессами
sudo npm install -g pm2
```

### 2. Настройка домена и SSL

#### Вариант A: Let's Encrypt (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d yourdomain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Вариант B: Nginx + SSL

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Развертывание приложения

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd sk-bot

# Установка зависимостей
npm install

# Сборка
npm run build

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск с PM2
pm2 start dist/index.js --name "sellkit-bot"
pm2 save
pm2 startup
```

### 4. Настройка Telegram бота

1. Откройте [@BotFather](https://t.me/botfather)
2. Выберите вашего бота
3. Выполните команды:

```
/setmenubutton
Выберите бота → Menu Button → Configure Menu Button
URL: https://yourdomain.com
Text: SellKit
```

Или через API:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebApp" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com"
  }'
```

## 🔒 Безопасность

### 1. Проверка подписи Telegram

Добавьте в `.env`:

```env
TELEGRAM_BOT_SECRET=your_bot_secret
```

Обновите `src/routes/telegram.ts`:

```typescript
import crypto from 'crypto';

function validateTelegramSignature(initData: string, secret: string): boolean {
	const urlParams = new URLSearchParams(initData);
	const hash = urlParams.get('hash');
	urlParams.delete('hash');

	const dataCheckString = Array.from(urlParams.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n');

	const secretKey = crypto.createHash('sha256').update(secret).digest();
	const calculatedHash = crypto
		.createHmac('sha256', secretKey)
		.update(dataCheckString)
		.digest('hex');

	return calculatedHash === hash;
}
```

### 2. Настройка CORS

Обновите CORS настройки в `src/index.ts`:

```typescript
app.use((req, res, next) => {
	const origin = req.headers.origin;
	const allowedOrigins = ['https://web.telegram.org', 'https://yourdomain.com'];

	if (allowedOrigins.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin);
	}

	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Telegram-Init-Data'
	);

	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
});
```

## 📱 Тестирование Mini App

### 1. Локальное тестирование

```bash
# Запуск с ngrok для тестирования
ngrok http 3443

# Используйте HTTPS URL от ngrok в настройках бота
```

### 2. Тестирование в Telegram

1. Откройте вашего бота в Telegram
2. Нажмите кнопку "Start"
3. Проверьте, что Mini App открывается
4. Протестируйте все функции

## 🐛 Отладка

### 1. Логи

```bash
# Просмотр логов PM2
pm2 logs sellkit-bot

# Просмотр логов в реальном времени
pm2 logs sellkit-bot --lines 100
```

### 2. Проверка статуса

```bash
# Статус приложения
pm2 status

# Перезапуск
pm2 restart sellkit-bot
```

### 3. Мониторинг

```bash
# Мониторинг ресурсов
pm2 monit
```

## 🔄 Обновление

```bash
# Остановка приложения
pm2 stop sellkit-bot

# Обновление кода
git pull origin main

# Установка новых зависимостей
npm install

# Сборка
npm run build

# Запуск
pm2 start sellkit-bot
```

## 📊 Мониторинг и аналитика

### 1. Логирование

Добавьте в `src/index.ts`:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: 'logs/combined.log' }),
	],
});
```

### 2. Метрики

```bash
# Установка PM2 Plus для мониторинга
pm2 install pm2-server-monit
```

## 🆘 Устранение неполадок

### Проблема: Mini App не открывается

**Решение:**

1. Проверьте HTTPS сертификат
2. Убедитесь, что домен доступен
3. Проверьте настройки бота в BotFather

### Проблема: Ошибки CORS

**Решение:**

1. Проверьте настройки CORS
2. Убедитесь, что домен добавлен в allowedOrigins

### Проблема: База данных заблокирована

**Решение:**

```bash
# Проверка процессов
lsof data/database.sqlite

# Перезапуск
pm2 restart sellkit-bot
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `pm2 logs sellkit-bot`
2. Проверьте статус: `pm2 status`
3. Проверьте доступность домена
4. Проверьте SSL сертификат

## 🎉 Готово!

Ваш SellKit Mini App готов к использованию в Telegram!
