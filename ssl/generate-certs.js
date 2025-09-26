const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Генерируем SSL сертификаты для разработки...');

// Создаем папку ssl если её нет
const sslDir = path.join(__dirname);
if (!fs.existsSync(sslDir)) {
	fs.mkdirSync(sslDir, { recursive: true });
}

try {
	// Генерируем приватный ключ
	console.log('📝 Создаем приватный ключ...');
	execSync('openssl genrsa -out ssl/private-key.pem 2048', {
		stdio: 'inherit',
	});

	// Генерируем сертификат
	console.log('📜 Создаем самоподписанный сертификат...');
	execSync(
		'openssl req -new -x509 -key ssl/private-key.pem -out ssl/certificate.pem -days 365 -subj "/C=RU/ST=Moscow/L=Moscow/O=Dev/CN=localhost"',
		{ stdio: 'inherit' }
	);

	console.log('✅ SSL сертификаты созданы успешно!');
	console.log('📁 Файлы:');
	console.log('   - ssl/private-key.pem (приватный ключ)');
	console.log('   - ssl/certificate.pem (сертификат)');
	console.log('');
	console.log('⚠️  ВНИМАНИЕ: Это самоподписанные сертификаты для разработки!');
	console.log('   Для продакшена используйте настоящие SSL сертификаты.');
} catch (error) {
	console.error('❌ Ошибка при создании сертификатов:', error.message);
	console.log('');
	console.log('💡 Альтернативный способ:');
	console.log('   1. Установите OpenSSL');
	console.log('   2. Или используйте ngrok для туннелирования');
	console.log("   3. Или используйте Let's Encrypt для продакшена");
}
