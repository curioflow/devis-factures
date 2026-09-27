import type { DocumentCommercial, LigneDocument, TauxTaxe, Totaux } from '../types'

export function totalLigne(ligne: LigneDocument): number {
  return round2(ligne.quantite * ligne.prixUnitaire)
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function calculerTotaux(
  lignes: LigneDocument[],
  tauxTaxes: TauxTaxe[],
  remisePct: number,
): Totaux {
  const sousTotal = round2(lignes.reduce((acc, l) => acc + totalLigne(l), 0))
  const remiseMontant = round2(sousTotal * (remisePct || 0) / 100)
  const baseApresRemise = round2(sousTotal - remiseMontant)

  const taxes = tauxTaxes.map((t) => ({
    nom: t.nom,
    taux: t.taux,
    montant: round2(baseApresRemise * t.taux / 100),
  }))

  const totalTaxes = round2(taxes.reduce((acc, t) => acc + t.montant, 0))
  const total = round2(baseApresRemise + totalTaxes)

  return { sousTotal, remiseMontant, baseApresRemise, taxes, totalTaxes, total }
}

export function totauxDocument(doc: DocumentCommercial): Totaux {
  return calculerTotaux(doc.lignes, doc.tauxTaxes, doc.remisePct)
}
