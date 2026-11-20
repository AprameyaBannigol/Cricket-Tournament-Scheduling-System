export class ApiError extends Error {
  constructor(status, message, issues = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

export async function requestJson(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const verb = method.toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(verb)) {
    const csrf = await ensureCsrfToken()
    if (csrf) headers['X-XSRF-TOKEN'] = csrf
  }

  let response
  try {
    response = await fetch(path, {
      method,
      headers,
      signal,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, 'Could not reach the tournament server. Check your connection and try again.')
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new ApiError(response.status,
      problem?.detail || problem?.message || `The server returned an error (${response.status}).`,
      Array.isArray(problem?.issues) ? problem.issues : [])
  }
  if (response.status === 204) return null

  try {
    return await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(response.status, 'The server returned an unreadable response.')
  }
}

async function ensureCsrfToken() {
  try {
    const response = await fetch('/api/auth/csrf', { credentials: 'include', headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    const payload = await response.json()
    return payload.token || null
  } catch {
    return null
  }
}
