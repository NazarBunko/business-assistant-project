# Admin Panel Documentation

## Огляд

Повноцінна адмін-панель для управління всією платформою Business Assistant. Адмін має технічні права на управління, але **не має доступу до фінансових даних компаній** (транзакції, інвойси, податки).

## Функціонал

### 1. Dashboard (Статистика)

**URL**: `/admin/dashboard`

**Що показує:**
- 📊 Загальна кількість компаній
- 👥 Загальна кількість користувачів
- ✅ Активні користувачі
- 🚫 Заблоковані користувачі
- 📈 Нові компанії за місяць
- 📈 Нові користувачі за місяць
- 🎫 Відкриті тікети підтримки
- 📊 Загальна кількість транзакцій (без деталей)

### 2. Users Management (Управління користувачами)

**URL**: `/admin/users`

**Можливості:**
- 📋 Перегляд списку всіх користувачів
- 🔍 Пошук по імені, email, телефону
- 🔒 Блокування користувачів
- 🔓 Розблокування користувачів
- 🗑️ Видалення користувачів (крім ADMIN)
- 👁️ Перегляд інформації:
  - Ім'я та прізвище
  - Email і телефон
  - Роль (OWNER/ADMIN/EMPLOYEE)
  - Компанія
  - Статус (Active/Blocked)
  - Кількість тікетів підтримки

**Обмеження:**
- ❌ Не можна блокувати адмінів
- ❌ Не можна видаляти адмінів

### 3. Support Tickets (Тікети підтримки)

**URL**: `/admin/support`

**Можливості:**
- 📋 Перегляд всіх тікетів підтримки
- 🔍 Фільтрація по статусу:
  - OPEN (Відкритий)
  - IN_PROGRESS (В роботі)
  - RESOLVED (Вирішено)
  - CLOSED (Закритий)
- 📊 Перегляд деталей тікета:
  - Інформація про користувача
  - Оригінальне повідомлення
  - Історія відповідей
  - Пріоритет (LOW/MEDIUM/HIGH/URGENT)
- 💬 Відправка відповідей користувачу
- 🎯 Зміна статусу тікета
- ⚡ Зміна пріоритету
- 🗑️ Видалення тікета

**Автоматика:**
- ✅ Коли адмін відправляє першу відповідь, статус автоматично змінюється на IN_PROGRESS
- ✅ Всі звернення з профілю автоматично створюють тікет
- ✅ Email адміну + тікет в системі

## Доступ

### Як увійти в адмін-панель:

1. **URL**: `http://localhost:3000/admin` або `http://localhost:3000/admin/login`
2. **Логін**: Email користувача з роллю `ADMIN`
3. **Пароль**: Ваш пароль

### Створення адміна:

```sql
-- Вручну в базі даних змінити роль користувача
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Або при реєстрації першого власника можна тимчасово змінити роль в коді.

## Ізоляція даних

### ✅ Що адмін БАЧИТЬ:

- Список компаній (назва, дата створення, кількість користувачів)
- Користувачів всіх компаній
- Тікети підтримки
- Загальна статистика (кількість транзакцій)

### ❌ Що адмін НЕ БАЧИТЬ:

- Деталі транзакцій компаній
- Баланси компаній
- Інвойси
- Податкові звіти
- Зарплати співробітників
- Фінансові операції

**Принцип**: Адмін управляє технічною частиною, але **не має доступу до комерційних даних бізнесів**.

## API Endpoints

### Dashboard

```http
GET /admin/dashboard/stats
Authorization: JWT (role: ADMIN)

Response:
{
  "totalCompanies": 10,
  "totalUsers": 45,
  "totalActiveUsers": 42,
  "totalBlockedUsers": 3,
  "totalTransactions": 1250,
  "openTickets": 5,
  "companiesThisMonth": 2,
  "usersThisMonth": 8
}
```

### Users Management

```http
GET /admin/users?page=1&search=john
Authorization: JWT (role: ADMIN)

POST /admin/users/:id/block
POST /admin/users/:id/unblock
DELETE /admin/users/:id
```

### Companies

```http
GET /admin/companies?page=1&search=company
GET /admin/companies/:id
```

### Support Tickets

```http
GET /admin/tickets?page=1&status=OPEN
GET /admin/tickets/:id
PATCH /admin/tickets/:id
  Body: { "status": "IN_PROGRESS", "priority": "HIGH" }
