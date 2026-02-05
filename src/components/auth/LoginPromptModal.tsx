'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heart, LogIn, UserPlus, Sparkles } from 'lucide-react'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  /** The URL to return to after login */
  returnTo?: string
  /** Optional: property title to show in the modal */
  propertyTitle?: string
}

export function LoginPromptModal({
  isOpen,
  onClose,
  returnTo,
  propertyTitle,
}: LoginPromptModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    // Save current search state to sessionStorage before redirecting
    const loginUrl = returnTo 
      ? `/auth/login?redirectTo=${encodeURIComponent(returnTo)}`
      : '/auth/login'
    router.push(loginUrl)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center"
          >
            <Heart className="h-8 w-8 text-white fill-white" />
          </motion.div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-900">
              Guarda tus propiedades favoritas
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {propertyTitle ? (
                <>
                  Para guardar <span className="font-medium text-slate-700">&ldquo;{propertyTitle}&rdquo;</span> necesitas una cuenta gratuita.
                </>
              ) : (
                'Crea una cuenta gratuita para guardar propiedades y acceder a ellas desde cualquier dispositivo.'
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Benefits */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Con tu cuenta gratuita
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Guarda propiedades ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Recibe recomendaciones personalizadas
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full gap-2 bg-slate-900 hover:bg-slate-800 h-12"
            >
              <UserPlus className="h-5 w-5" />
              Crear cuenta gratis
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLogin}
              className="w-full gap-2 h-11"
            >
              <LogIn className="h-4 w-4" />
              Ya tengo cuenta
            </Button>
          </div>

          <p className="text-xs text-center text-slate-400">
            Solo necesitas tu email. Sin contraseñas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LoginPromptModal
