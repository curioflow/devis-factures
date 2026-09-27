import { v4 as uuid } from 'uuid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dateAujourdhuiISO, ajouterJours } from '../lib/format'
import type {
  Client,
  DocumentCommercial,
  Devise,
  LigneDocument,
  MonEntreprise,
  TauxTaxe,
} from '../types'

interface Compteurs {
  devis: number
  facture: number
}

interface Parametres {
  entreprise: MonEntreprise
  devise: Devise
  tauxTaxesParDefaut: TauxTaxe[]
  profilTaxeId: string
  prefixeDevis: string
  prefixeFacture: string
  compteurs: Compteurs
  delaiValiditeDevisJours: number
  delaiEcheanceFactureJours: number
}

interface AppState {
  parametres: Parametres
  clients: Client[]
  documents: DocumentCommercial[]

  // Paramètres
  majParametres: (p: Partial<Parametres>) => void
  majEntreprise: (e: Partial<MonEntreprise>) => void

  // Clients
  ajouterClient: (c: Omit<Client, 'id' | 'creeLe'>) => Client
  majClient: (id: string, c: Partial<Client>) => void
  supprimerClient: (id: string) => void

  // Documents
  creerDevis: () => DocumentCommercial
  creerFactureDirecte: () => DocumentCommercial
  dupliquerDocument: (id: string) => DocumentCommercial | null
  majDocument: (id: string, patch: Partial<DocumentCommercial>) => void
  supprimerDocument: (id: string) => void
  transformerEnFacture: (devisId: string) => DocumentCommercial | null

  // Export / Import
  exporterDonnees: () => string
  importerDonnees: (json: string) => void
  reinitialiser: () => void
}

const parametresParDefaut: Parametres = {
  entreprise: {
    nom: '',
    adresse: '',
    numeroEntreprise: '',
    courriel: '',
    telephone: '',
  },
  devise: 'CAD',
  tauxTaxesParDefaut: [
    { id: 'tps', nom: 'TPS', taux: 5 },
    { id: 'tvq', nom: 'TVQ', taux: 9.975 },
  ],
  profilTaxeId: 'qc',
  prefixeDevis: 'DEV-',
  prefixeFacture: 'FAC-',
  compteurs: { devis: 1, facture: 1 },
  delaiValiditeDevisJours: 30,
  delaiEcheanceFactureJours: 30,
}

