import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname
      const isPublicRoute = pathname === '/' || pathname.startsWith('/onboarding')

      if (!isPublicRoute) {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default client
