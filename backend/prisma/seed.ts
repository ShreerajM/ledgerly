// Demo data: 22 users and 50 transactions. Timestamps are relative to "now", so the dashboard always looks current.
// Demo passwords: admins use Admin@123, everyone else uses Password@123.
// Run with: npm run db:seed   (or npm run db:reset to rebuild the whole database first)
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import type { TransactionStatus, UserRole } from '../src/generated/prisma/enums.ts'
import { hashPassword } from '../src/lib/password.ts'

// Demo data is for demos. In production it needs an explicit opt-in (the Docker demo stack sets SEED_DEMO_DATA=true).
if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_DATA !== 'true') {
  console.error('Refusing to seed demo data in production. Set SEED_DEMO_DATA=true if you really want it.')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env first.')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const UNIT_MS = { d: 86_400_000, h: 3_600_000, m: 60_000 } as const
/** "57d 4h" -> the moment that long ago. */
function ago(age: string): Date {
  let ms = 0
  for (const [, amount, unit] of age.matchAll(/(\d+)([dhm])/g))
    ms += Number(amount) * UNIT_MS[unit as keyof typeof UNIT_MS]
  return new Date(Date.now() - ms)
}

// name, email, role, active, last login (null = never), joined
const USERS: [string, string, UserRole, boolean, string | null, string][] = [
  ['Asha Verma', 'asha@example.com', 'admin', true, '3h', '120d'],
  ['Rohan Deshmukh', 'rohan@example.com', 'admin', true, '1d', '118d'],
  ['Meera Kulkarni', 'meera@example.com', 'user', true, '2d', '110d'],
  ['Farah Sheikh', 'farah@example.com', 'user', true, '1d', '104d'],
  ['Arjun Naik', 'arjun@example.com', 'user', true, '2d', '99d'],
  ['Sneha Patil', 'sneha@example.com', 'user', true, '5h', '97d'],
  ['Kabir Joshi', 'kabir@example.com', 'user', true, '3d', '95d'],
  ['Isha Rane', 'isha@example.com', 'user', true, '2d', '90d'],
  ['Vikram More', 'vikram@example.com', 'user', true, '4d', '88d'],
  ['Nisha Gawande', 'nisha@example.com', 'user', true, '1d', '85d'],
  ['Aditya Pawar', 'aditya@example.com', 'user', true, '6d', '80d'],
  ['Priya Mhatre', 'priya@example.com', 'user', true, '2d', '78d'],
  ['Sahil Khan', 'sahil@example.com', 'user', true, '9d', '60d'],
  ['Tanvi Gharat', 'tanvi@example.com', 'user', true, '12h', '75d'],
  ['Omkar Patil', 'omkar@example.com', 'user', true, '3d', '70d'],
  ['Riya Shah', 'riya@example.com', 'user', true, '1d', '66d'],
  ['Yash Thakur', 'yash@example.com', 'user', true, '15d', '40d'],
  ['Pooja Bhoir', 'pooja@example.com', 'user', false, '62d', '115d'],
  ['Nikhil Sawant', 'nikhil@example.com', 'user', false, '48d', '112d'],
  ['Anjali Kadam', 'anjali@example.com', 'user', false, '75d', '109d'],
  ['Harsh Mehta', 'harsh@example.com', 'user', false, '41d', '101d'],
  ['Divya Nair', 'divya@example.com', 'user', false, null, '30d'],
]

// email, amount, status, note, age. Oldest first so ids (and TXN references) increase with time.
// Sahil, Yash and the five inactive users have no transactions on purpose,
// so "users without transactions" has rows to find.
const TRANSACTIONS: [string, number, TransactionStatus, string, string][] = [
  ['kabir@example.com', 8450.0, 'success', '', '57d 4h'],
  ['sneha@example.com', 22100.0, 'success', 'Invoice INV-2011', '55d 9h'],
  ['meera@example.com', 3200.0, 'success', '', '54d 2h'],
  ['arjun@example.com', 15750.5, 'success', '', '52d 11h'],
  ['farah@example.com', 640.0, 'failed', 'Card declined', '51d 6h'],
  ['asha@example.com', 31000.0, 'success', 'Invoice INV-2019', '49d 3h'],
  ['rohan@example.com', 12800.0, 'success', '', '47d 14h'],
  ['isha@example.com', 4999.0, 'success', '', '46d 8h'],
  ['vikram@example.com', 27500.0, 'success', '', '44d 5h'],
  ['nisha@example.com', 1850.75, 'success', '', '43d 10h'],
  ['aditya@example.com', 9600.0, 'failed', 'Gateway timeout', '41d 7h'],
  ['priya@example.com', 18200.0, 'success', '', '40d 1h'],
  ['omkar@example.com', 5400.0, 'success', '', '38d 12h'],
  ['riya@example.com', 36900.0, 'success', 'Invoice INV-2027', '37d 9h'],
  ['tanvi@example.com', 2750.0, 'success', '', '35d 4h'],
  ['kabir@example.com', 14300.0, 'success', '', '34d 15h'],
  ['meera@example.com', 6100.0, 'success', '', '33d 6h'],
  ['sneha@example.com', 48000.0, 'success', 'Invoice INV-2031', '32d 2h'],
  ['arjun@example.com', 7250.0, 'success', '', '29d 8h'],
  ['farah@example.com', 19900.0, 'success', '', '28d 13h'],
  ['asha@example.com', 2400.0, 'success', '', '27d 5h'],
  ['rohan@example.com', 33500.0, 'failed', 'Gateway timeout', '26d 10h'],
  ['isha@example.com', 11250.0, 'success', '', '25d 3h'],
  ['vikram@example.com', 8800.0, 'success', '', '23d 16h'],
  ['nisha@example.com', 4100.0, 'success', '', '22d 7h'],
  ['aditya@example.com', 26700.0, 'success', 'Invoice INV-2038', '21d 11h'],
  ['priya@example.com', 1500.0, 'success', '', '20d 2h'],
  ['omkar@example.com', 15600.0, 'success', '', '18d 9h'],
  ['riya@example.com', 9300.0, 'failed', 'Card declined', '17d 14h'],
  ['tanvi@example.com', 21000.0, 'success', '', '16d 4h'],
  ['kabir@example.com', 3850.0, 'success', '', '15d 12h'],
  ['meera@example.com', 12950.0, 'success', '', '14d 6h'],
  ['sneha@example.com', 5600.0, 'success', '', '12d 17h'],
  ['arjun@example.com', 29400.0, 'success', 'Invoice INV-2044', '11d 8h'],
  ['farah@example.com', 7700.0, 'success', '', '10d 3h'],
  ['asha@example.com', 16400.0, 'success', '', '9d 11h'],
  ['rohan@example.com', 8250.0, 'success', '', '6d 19h'],
  ['isha@example.com', 21000.0, 'failed', 'Gateway timeout', '6d 2h'],
  ['vikram@example.com', 3675.5, 'success', '', '5d 7h'],
  ['nisha@example.com', 46900.0, 'success', 'Invoice INV-2049', '4d 15h'],
  ['aditya@example.com', 7450.0, 'failed', 'Card declined', '4d 1h'],
  ['priya@example.com', 5800.0, 'success', '', '3d 9h'],
  ['omkar@example.com', 18200.0, 'success', '', '2d 20h'],
  ['riya@example.com', 2999.0, 'failed', 'Gateway timeout', '2d 5h'],
  ['tanvi@example.com', 31500.0, 'success', '', '1d 18h'],
  ['kabir@example.com', 1250.0, 'failed', 'Card declined', '1d 6h'],
  ['meera@example.com', 12400.0, 'pending', '', '20h'],
  ['asha@example.com', 9800.0, 'pending', 'Invoice INV-2056', '11h'],
  ['sneha@example.com', 6400.0, 'pending', '', '5h'],
  ['farah@example.com', 15000.0, 'pending', '', '90m'],
]

try {
  if ((await prisma.user.count()) > 0) {
    console.log('Database already has users, skipping seed. Run `npm run db:reset` to start over.')
  } else {
    const [adminHash, userHash] = await Promise.all([hashPassword('Admin@123'), hashPassword('Password@123')])

    const users = await prisma.user.createManyAndReturn({
      data: USERS.map(([name, email, role, isActive, lastLogin, joined]) => ({
        name,
        email,
        role,
        isActive,
        passwordHash: role === 'admin' ? adminHash : userHash,
        lastLoginAt: lastLogin ? ago(lastLogin) : null,
        createdAt: ago(joined),
      })),
      select: { id: true, email: true },
    })
    const idByEmail = new Map(users.map((u) => [u.email, u.id]))

    await prisma.transaction.createMany({
      data: TRANSACTIONS.map(([email, amount, status, note, age]) => {
        const userId = idByEmail.get(email)
        if (userId === undefined) throw new Error(`Seed data references unknown user ${email}`)
        return { userId, amount: amount.toFixed(2), status, note, createdAt: ago(age) }
      }),
    })

    console.log(`Seeded ${USERS.length} users and ${TRANSACTIONS.length} transactions.`)
  }
} finally {
  await prisma.$disconnect()
}
