import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function Carte({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100', className)}>
      {children}
    </div>
  )
}

type VarianteBouton = 'primaire' | 'secondaire' | 'discret' | 'danger'

interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBouton
}

const stylesVariantes: Record<VarianteBouton, string> = {
  primaire: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
  secondaire: 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200',
  discret: 'text-gray-600 hover:bg-gray-100',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
}

export function Bouton({ variante = 'primaire', className = '', ...props }: BoutonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        stylesVariantes[variante],
        className,
      )}
      {...props}
    />
  )
}

export function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

export function Saisie(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-shadow',
        props.className,
      )}
    />
  )
}

export function ZoneTexte(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-shadow',
        props.className,
      )}
    />
  )
}

export function Selection(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none bg-white transition-shadow',
        props.className,
      )}
    />
  )
}

export function EtiquetteChamp(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn('text-sm font-medium text-gray-700', props.className)} />
}

const stylesStatut: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  envoye: 'bg-blue-100 text-blue-700',
  envoyee: 'bg-blue-100 text-blue-700',
  accepte: 'bg-emerald-100 text-emerald-700',
  refuse: 'bg-red-100 text-red-700',
  transforme: 'bg-purple-100 text-purple-700',
  payee: 'bg-emerald-100 text-emerald-700',
  en_retard: 'bg-red-100 text-red-700',
}

const libellesStatut: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  envoyee: 'Envoyée',
  accepte: 'Accepté',
  refuse: 'Refusé',
  transforme: 'Transformé en facture',
  payee: 'Payée',
  en_retard: 'En retard',
}

export function BadgeStatut({ statut }: { statut: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${stylesStatut[statut] ?? 'bg-gray-100 text-gray-600'}`}>
      {libellesStatut[statut] ?? statut}
    </span>
  )
}

export function EtatVide({ titre, description, action }: { titre: string; description: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <p className="text-4xl mb-3">🗂️</p>
      <h3 className="text-lg font-semibold text-gray-800">{titre}</h3>
      <p className="text-gray-500 mt-1 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
