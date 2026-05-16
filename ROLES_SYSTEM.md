# Roles System Documentation

## Система ролей

У проєкті існує **дві окремі системи ролей**:

### 1. Global Role (Глобальна роль)

**Поле**: `globalRole` в таблиці `User`

**Призначення**: Контроль доступу до адмін-панелі та глобальних функцій платформи

**Можливі значення**:
- `USER` (за замовчуванням) - звичайний користувач платформи
- `ADMIN` - системний адміністратор платформи

**Де використовується**:
- Доступ до адмін-панелі (`/admin/*`)
- `AdminGuard` перевіряє `globalRole === 'ADMIN'`
- Блокування/видалення користувачів (не можна з ADMIN)

**Встановлення**:
```sql
-- Зробити користувача адміном платформи
UPDATE "User" SET "globalRole" = 'ADMIN' WHERE email = 'admin@example.com';
```

### 2. Company Role (Роль в компанії)

**Поле**: `role` в таблиці `User`

**Призначення**: Контроль доступу до функцій компанії (зарплати, транзакції, податки)

**Можливі значення**:
- `OWNER` - власник компанії
- `ADMIN` - адміністратор компанії
- `EMPLOYEE` (за замовчуванням) - співробітник

**Де використовується**:
- Управління співробітниками
- Виплата зарплат і бонусів
- Податкові операції
- Налаштування компанії
- Транзакції

**Встановлення**:
- `OWNER` - автоматично при реєстрації компанії
- `EMPLOYEE` - автоматично при реєстрації через invite code
- `ADMIN` - вручну власником компанії (функція ще не реалізована)

## Порівняння

| Характеристика | Global Role | Company Role |
|----------------|-------------|--------------|
| **Поле в БД** | `globalRole` | `role` |
| **Scope** | Вся платформа | Конкретна компанія |
| **Значення** | USER, ADMIN | OWNER, ADMIN, EMPLOYEE |
| **За замовчуванням** | USER | EMPLOYEE |
| **Призначення** | Адмін-панель | Бізнес-функції |
| **JWT payload** | `globalRole` | `role` |

## Приклади сценаріїв

### Сценарій 1: Звичайний власник компанії

```json
{
  "globalRole": "USER",
  "role": "OWNER",
  "companyId": "abc-123"
}
```

- ✅ Може керувати своєю компанією
- ✅ Виплачувати зарплати
- ✅ Управляти співробітниками
- ❌ Не має доступу до `/admin`

### Сценарій 2: Співробітник компанії

```json
{
  "globalRole": "USER",
  "role": "EMPLOYEE",
  "companyId": "abc-123"
}
```

- ✅ Може бачити свій профіль
- ✅ Використовувати чат
- ❌ Не може виплачувати зарплати
- ❌ Не має доступу до `/admin`

### Сценарій 3: Системний адміністратор (без компанії)

```json
{
  "globalRole": "ADMIN",
  "role": "EMPLOYEE",
  "companyId": null
}
```

- ✅ Повний доступ до `/admin`
- ✅ Управління користувачами
- ✅ Перегляд тікетів підтримки
- ❌ Не може керувати компаніями як власник

### Сценарій 4: Адміністратор з компанією

```json
{
  "globalRole": "ADMIN",
  "role": "OWNER",
  "companyId": "abc-123"
}
```

- ✅ Повний доступ до `/admin`
- ✅ Може керувати своєю компанією
- ✅ Управління всіма користувачами платформи

## Backend Implementation

### Admin Guard

```typescript
// apps/api/src/auth/guards/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = request.user;
    
    if (user.globalRole !== 'ADMIN') {
      throw new ForbiddenException('Admin privileges required');
    }
    
    return true;
  }
}
```

### Company Role Checks

```typescript
// Приклад з company.service.ts
async paySalary(companyId: string, userId: string, userRole: string) {
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    throw new ForbiddenException('Only OWNER or ADMIN can pay salaries');
  }
  // ...
}
```

### JWT Strategy

```typescript
async validate(payload: any) {
  return {
    id: payload.sub,
    email: payload.email,
    globalRole: payload.globalRole,  // Глобальна роль
    role: payload.role,              // Роль в компанії
    companyId: payload.companyId,
  };
}
```

## Frontend Implementation

