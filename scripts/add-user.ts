// Script to add a new user to the database
// Run with: npx tsx scripts/add-user.ts

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import * as readline from 'readline'
import { config } from 'dotenv'

// Load environment-specific .env file
const isProduction = process.env.NODE_ENV === "production"
const envFile = isProduction ? ".env.production.local" : ".env.local"
config({ path: envFile })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

async function addUser() {
  try {
    console.log('\n=== Add New User ===\n')

    const username = await question('Username: ')
    const name = await question('Full Name (optional): ')
    const password = await question('Password: ')
    const roleInput = await question('Role (ADMIN/EMPLOYEE) [EMPLOYEE]: ')
    const pinInput = await question('PIN for POS login (4-6 digits, optional): ')

    if (!username || !password) {
      console.error('\nError: Username and password are required!')
      process.exit(1)
    }

    // Validate and set role
    const role = roleInput.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'

    // Validate PIN if provided
    let hashedPin = null
    if (pinInput && pinInput.trim()) {
      if (!/^\d{4,6}$/.test(pinInput.trim())) {
        console.error('\nError: PIN must be 4-6 digits!')
        process.exit(1)
      }
      const saltRounds = 10
      hashedPin = await bcrypt.hash(pinInput.trim(), saltRounds)
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create the user
    const user = await prisma.user.create({
      data: {
        username,
        name: name || null,
        password: hashedPassword,
        pin: hashedPin,
        role: role
      }
    })

    console.log('\n✓ User created successfully!')
    console.log(`  ID: ${user.id}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Name: ${user.name || 'N/A'}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  PIN: ${hashedPin ? 'Set ✓' : 'Not set'}`)
    console.log(`  Created: ${user.createdAt}\n`)

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('\nError: Username already exists!')
    } else {
      console.error('\nError creating user:', error.message)
    }
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

addUser()
