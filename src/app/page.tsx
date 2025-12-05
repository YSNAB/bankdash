'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // TODO: Implement login logic
    console.log('Login attempt:', { username, password })
    
    // Example: You'll implement actual authentication later
    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg px-8 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Welcome Back</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium py-2.5 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Users are managed by administrators
          </div>
        </div>
      </div>
    </div>
  )
}

