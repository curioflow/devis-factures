import { DEVISES, type Devise } from '../types'

export function formaterMontant(montant: number, devise: Devise): string {
  const option = DEVISES.find((d) => d.code === devise) ?? DEVISES[0]
  try {
    return new Intl.NumberFormat(option.locale, {
      style: 'currency',
      currency: option.code,
      currencyDisplay: 'symbol',
    }).format(montant)
  } catch {
    return montant.toFixed(2) + ' ' + devise
  }
}

/**
 * Convertit une date "YYYY-MM-DD" en objet Date à minuit LOCAL (et non UTC).
 * Important : `new Date("2026-09-26")` est interprété comme minuit UTC, ce qui
 * fait apparaître la veille dans les fuseaux horaires en retard sur UTC
 * (Québec, Sénégal continental proche...). On parse donc manuellement.
 */
function dateLocaleDepuisISO(iso: string): Date | null {
  const correspondance = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!correspondance) return null
  const [, annee, mois, jour] = correspondance
  const d = new Date(Number(annee), Number(mois) - 1, Number(jour))
  return Number.isNaN(d.getTime()) ? null : d
}

function isoDepuisDateLocale(d: Date): string {
  const annee = d.getFullYear()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${annee}-${mois}-${jour}`
}

export function formaterDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = dateLocaleDepuisISO(iso)
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function dateAujourdhuiISO(): string {
  return isoDepuisDateLocale(new Date())
}

export function ajouterJours(iso: string, jours: number): string {
  const d = dateLocaleDepuisISO(iso) ?? new Date()
  d.setDate(d.getDate() + jours)
  return isoDepuisDateLocale(d)
}
