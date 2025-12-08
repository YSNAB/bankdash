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

### Handy

run `npx tsx scripts/add-user.ts` to add user for this application. 
