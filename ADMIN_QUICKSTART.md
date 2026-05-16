# Admin Panel - Quick Start

## Швидкий запуск за 3 кроки

### 1. База даних вже готова ✅

Міграція вже застосована! Якщо потрібно перезапустити:

```bash
cd packages/database
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

### 2. Створити адміна

**⚠️ ВАЖЛИВО**: Є дві окремі ролі!
- `globalRole` - для доступу до адмін-панелі (USER/ADMIN)
- `role` - для ролі в компанії (OWNER/ADMIN/EMPLOYEE)

**Варіант А: Через SQL (Рекомендовано)**

```sql
-- Підключитись до PostgreSQL
psql -U admin -d crm_database -h localhost

-- Змінити ГЛОБАЛЬНУ роль існуючого користувача на ADMIN
UPDATE "User" 
SET "globalRole" = 'ADMIN' 
WHERE email = 'ваш-email@example.com';

-- Або створити нового адміна
INSERT INTO "User" (id, email, phone, password, "fullName", "globalRole", role, "createdAt", "updatedAt", "isBlocked")
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '+380123456789',
  '$2a$10$YourHashedPasswordHere',
  'Admin User',
  'ADMIN',
  'EMPLOYEE',
  NOW(),
  NOW(),
  false
);
```

**Варіант Б: Через Prisma Studio**

```bash
cd packages/database
pnpm studio
# Відкрити http://localhost:5555
# Знайти User таблицю
# Знайти свого користувача
# Змінити globalRole з USER на ADMIN
# Save
```

### 3. Запустити і увійти

```bash
# З кореня проєкту
pnpm dev
```

Відкрити:
- **Admin Panel**: http://localhost:3000/admin
- **Login**: використати email і пароль адміна

## Що тестувати

### Dashboard
✅ Статистика відображається
✅ Картки з числами
✅ Навігація працює

### Users
✅ Список користувачів
✅ Пошук працює
✅ Блокування/розблокування
✅ Видалення (крім ADMIN)

### Support
✅ Тікети відображаються
✅ Можна відкрити деталі
✅ Відправка відповіді
✅ Зміна статусу/пріоритету

## Швидкі команди

```bash
# Запустити все
pnpm dev

# Тільки API
pnpm --filter api dev

# Тільки Web
pnpm --filter web dev

# База даних
docker compose up -d

# Prisma Studio (переглянути дані)
cd packages/database && pnpm studio

# Створити тестового адміна через Prisma Studio
# 1. Відкрити http://localhost:5555
# 2. Знайти User таблицю
# 3. Змінити role на ADMIN
```

## Структура файлів

```
Backend (API):
├── src/admin/
│   ├── admin.controller.ts    # API endpoints
│   ├── admin.service.ts        # Логіка
│   ├── admin.module.ts
│   └── dto/                    # Валідація
├── src/auth/guards/
│   └── admin.guard.ts          # Перевірка ролі
└── src/support/
    └── support.service.ts      # Створення тікетів

Frontend (Web):
├── src/app/admin/
│   ├── login/page.tsx          # Логін
│   ├── dashboard/page.tsx      # Dashboard
│   ├── users/page.tsx          # Users
│   ├── support/page.tsx        # Support
│   └── layout.tsx              # Admin layout
└── src/middleware.ts           # Route protection

Database:
└── packages/database/prisma/
    └── schema.prisma           # SupportTicket models
```

## Поширені проблеми

### Cannot connect to database
```bash
docker compose up -d
```

### Prisma Client not found
```bash
cd packages/database
pnpm db:generate
```

### Migration pending
```bash
cd packages/database
pnpm exec prisma migrate deploy
```

### Admin access denied
```sql
-- Перевірити ГЛОБАЛЬНУ роль (не компанії!)
SELECT email, "globalRole", role FROM "User" WHERE email = 'ваш-email';

-- Змінити ГЛОБАЛЬНУ роль на ADMIN
UPDATE "User" SET "globalRole" = 'ADMIN' WHERE email = 'ваш-email';
```

### Port 3000/3001 already in use
```bash
# Знайти процес
lsof -i :3000
lsof -i :3001

# Вбити
kill -9 <PID>
```

## Endpoints для тестування

### Test Dashboard Stats
```bash
curl http://localhost:3001/admin/dashboard/stats \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"
```

### Test Users List
```bash
curl http://localhost:3001/admin/users?page=1 \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"
```

### Test Support Tickets
```bash
curl http://localhost:3001/admin/tickets?page=1 \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"
```

## Готово! 🎉

Адмін-панель повністю функціональна:
- ✅ Dashboard з статистикою
- ✅ Управління користувачами
- ✅ Система підтримки з тікетами
- ✅ Захищено JWT + Admin Guard
- ✅ Красивий UI з Material-UI

Для деталей дивіться `ADMIN_PANEL.md`
