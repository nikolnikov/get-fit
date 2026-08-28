export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  SESSION_SECRET: string
}

type DayRow = {
  date: string
  values_json: string
  water_glasses_json: string
  weight: string | null
  day_ended: number
}

type UserRow = {
  id: string
  email: string
  password_hash: string
  password_salt: string
  name: string | null
  age: number | null
  calorie_goal: number | null
  current_weight: number | null
  weight_goal: number | null
  onboarded: number
}

const SESSION_COOKIE = 'session'
const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
const DEFAULT_MAX_AGE = 60 * 60 * 24 // 1 day
const PBKDF2_ITERATIONS = 100_000

const jsonResponse = (data: unknown, status = 200, headers: HeadersInit = {}): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

const rowToDay = (row: DayRow) => ({
  values: JSON.parse(row.values_json),
  waterGlasses: JSON.parse(row.water_glasses_json),
  weight: row.weight ?? '',
  dayEnded: row.day_ended === 1,
})

const userToProfile = (user: UserRow) => ({
  email: user.email,
  name: user.name,
  age: user.age,
  calorieGoal: user.calorie_goal,
  currentWeight: user.current_weight,
  weightGoal: user.weight_goal,
  onboarded: user.onboarded === 1,
})

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const hashPassword = async (password: string, saltHex: string): Promise<string> => {
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return toHex(new Uint8Array(bits))
}

const hmacSign = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64Url(new Uint8Array(signature))
}

const createSessionToken = async (userId: string, maxAgeSeconds: number, secret: string): Promise<string> => {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + maxAgeSeconds * 1000 })
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload))
  const signature = await hmacSign(payloadB64, secret)
  return `${payloadB64}.${signature}`
}

const verifySessionToken = async (token: string, secret: string): Promise<string | null> => {
  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) return null
  const expectedSignature = await hmacSign(payloadB64, secret)
  if (signature !== expectedSignature) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as { uid: string; exp: number }
    if (payload.exp < Date.now()) return null
    return payload.uid
  } catch {
    return null
  }
}

const parseCookies = (header: string | null): Record<string, string> => {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) cookies[key] = rest.join('=')
  }
  return cookies
}

