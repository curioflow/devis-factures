// Types de domaine pour l'application Devis & Factures

export type Devise = 'CAD' | 'EUR' | 'XOF' | 'USD' | 'CHF' | 'MAD'

export interface OptionDevise {
  code: Devise
  label: string
  locale: string
}

export const DEVISES: OptionDevise[] = [
  { code: 'CAD', label: 'Dollar canadien (CAD $)', locale: 'fr-CA' },
  { code: 'EUR', label: 'Euro (EUR €)', locale: 'fr-FR' },
  { code: 'XOF', label: 'Franc CFA (XOF)', locale: 'fr-SN' },
  { code: 'USD', label: 'Dollar américain (USD $)', locale: 'fr-CA' },
  { code: 'CHF', label: 'Franc suisse (CHF)', locale: 'fr-CH' },
  { code: 'MAD', label: 'Dirham marocain (MAD)', locale: 'fr-MA' },
]

/** Un taux de taxe nommé (ex. TPS 5 %, TVA 20 %) */
export interface TauxTaxe {
  id: string
  nom: string
  taux: number // en pourcentage, ex 5 pour 5%
}

/** Un profil de taxes prédéfini par pays, ou personnalisé */
export interface ProfilTaxes {
  id: string
  nom: string
  taux: TauxTaxe[]
}

export const PROFILS_PREDEFINIS: ProfilTaxes[] = [
  {
    id: 'qc',
    nom: 'Québec (TPS + TVQ)',
    taux: [
      { id: 'tps', nom: 'TPS', taux: 5 },
      { id: 'tvq', nom: 'TVQ', taux: 9.975 },
    ],
  },
  {
    id: 'fr',
    nom: 'France (TVA)',
    taux: [{ id: 'tva-fr', nom: 'TVA', taux: 20 }],
  },
  {
    id: 'sn',
    nom: 'Sénégal (TVA)',
    taux: [{ id: 'tva-sn', nom: 'TVA', taux: 18 }],
  },
  {
    id: 'aucune',
    nom: 'Aucune taxe',
    taux: [],
  },
  {
    id: 'personnalise',
    nom: 'Personnalisé',
    taux: [],
  },
]

export interface MonEntreprise {
  nom: string
  adresse: string
  numeroEntreprise: string
  courriel: string
  telephone: string
  logoDataUrl?: string
  iban?: string
  mentions?: string // mentions légales / conditions de paiement par défaut
}

export interface Client {
  id: string
  nom: string
  adresse: string
  courriel: string
  telephone: string
  numeroTva?: string
  notes?: string
  creeLe: string
}

export interface LigneDocument {
  id: string
  description: string
  quantite: number
  prixUnitaire: number
}

export type TypeDocument = 'devis' | 'facture'

export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'transforme'
export type StatutFacture = 'brouillon' | 'envoyee' | 'payee' | 'en_retard'

export interface DocumentCommercial {
  id: string
  type: TypeDocument
  numero: string
  clientId: string
  dateEmission: string // ISO
  dateEcheance?: string // date de validité (devis) ou d'échéance (facture)
  lignes: LigneDocument[]
  tauxTaxes: TauxTaxe[] // instantané des taxes appliquées à ce document
  remisePct: number // remise globale en %
  notes: string
  statut: StatutDevis | StatutFacture
  devisOrigineId?: string // si facture issue d'un devis
  creeLe: string
  modifieLe: string
}

export interface Totaux {
  sousTotal: number
  remiseMontant: number
  baseApresRemise: number
  taxes: { nom: string; taux: number; montant: number }[]
  totalTaxes: number
  total: number
}
