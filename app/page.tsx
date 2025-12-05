'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  userCount: number
  postCount: number
  publishedCount: number
  recentPosts: Array<{
    id: string
    title: string
    views: number
    createdAt: string
    author: { name: string | null }
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Laden...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Fout bij laden van data</div>
      </div>
    )
  }

  const chartData = stats.recentPosts.map(post => ({
    name: post.title.substring(0, 20) + '...',
    views: post.views
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Totaal Gebruikers</div>
            <div className="text-3xl font-bold text-blue-600">{stats.userCount}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Totaal Posts</div>
            <div className="text-3xl font-bold text-green-600">{stats.postCount}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Gepubliceerd</div>
            <div className="text-3xl font-bold text-purple-600">{stats.publishedCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Post Views</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recente Posts</h2>
          <div className="space-y-4">
            {stats.recentPosts.map(post => (
              <div key={post.id} className="border-b pb-4 last:border-b-0">
                <div className="font-medium text-gray-900">{post.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Door {post.author.name || 'Onbekend'} • {post.views} views • {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}