export const useAuth = () => {
  const isLoggedIn = useState('auth:loggedIn', () => false)
  const user = useState<{ firstName: string; lastName: string; email: string } | null>('auth:user', () => null)

  function login(email: string, password: string): boolean {
    if (email === 'test@itocook.com' && password === '123456') {
      user.value = { firstName: 'Alex', lastName: 'Test', email }
      isLoggedIn.value = true
      return true
    }
    return false
  }

  function logout() {
    isLoggedIn.value = false
    user.value = null
  }

  return { isLoggedIn, user, login, logout }
}