const buildSessionCookie = (token: string, maxAgeSeconds: number, secure: boolean): string => {
  const parts = [`${SESSION_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

const buildLogoutCookie = (secure: boolean): string => {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

const getAuthenticatedUserId = async (request: Request, env: Env): Promise<string | null> => {
  const cookies = parseCookies(request.headers.get('Cookie'))
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  return verifySessionToken(token, env.SESSION_SECRET)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const secureCookie = url.protocol === 'https:'

    if (url.pathname === '/api/account-status' && request.method === 'GET') {
      const { count } = (await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>())!
      return jsonResponse({ hasAccount: count > 0 })
    }

    if (url.pathname === '/api/register' && request.method === 'POST') {
      const { count } = (await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>())!
      if (count > 0) return jsonResponse({ error: 'An account already exists' }, 409)

      const body = await request.json<{ email: string; password: string; rememberMe: boolean }>()
      const email = body.email?.trim().toLowerCase()
      const password = body.password

      if (!email || !password) return jsonResponse({ error: 'Email and password are required' }, 400)

      const saltBytes = crypto.getRandomValues(new Uint8Array(16))
      const salt = toHex(saltBytes)
      const passwordHash = await hashPassword(password, salt)
      const id = crypto.randomUUID()
      await env.DB.prepare(
        `INSERT INTO users (id, email, password_hash, password_salt, onboarded, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      )
        .bind(id, email, passwordHash, salt, new Date().toISOString())
        .run()

      const user: UserRow = {
        id,
        email,
        password_hash: passwordHash,
        password_salt: salt,
        name: null,
        age: null,
        calorie_goal: null,
        current_weight: null,
        weight_goal: null,
        onboarded: 0,
      }

      const maxAge = body.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE
      const token = await createSessionToken(user.id, maxAge, env.SESSION_SECRET)

      return jsonResponse(
        { profile: userToProfile(user) },
        200,
        { 'Set-Cookie': buildSessionCookie(token, maxAge, secureCookie) }
      )
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      const body = await request.json<{ email: string; password: string; rememberMe: boolean }>()
      const email = body.email?.trim().toLowerCase()
      const password = body.password

      if (!email || !password) return jsonResponse({ error: 'Email and password are required' }, 400)

      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()
      if (!user) return jsonResponse({ error: 'Invalid email or password' }, 401)

      const hash = await hashPassword(password, user.password_salt)
      if (hash !== user.password_hash) return jsonResponse({ error: 'Invalid email or password' }, 401)

      const maxAge = body.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE
      const token = await createSessionToken(user.id, maxAge, env.SESSION_SECRET)

      return jsonResponse(
        { profile: userToProfile(user) },
        200,
        { 'Set-Cookie': buildSessionCookie(token, maxAge, secureCookie) }
      )
    }

    if (url.pathname === '/api/logout' && request.method === 'POST') {
      return jsonResponse({ ok: true }, 200, { 'Set-Cookie': buildLogoutCookie(secureCookie) })
    }

    if (url.pathname === '/api/me' && request.method === 'GET') {
      const userId = await getAuthenticatedUserId(request, env)
      if (!userId) return jsonResponse({ error: 'Not authenticated' }, 401)

      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>()
      if (!user) return jsonResponse({ error: 'Not authenticated' }, 401)

      return jsonResponse({ profile: userToProfile(user) })
    }

    if (url.pathname === '/api/profile' && request.method === 'PUT') {
      const userId = await getAuthenticatedUserId(request, env)
      if (!userId) return jsonResponse({ error: 'Not authenticated' }, 401)

      const body = await request.json<{
        name: string
        age: number
        calorieGoal: number
        currentWeight: number
        weightGoal: number
      }>()

      await env.DB.prepare(
        `UPDATE users SET name = ?, age = ?, calorie_goal = ?, current_weight = ?, weight_goal = ?, onboarded = 1 WHERE id = ?`
      )
        .bind(body.name, body.age, body.calorieGoal, body.currentWeight, body.weightGoal, userId)
        .run()

      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>()
      return jsonResponse({ profile: userToProfile(user!) })
    }

    if (url.pathname === '/api/days' && request.method === 'GET') {
      const userId = await getAuthenticatedUserId(request, env)
      if (!userId) return jsonResponse({ error: 'Not authenticated' }, 401)

      const { results } = await env.DB.prepare(
        'SELECT date, values_json, water_glasses_json, weight, day_ended FROM days WHERE user_id = ?'
      )
        .bind(userId)
        .all<DayRow>()

      const days: Record<string, ReturnType<typeof rowToDay>> = {}
      for (const row of results) {
        days[row.date] = rowToDay(row)
      }
      return jsonResponse(days)
    }

    const dayMatch = url.pathname.match(/^\/api\/days\/(\d{4}-\d{2}-\d{2})$/)
    if (dayMatch && request.method === 'PUT') {
      const userId = await getAuthenticatedUserId(request, env)
      if (!userId) return jsonResponse({ error: 'Not authenticated' }, 401)

      const date = dayMatch[1]
      const body = await request.json<{
        values: Record<string, string>
        waterGlasses: boolean[]
        weight: string
        dayEnded: boolean
      }>()

      await env.DB.prepare(
        `INSERT INTO days (user_id, date, values_json, water_glasses_json, weight, day_ended, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id, date) DO UPDATE SET
           values_json = excluded.values_json,
           water_glasses_json = excluded.water_glasses_json,
           weight = excluded.weight,
           day_ended = excluded.day_ended,
           updated_at = excluded.updated_at`
      )
        .bind(
          userId,
          date,
          JSON.stringify(body.values),
          JSON.stringify(body.waterGlasses),
          body.weight || null,
          body.dayEnded ? 1 : 0,
          new Date().toISOString()
        )
        .run()

      return jsonResponse({ ok: true })
    }

    return env.ASSETS.fetch(request)
  },
}