### Admin Panel Check

```typescript
// apps/web/src/app/admin/layout.tsx
const user = JSON.parse(userStr);
if (user.globalRole !== "ADMIN") {
  router.push("/admin/login");
}
```

### Company Role Check

```typescript
// apps/web/src/app/[locale]/(protected)/employees/page.tsx
const canEdit = userRole === "OWNER" || userRole === "ADMIN";

{canEdit && (
  <Button onClick={handlePaySalary}>Pay Salary</Button>
)}
```

## Database Schema

```prisma
model User {
  id         String      @id @default(uuid())
  email      String      @unique
  globalRole GlobalRole  @default(USER)    // Глобальна роль
  role       UserRole    @default(EMPLOYEE) // Роль в компанії
  companyId  String?
  // ...
}

enum GlobalRole {
  USER
  ADMIN
}

enum UserRole {
  OWNER
  ADMIN
  EMPLOYEE
}
```

## Migration

Міграція автоматично додала поле `globalRole` з значенням `USER` для всіх існуючих користувачів.

```sql
-- Migration: 20260515205930_add_global_role
ALTER TABLE "User" ADD COLUMN "globalRole" TEXT NOT NULL DEFAULT 'USER';
```

## Створення адміністратора

### Варіант 1: Через SQL

```sql
UPDATE "User" 
SET "globalRole" = 'ADMIN' 
WHERE email = 'admin@example.com';
```

### Варіант 2: Через Prisma Studio

```bash
cd packages/database
pnpm studio
# Відкрити http://localhost:5555
# Знайти User -> Змінити globalRole на ADMIN
```

## API Endpoints Permissions

### Admin Endpoints (потрібен globalRole = ADMIN)

```
GET    /admin/dashboard/stats
GET    /admin/users
POST   /admin/users/:id/block
POST   /admin/users/:id/unblock
DELETE /admin/users/:id
GET    /admin/companies
GET    /admin/tickets
PATCH  /admin/tickets/:id
POST   /admin/tickets/:id/responses
```

### Company Endpoints (потрібен role = OWNER або ADMIN)

```
POST   /company/employees/:id/pay-salary
POST   /company/employees/:id/pay-bonus
PATCH  /company/employees/:id
DELETE /company/employees/:id
POST   /company/tax/calculate
POST   /company/tax/pay
PATCH  /company/:id/settings
```

## Testing

### Test 1: Звичайний користувач не може увійти в admin

```bash
# 1. Зареєструвати користувача
# 2. Спробувати увійти на /admin
# Результат: "Admin access required"
```

### Test 2: Адмін може увійти

```sql
UPDATE "User" SET "globalRole" = 'ADMIN' WHERE email = 'test@test.com';
```

```bash
# 1. Увійти на /admin
# Результат: Dashboard відкривається
```

### Test 3: Адмін не може блокувати інших адмінів

```bash
# 1. Увійти як ADMIN
# 2. Спробувати заблокувати іншого ADMIN
# Результат: "Cannot block admin users"
```

## Best Practices

1. **Розділяйте ролі**: не плутайте `globalRole` з `role`
2. **Мінімум адмінів**: тільки довірені люди з `globalRole = ADMIN`
3. **Лог дій**: логуйте всі дії адмінів (TODO)
4. **Регулярний аудит**: перевіряйте список адмінів
5. **2FA для адмінів**: додаткова безпека (TODO)

## Troubleshooting

### "Admin access required" при логіні

```sql
-- Перевірити globalRole
SELECT email, "globalRole", role FROM "User" WHERE email = 'ваш-email';

-- Якщо USER, змінити на ADMIN
UPDATE "User" SET "globalRole" = 'ADMIN' WHERE email = 'ваш-email';
```

### Не можу блокувати користувача

Перевірте чи користувач не має `globalRole = ADMIN`. Адмінів заблокувати неможливо.

### JWT token не має globalRole

Перелогіньтесь. Старі токени створені до міграції не містять `globalRole`.

## Future Enhancements

- [ ] UI для встановлення Company ADMIN ролі
- [ ] Audit log для дій адмінів
- [ ] Multiple global roles (SUPER_ADMIN, MODERATOR)
- [ ] Role-based permissions system
- [ ] 2FA для admin accounts
