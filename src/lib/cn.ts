import { twMerge } from 'tailwind-merge'

/**
 * Fusionne des classes Tailwind en résolvant les conflits (ex. bg-white vs
 * bg-primary-600) selon l'ordre d'appel plutôt que l'ordre du CSS compilé.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
