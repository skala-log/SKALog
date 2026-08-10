const BASE = '/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function get<T>(path: string): Promise<T> {
  return handle(await fetch(`${BASE}${path}`))
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return handle(
    await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  return handle(
    await fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

export async function del(path: string): Promise<void> {
  return handle(await fetch(`${BASE}${path}`, { method: 'DELETE' }))
}
