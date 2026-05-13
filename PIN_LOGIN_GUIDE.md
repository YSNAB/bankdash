# PIN Login Setup Guide

## Overview

The system now supports **two login methods**:

1. **Username + Password** - For admin access (Dashboard, Products, Orders, etc.)
2. **PIN Code** - For POS terminal access (fast employee login)

## Quick Start

### 1. Create a User with PIN

Run the add-user script:

```bash
npx tsx scripts/add-user.ts
```

Example:
```
Username: john
Full Name (optional): John Doe
Password: secure123
Role (ADMIN/EMPLOYEE) [EMPLOYEE]: EMPLOYEE
PIN for POS login (4-6 digits, optional): 1234
```

**Important**: 
- PIN must be 4-6 digits
- PIN is optional (users without PIN can only use username/password login)
- PIN is hashed with bcrypt for security

### 2. Access POS Login

**For POS Employees:**
- Navigate to: `http://localhost:3000/pos/login`
- Select your user from the grid
- Enter your PIN using the number pad
- Click "Login"

**For Admin Access:**
- Navigate to: `http://localhost:3000/`
- Use username + password (traditional login)

## Security Features

### Account Lockout
- **5 failed attempts** → Account locked for 5 minutes
- Failed attempts are tracked per user
- Lock timer shown in error message

### PIN Security
- PINs are hashed with bcrypt (same as passwords)
- Never stored in plain text
- Cannot be retrieved, only reset

### Login Protection
- Real-time attempt counter
- Locked accounts cannot login
- Clear error messages for users

## User Management

### Add PIN to Existing User

You'll need to update the user directly in the database or create a management page.

**Option 1: Using Prisma Studio**
```bash
npx prisma studio
```
1. Open the User table
2. Find your user
3. Set the `pin` field to a hashed value

**Option 2: Create new user with PIN** (recommended)
```bash
npx tsx scripts/add-user.ts
```

### Remove PIN from User

Set the `pin` field to `null` in the database. User will no longer appear on POS login page.

## URL Structure

| URL | Purpose | Login Method | Redirects To |
|-----|---------|-------------|-------------|
| `/` | Admin login page | Username + Password | `/dashboard` |
| `/pos/login` | POS employee login | User selection + PIN | `/pos` |
| `/pos` | POS terminal | Requires auth | `/pos/login` if not logged in |
| `/dashboard` | Admin dashboard | Requires auth | `/` if not logged in |
| `/products` | Product management | Requires admin | `/` if not logged in |
| `/orders` | Order management | Requires admin | `/` if not logged in |

## Authentication Flow

### Role-Based Access Control

**EMPLOYEE Role:**
- ✅ Can access: `/pos`, `/pos/login`
- ❌ Cannot access: `/dashboard`, `/products`, `/orders`, `/customers`, `/purchases`
- If employee tries to access admin page → Alert + Redirect to `/pos`

**ADMIN Role:**
- ✅ Can access: Everything (all pages)
- Can use both login methods (username/password OR PIN)
- Full access to admin dashboard and POS terminal

### New Separated Flow (Current)

**POS Path (EMPLOYEE + ADMIN):**
1. User visits `/pos` → Not logged in → Redirects to `/pos/login`
2. Select user from grid → Enter PIN → Login
3. Success → Redirects to `/pos` (POS terminal)
4. Both ADMIN and EMPLOYEE can access POS

**Admin Path (ADMIN ONLY):**
1. User visits `/dashboard` (or any admin page) → Not logged in → Redirects to `/`
2. Enter username + password → Login
3. If EMPLOYEE role → **Access Denied Alert** → Redirect to `/pos`
4. If ADMIN role → Success → Access granted
5. User can access all admin pages

**Security:**
- All admin pages (`/dashboard`, `/products`, `/orders`, `/customers`, `/purchases`) use `requireAdmin()`
- EMPLOYEE users are automatically redirected to `/pos` with a clear message
- `/pos` uses `requirePOSAuth()` which allows both roles

**Key Differences from Old Flow:**
- ❌ No automatic role-based redirect
- ✅ `/pos` always requires `/pos/login` (PIN-based)
- ✅ Admin pages always require `/` (username/password)
- ✅ After login, system doesn't decide where to go based on role
- ✅ Users choose their destination by which login page they use

## Workflow

### POS Employee Login Flow:
1. Open POS terminal → Redirects to `/pos/login`
2. See all users with PINs configured
3. Click user card
4. Enter PIN on number pad
5. Successful login → Redirect to `/pos`
6. Failed login → Show attempts remaining
7. Too many fails → Lock account for 5 minutes

### Admin Login Flow:
1. Go to `/` (root)
2. Enter username + password
3. Successful login → Redirect to `/dashboard`
4. POS employees can also use this method if needed

## Database Schema

```prisma
model User {
  id             String    @id @default(cuid())
  username       String    @unique
  password       String    // Hashed password
  pin            String?   // Hashed PIN (4-6 digits)
  name           String?
  role           UserRole  @default(EMPLOYEE)
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

## Troubleshooting

### User Not Showing on POS Login Page
- Check if user has a PIN configured (`pin` field not null)
- Run: `npx prisma studio` to verify

### Account Locked
- Wait 5 minutes for automatic unlock
- Or manually set `lockedUntil` to `null` in database

### Forgot PIN
- PINs cannot be retrieved (they're hashed)
- Create a new user or update PIN in database
- Option: Create a "Reset PIN" admin feature

### Login Fails Immediately
- Check if account is locked (`lockedUntil` in future)
- Verify PIN was set correctly (only digits, 4-6 length)
- Check browser console for errors

## Production Recommendations

1. **Use strong PINs**: Avoid 0000, 1234, etc.
2. **Regular audits**: Monitor failed login attempts
3. **Session timeout**: Auto-logout after inactivity
4. **HTTPS only**: Never use PIN login over HTTP
5. **Physical security**: POS terminal should be in secure location
6. **Camera coverage**: Consider surveillance of POS area
7. **Training**: Teach employees not to share PINs

## API Endpoints

### GET `/api/auth/users`
Returns list of users with PINs configured (for login page)

Response:
```json
[
  {
    "id": "abc123",
    "name": "John Doe",
    "role": "EMPLOYEE",
    "isLocked": false
  }
]
```

### POST `/api/auth/pin-login`
Authenticates user with PIN

Request:
```json
{
  "userId": "abc123",
  "pin": "1234"
}
```

Response (success):
```json
{
  "user": {
    "id": "abc123",
    "username": "john",
    "name": "John Doe",
    "role": "EMPLOYEE"
  }
}
```

Response (failure):
```json
{
  "error": "Invalid PIN. 3 attempts remaining.",
  "attemptsRemaining": 3
}
```

## Migration

The database migration `20260225120941_add_pin_login` adds:
- `pin` field (nullable string)
- `failedAttempts` field (default 0)
- `lockedUntil` field (nullable datetime)

Migration is already applied to development database.

For production:
```bash
$env:NODE_ENV="production"; npx prisma migrate deploy
```
