import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getHeaders(isMultipart = false): Promise<HeadersInit> {
  const headers: Record<string, string> = {}
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json'
  }
  
  // Get active session and inject JWT bearer token
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

async function handleError(response: Response, defaultMessage: string): Promise<never> {
  let errorMsg = ''
  try {
    const jsonError = await response.json()
    if (typeof jsonError.detail === 'string') {
      errorMsg = jsonError.detail
    } else if (Array.isArray(jsonError.detail)) {
      // Map FastAPI validation errors (e.g., ["body", "image"] -> "body.image: field required")
      errorMsg = jsonError.detail
        .map((err: any) => {
          const location = Array.isArray(err.loc) ? err.loc.join('.') : 'payload'
          return `${location}: ${err.msg}`
        })
        .join(', ')
    } else if (jsonError.error) {
      errorMsg = jsonError.error
    } else {
      errorMsg = JSON.stringify(jsonError)
    }
  } catch {
    try {
      errorMsg = await response.text()
    } catch {
      errorMsg = defaultMessage
    }
  }
  
  throw new Error(errorMsg || defaultMessage)
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await getHeaders()
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      await handleError(response, `API GET request failed with status ${response.status}`)
    }
    
    return response.json()
  },

  async post<T>(endpoint: string, body: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await getHeaders()
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      await handleError(response, `API POST request failed with status ${response.status}`)
    }
    
    return response.json()
  },

  async patch<T>(endpoint: string, body: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await getHeaders()
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      await handleError(response, `API PATCH request failed with status ${response.status}`)
    }
    
    return response.json()
  },

  async postMultipart<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await getHeaders(true) // Skip application/json for boundary setup
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })
    
    if (!response.ok) {
      await handleError(response, `Multipart upload failed with status ${response.status}`)
    }
    
    return response.json()
  }
}
