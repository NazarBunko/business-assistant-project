# Support Request Feature

## Що це?

Це система звернень користувачів до адміністратора через email. Користувачі можуть надіслати повідомлення з профілю, і воно автоматично прийде на пошту адміна з усією необхідною інформацією.

## Що надсилається в листі?

Коли користувач надсилає звернення, адміністратор отримує email з:

- ✅ Повне ім'я користувача
- ✅ Email користувача
- ✅ Телефон
- ✅ Назва компанії
- ✅ Посада
- ✅ Текст повідомлення

## Як налаштувати?

### 1. Встановити залежності

```bash
pnpm install
```

Це встановить `nodemailer` і його типи.

### 2. Налаштувати email

Відредагуйте файл `apps/api/.env`:

```env
ADMIN_EMAIL="your-admin@gmail.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
```

### 3. Для Gmail - створити App Password

⚠️ **Важливо**: НЕ використовуйте звичайний пароль Gmail!

1. Увімкніть 2-факторну автентифікацію: https://myaccount.google.com/security
2. Створіть App Password: https://myaccount.google.com/apppasswords
3. Виберіть "Mail" і "Other (Custom name)"
4. Назвіть "Business Assistant"
5. Скопіюйте згенерований пароль (16 символів)
6. Використайте його як `SMTP_PASS`

### 4. Перезапустити сервер

```bash
pnpm dev
```

## Як користуватися?

### Для користувача:

1. Увійти в систему
2. Перейти на сторінку **Профіль**
3. Прокрутити вниз до секції **"Звернення до адміністратора"**
4. Натиснути кнопку **"Звернутися до адміністратора"**
5. Написати повідомлення (до 2000 символів)
6. Натиснути **"Надіслати"**

### Для адміністратора:

Просто перевіряйте пошту, яку вказали в `ADMIN_EMAIL`. Листи приходять автоматично з темою:

```
Звернення від {Ім'я Користувача} ({Назва Компанії})
```

## Структура коду

### Backend (API)

```
apps/api/src/support/
├── dto/
│   └── create-support-request.dto.ts  # Валідація повідомлення
├── support.controller.ts              # Endpoint POST /support/request
├── support.service.ts                 # Логіка відправки email
└── support.module.ts                  # NestJS модуль
```

### Frontend (Web)

- `apps/web/src/app/[locale]/(protected)/profile/page.tsx` - Форма звернення

### Переклади

- `apps/web/languages/uk.json` - Українські тексти
- `apps/web/languages/en.json` - Англійські тексти

## API Endpoint

### POST `/support/request`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "message": "Ваше повідомлення тут"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Support request sent successfully"
}
```

**Response (Error)**:
```json
{
  "statusCode": 500,
  "message": "Failed to send support request"
}
```

## Можливі помилки

### "Failed to send support request"

**Причини:**
1. Не налаштовані SMTP credentials в `.env`
2. Невірний App Password для Gmail
3. Не увімкнена 2FA для Gmail
4. Заблокований порт 587 (спробуйте 465)

**Рішення:**
- Перевірте `.env` файл
- Для Gmail використовуйте App Password
- Перевірте консоль API на детальні помилки

### "SMTP credentials not configured"

Означає що у `.env` відсутні змінні:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

### "Admin email not configured"

Відсутня змінна `ADMIN_EMAIL` у `.env`.

## Безпека

✅ Захищено JWT authentication
✅ Валідація вхідних даних (max 2000 символів)
✅ Лише автентифіковані користувачі можуть надсилати
✅ Email credentials в .env (не в коді)

## Інші email провайдери

### Outlook
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
```

### Yahoo
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT=587
```

### Власний SMTP
```env
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
```

## Для Production

Для продакшн середовища рекомендую:

1. **Використовувати спеціалізований сервіс**:
   - SendGrid
   - Mailgun
   - AWS SES
   - Postmark

2. **Додати rate limiting** (обмеження кількості запитів)

3. **Використовувати черги** (Bull/BullMQ) для надійності

4. **Налаштувати SPF/DKIM/DMARC** для кращої доставки

Детальніше дивіться у файлі `EMAIL_SETUP.md`.
