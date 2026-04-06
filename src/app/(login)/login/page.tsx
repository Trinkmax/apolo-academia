'use client'

import { useActionState } from 'react'
import { login } from './actions'
import Image from 'next/image'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 56% / 0.06) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 80%, hsl(228 18% 12% / 0.8) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-primary/30 mb-4">
            <Image
              src="/logo-apolo.jpg"
              alt="Apolo by Monaco"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-widest" style={{ color: 'hsl(var(--primary))' }}>
            APOLO
          </h1>
          <span className="text-xs font-medium tracking-[0.25em] text-muted-foreground">
            ACADEMIA
          </span>
        </div>

        {/* Login card */}
        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">Iniciar sesion</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ingresa tus credenciales para acceder
          </p>

          <form action={action} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  style={{
                    background: 'hsl(var(--surface-2))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tu contrasena"
                  className="w-full h-11 pl-10 pr-11 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  style={{
                    background: 'hsl(var(--surface-2))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {state?.error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'hsl(0 72% 55% / 0.1)',
                  border: '1px solid hsl(0 72% 55% / 0.25)',
                  color: 'hsl(0 72% 68%)',
                }}
              >
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed gold-glow hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, hsl(38 92% 56%), hsl(28 90% 48%))',
                color: 'hsl(228 14% 7%)',
              }}
            >
              {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-8">
          Apolo by Monaco &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
