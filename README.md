# Next.js + Prisma Project

A full-stack Next.js application with Prisma ORM, TypeScript, and Tailwind CSS.

## Features

- ⚡ **Next.js 15** with App Router
- 🗄️ **Prisma ORM** for database management
- 🎨 **Tailwind CSS** for styling
- 📝 **TypeScript** for type safety
- 🔥 **ESLint** for code quality

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use Prisma's local dev database)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your database URL in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```


3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Run migrations to create database tables:
```bash
npx prisma migrate dev --name init
```

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Database Management

### View your database in Prisma Studio:
```bash
npx prisma studio
```

### Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

### Push schema changes without migration:
```bash
npx prisma db push
```

## API Routes

### GET /api/users
Fetch all users with their posts.

### POST /api/users
Create a new user.

Request body:
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

## Database Schema

The project includes two example models:

- **User**: Represents application users (id, email, name, timestamps)
- **Post**: Represents user posts (id, title, content, published, authorId, timestamps)

Customize these models in `prisma/schema.prisma` based on your needs.

## Receipt Printer Integration

### System Behavior

The POS system **automatically uses the default printer** set in your operating system. When you print a receipt:

1. The system connects to QZ Tray
2. It queries for the current default printer
3. It sends the receipt to that printer

**Changing Default Printer**: If you change the default printer in your OS, the POS will automatically use the new default printer on the next print - no restart required.

### Prerequisites

- **QZ Tray** must be installed and running
- Printer must support **ESC/POS** commands (most thermal receipt printers do)
- Certificates must be configured in environment variables

### Quick Start

1. Install QZ Tray from https://qz.io/download/
2. Generate certificates (see DEPLOYMENT.md)
3. Add to `.env.local`:
```env
QZ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
QZ_CERTIFICATE="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```
4. Set your desired printer as the default in your OS
5. Start the POS - it will automatically detect and use it

### Troubleshooting Printer Issues

**Problem**: "Printer not found" error
- Check QZ Tray is running (icon in system tray)
- Ensure a printer is set as default in your OS
- Verify printer is powered on and connected

**Problem**: Wrong printer is being used
- Check which printer is set as **default** in your OS
- The POS always uses the default printer
- Change the default printer in OS settings, then try printing again

**Problem**: Print preview appears instead of printing
- Your default "printer" is set to "Microsoft Print to PDF" or similar
- Set a physical printer as default in OS settings

For more details, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Prisma Documentation](https://www.prisma.io/docs) - learn about Prisma ORM.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Don't forget to add your `DATABASE_URL` environment variable in your deployment settings!

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Handy
 
### Add user to development database (uses .env.local)
npx tsx scripts/add-user.ts

### Add user to production database (uses .env.production.local)
$env:NODE_ENV="production"; npx tsx scripts/add-user.ts

### Database

#### Development
npm run dev  # Uses .env.local automatically

#### Production build
npm run build  # Uses .env.production.local if it exists

#### Run migrations in development
npx prisma migrate dev --name your_migration_name

#### Deploy migrations to production
$env:NODE_ENV="production"; npx prisma migrate deploy

#### View database in development
npx prisma studio

# DEVELOPMENT (uses .env.local)
npm run dev                         # Run dev server
npx prisma migrate dev              # Create & apply migration
npx prisma studio                   # Database GUI
npx prisma db push                  # Quick schema sync (no migration file)
npx prisma migrate reset            # Reset & reseed database

# PRODUCTION (uses .env.production.local)
$env:NODE_ENV="production"; npx prisma migrate deploy  # Apply pending migrations
$env:NODE_ENV="production"; npx prisma migrate status  # Check migration status