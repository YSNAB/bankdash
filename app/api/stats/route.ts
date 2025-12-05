import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [userCount, postCount, publishedCount, recentPosts] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { author: true }
      })
    ])

    return NextResponse.json({
      userCount,
      postCount,
      publishedCount,
      recentPosts
    })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}