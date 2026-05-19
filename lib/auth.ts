// Mock authentication with localStorage persistence
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// Mock user accounts
const MOCK_USERS = [
  { id: '1', email: 'admin@swingplay.com', password: 'admin123', name: 'Admin User', role: 'admin' as const },
  { id: '2', email: 'manager@swingplay.com', password: 'manager123', name: 'Venue Manager', role: 'manager' as const },
  { id: '3', email: 'staff@swingplay.com', password: 'staff123', name: 'Staff Member', role: 'manager' as const },
]

const SESSION_KEY = 'swing_session'

export function login(email: string, password: string): User | null {
  const user = MOCK_USERS.find((u) => u.email === email && u.password === password)
  if (user) {
    const { password, ...userWithoutPassword } = user
    localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword))
    return userWithoutPassword
  }
  return null
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): User | null {
  try {
    const session = localStorage.getItem(SESSION_KEY)
    return session ? JSON.parse(session) : null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}
