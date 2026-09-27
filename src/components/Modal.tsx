import { useEffect, type ReactNode } from 'react'
import { cn } from '../lib/cn'

interface ModalProps {
  ouvert: boolean
  onFermer: () => void
  children: ReactNode
  largeurMax?: string
}

/**
 * Fenêtre modale simple : se ferme au clic sur le fond ou à la touche Échap.
 */
export default function Modal({ ouvert, onFermer, children, largeurMax = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!ouvert) return
    const gererTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', gererTouche)
    return () => document.removeEventListener('keydown', gererTouche)
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onFermer}
    >
      <div onClick={(e) => e.stopPropagation()} className={cn('w-full', largeurMax)}>
        {children}
      </div>
    </div>
  )
}