POST /admin/tickets/:id/responses
  Body: { "message": "Response text" }
DELETE /admin/tickets/:id
```

## Frontend Routes

| Route | Description | Protected |
|-------|-------------|-----------|
| `/admin` | Redirect to login | Public |
| `/admin/login` | Admin login page | Public |
| `/admin/dashboard` | Statistics dashboard | ADMIN only |
| `/admin/users` | Users management | ADMIN only |
| `/admin/support` | Support tickets | ADMIN only |

## Security

### Guards

**AdminGuard** - перевіряє що user.role === 'ADMIN'

```typescript
@UseGuards(AuthGuard('jwt'), AdminGuard)
```

### Middleware

Frontend middleware автоматично:
- Редіректить `/admin` → `/admin/login`
- Перевіряє JWT token для admin routes
- Не дає неавторизованим доступ

### Обмеження

1. **Блокування/видалення**: не можна застосувати до ADMIN
2. **Доступ до даних**: тільки метадані, без фінансів
3. **JWT Required**: всі admin endpoints захищені

## UI Features

### Design

- 🎨 Material-UI компоненти
- 🌑 Чорна тема для навбару
- 📊 Статистичні картки з іконками
- 📋 Таблиці з пагінацією
- 🔍 Пошук і фільтри
- 💬 Діалоги для деталей

### UX

- ✅ Автоматичний редірект після логіну
- ✅ Logout з очищенням cookies
- ✅ Loading states
- ✅ Error handling з Snackbar
- ✅ Confirmation dialogs
- ✅ Real-time updates після дій

## Database Schema

### SupportTicket

```prisma
model SupportTicket {
  id          String              @id @default(uuid())
  subject     String
  message     String
  status      SupportTicketStatus @default(OPEN)
  priority    SupportTicketPriority @default(MEDIUM)
  userId      String
  user        User                @relation(fields: [userId], references: [id])
  responses   SupportResponse[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}
```

### SupportResponse

```prisma
model SupportResponse {
  id        String   @id @default(uuid())
  message   String
  isAdmin   Boolean  @default(false)
  ticketId  String
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  createdAt DateTime @default(now())
}
```

### User Updates

Додано поле:
```prisma
isBlocked Boolean @default(false)
```

## Тестування

### 1. Створити адміна

```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@test.com';
```

### 2. Логін

1. Відкрити `http://localhost:3000/admin`
2. Ввести email та пароль адміна
3. Має перекинути на `/admin/dashboard`

### 3. Перевірити функції

- ✅ Dashboard показує статистику
- ✅ Users - список всіх користувачів
- ✅ Block/Unblock працює
- ✅ Support - тікети відображаються
- ✅ Можна відповідати на тікети
- ✅ Logout працює

## Production Checklist

- [ ] Змінити JWT_SECRET на production
- [ ] Налаштувати CORS для production domain
- [ ] Додати rate limiting для admin endpoints
- [ ] Логування admin дій (audit log)
- [ ] Email notifications для критичних тікетів
- [ ] Backup стратегія для support tickets
- [ ] Monitoring admin panel usage

## Troubleshooting

### "Admin access required"

- Перевірте що user має role = 'ADMIN'
- Перевірте що JWT token валідний
- Перелогіньтесь

### Тікети не відображаються

- Перевірте міграцію Prisma
- Перевірте що SupportTicket таблиця створена
- Перевірте що support service створює тікети

### 403 Forbidden

- JWT token відсутній або невалідний
- Роль не ADMIN
- Перелогіньтесь

## Future Enhancements

1. **Audit Log**: логування всіх admin дій
2. **Bulk Actions**: масове блокування/видалення
3. **Advanced Filters**: більше фільтрів для пошуку
4. **Export Data**: експорт списків в CSV/Excel
5. **System Logs**: перегляд логів сервера
6. **Email Templates**: налаштування шаблонів email
7. **Notifications**: push notifications для urgent tickets
8. **Reports**: детальні звіти по платформі