function formaterNumero(prefixe: string, n: number): string {
  const annee = new Date().getFullYear()
  return `${prefixe}${annee}-${String(n).padStart(4, '0')}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      parametres: parametresParDefaut,
      clients: [],
      documents: [],

      majParametres: (p) =>
        set((state) => ({ parametres: { ...state.parametres, ...p } })),

      majEntreprise: (e) =>
        set((state) => ({
          parametres: {
            ...state.parametres,
            entreprise: { ...state.parametres.entreprise, ...e },
          },
        })),

      ajouterClient: (c) => {
        const client: Client = { ...c, id: uuid(), creeLe: new Date().toISOString() }
        set((state) => ({ clients: [...state.clients, client] }))
        return client
      },

      majClient: (id, c) =>
        set((state) => ({
          clients: state.clients.map((cl) => (cl.id === id ? { ...cl, ...c } : cl)),
        })),

      supprimerClient: (id) =>
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

      creerDevis: () => {
        const { parametres } = get()
        const numero = formaterNumero(parametres.prefixeDevis, parametres.compteurs.devis)
        const aujourdhui = dateAujourdhuiISO()
        const doc: DocumentCommercial = {
          id: uuid(),
          type: 'devis',
          numero,
          clientId: '',
          dateEmission: aujourdhui,
          dateEcheance: ajouterJours(aujourdhui, parametres.delaiValiditeDevisJours),
          lignes: [{ id: uuid(), description: '', quantite: 1, prixUnitaire: 0 }],
          tauxTaxes: parametres.tauxTaxesParDefaut,
          remisePct: 0,
          notes: parametres.entreprise.mentions ?? '',
          statut: 'brouillon',
          creeLe: new Date().toISOString(),
          modifieLe: new Date().toISOString(),
        }
        set((state) => ({
          documents: [...state.documents, doc],
          parametres: {
            ...state.parametres,
            compteurs: { ...state.parametres.compteurs, devis: state.parametres.compteurs.devis + 1 },
          },
        }))
        return doc
      },

      creerFactureDirecte: () => {
        const { parametres } = get()
        const numero = formaterNumero(parametres.prefixeFacture, parametres.compteurs.facture)
        const aujourdhui = dateAujourdhuiISO()
        const doc: DocumentCommercial = {
          id: uuid(),
          type: 'facture',
          numero,
          clientId: '',
          dateEmission: aujourdhui,
          dateEcheance: ajouterJours(aujourdhui, parametres.delaiEcheanceFactureJours),
          lignes: [{ id: uuid(), description: '', quantite: 1, prixUnitaire: 0 }],
          tauxTaxes: parametres.tauxTaxesParDefaut,
          remisePct: 0,
          notes: parametres.entreprise.mentions ?? '',
          statut: 'brouillon',
          creeLe: new Date().toISOString(),
          modifieLe: new Date().toISOString(),
        }
        set((state) => ({
          documents: [...state.documents, doc],
          parametres: {
            ...state.parametres,
            compteurs: { ...state.parametres.compteurs, facture: state.parametres.compteurs.facture + 1 },
          },
        }))
        return doc
      },

      dupliquerDocument: (id) => {
        const { documents, parametres } = get()
        const original = documents.find((d) => d.id === id)
        if (!original) return null
        const estDevis = original.type === 'devis'
        const compteurCle = estDevis ? 'devis' : 'facture'
        const prefixe = estDevis ? parametres.prefixeDevis : parametres.prefixeFacture
        const numero = formaterNumero(prefixe, parametres.compteurs[compteurCle])
        const aujourdhui = dateAujourdhuiISO()
        const copie: DocumentCommercial = {
          ...original,
          id: uuid(),
          numero,
          dateEmission: aujourdhui,
          statut: 'brouillon',
          devisOrigineId: undefined,
          lignes: original.lignes.map((l) => ({ ...l, id: uuid() })),
          creeLe: new Date().toISOString(),
          modifieLe: new Date().toISOString(),
        }
        set((state) => ({
          documents: [...state.documents, copie],
          parametres: {
            ...state.parametres,
            compteurs: { ...state.parametres.compteurs, [compteurCle]: state.parametres.compteurs[compteurCle] + 1 },
          },
        }))
        return copie
      },

      majDocument: (id, patch) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...patch, modifieLe: new Date().toISOString() } : d,
          ),
        })),

      supprimerDocument: (id) =>
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

      transformerEnFacture: (devisId) => {
        const { parametres, documents } = get()
        const devis = documents.find((d) => d.id === devisId)
        if (!devis || devis.type !== 'devis') return null

        const numero = formaterNumero(parametres.prefixeFacture, parametres.compteurs.facture)
        const aujourdhui = dateAujourdhuiISO()
        const facture: DocumentCommercial = {
          id: uuid(),
          type: 'facture',
          numero,
          clientId: devis.clientId,
          dateEmission: aujourdhui,
          dateEcheance: ajouterJours(aujourdhui, parametres.delaiEcheanceFactureJours),
          lignes: devis.lignes.map((l: LigneDocument) => ({ ...l, id: uuid() })),
          tauxTaxes: devis.tauxTaxes,
          remisePct: devis.remisePct,
          notes: devis.notes,
          statut: 'brouillon',
          devisOrigineId: devis.id,
          creeLe: new Date().toISOString(),
          modifieLe: new Date().toISOString(),
        }

        set((state) => ({
          documents: [
            ...state.documents.map((d) =>
              d.id === devisId ? { ...d, statut: 'transforme' as const, modifieLe: new Date().toISOString() } : d,
            ),
            facture,
          ],
          parametres: {
            ...state.parametres,
            compteurs: { ...state.parametres.compteurs, facture: state.parametres.compteurs.facture + 1 },
          },
        }))
        return facture
      },

      exporterDonnees: () => {
        const { parametres, clients, documents } = get()
        return JSON.stringify({ parametres, clients, documents, version: 1 }, null, 2)
      },

      importerDonnees: (json) => {
        try {
          const data = JSON.parse(json)
          set({
            parametres: { ...parametresParDefaut, ...data.parametres },
            clients: data.clients ?? [],
            documents: data.documents ?? [],
          })
        } catch {
          throw new Error("Fichier invalide : impossible d'importer les données.")
        }
      },

      reinitialiser: () =>
        set({ parametres: parametresParDefaut, clients: [], documents: [] }),
    }),
    {
      name: 'devis-factures-store',
      version: 1,
    },
  ),
)
