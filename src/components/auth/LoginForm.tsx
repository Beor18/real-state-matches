'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Loader2, CheckCircle, Sparkles, Home } from 'lucide-react'

interface LoginFormProps {
  redirectTo?: string
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signInWithMagicLink } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await signInWithMagicLink(email)

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-emerald-700">
                ¡Revisa tu email!
              </h3>
              <p className="text-slate-600">
                Te enviamos un enlace mágico a{' '}
                <span className="font-semibold text-slate-900">{email}</span>
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-500">
              <p>Haz clic en el enlace del email para iniciar sesión.</p>
              <p>El enlace expira en 1 hora.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccess(false)
                setEmail('')
              }}
            >
              Usar otro email
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="border-2">
        <CardHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="h-16 w-16 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
          >
            <Home className="h-8 w-8 text-white" />
          </motion.div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Bienvenido a Smarlin
            </CardTitle>
            <CardDescription>
              Ingresa tu email para recibir un enlace mágico de acceso
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-2 mx-auto border-emerald-200 bg-emerald-50 text-emerald-700">
            <Sparkles className="h-3 w-3" />
            Sin contraseñas, solo magia
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-sm text-red-600 bg-red-50 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar enlace mágico
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Al continuar, aceptas nuestros{' '}
              <a href="#" className="underline hover:text-slate-900">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="#" className="underline hover:text-slate-900">
                Política de Privacidad
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
