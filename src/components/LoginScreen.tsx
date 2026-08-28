import { useState } from 'react'
import type { FormEvent } from 'react'

type LoginScreenProps = {
  mode: 'create' | 'login'
  onSubmit: (email: string, password: string, rememberMe: boolean) => void
  error: string | null
  submitting: boolean
}

export function LoginScreen({ mode, onSubmit, error, submitting }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(email, password, rememberMe)
  }

  return (
    <div className="auth-screen">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-form__field">
          <input
            className="auth-form__input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Email"
            required
          />
        </label>
        <label className="auth-form__field">
          <input
            className="auth-form__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            placeholder="Password"
            required
          />
        </label>
        <label className="auth-form__checkbox">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          <span>Remember me</span>
        </label>
        {error && <p className="auth-form__error">{error}</p>}
        <button type="submit" className="auth-form__submit" disabled={submitting}>
          {mode === 'create'
            ? submitting
              ? 'Creating Account…'
              : 'Create Account'
            : submitting
              ? 'Signing in…'
              : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
