import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Client, DocumentCommercial, Devise, MonEntreprise } from '../types'
import { totalLigne, totauxDocument } from './calc'
import { dateAujourdhuiISO, formaterDate, formaterMontant } from './format'

const COULEUR_PRIMAIRE = '#1e3a5f'
const COULEUR_GRISE = '#6b7280'

export function genererPdfDocument(
  doc: DocumentCommercial,
  entreprise: MonEntreprise,
  client: Client | undefined,
  devise: Devise,
): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const margeGauche = 15
  const largeurPage = pdf.internal.pageSize.getWidth()
  const margeDroite = largeurPage - 15
  let y = 18

  const titre = doc.type === 'devis' ? 'DEVIS' : 'FACTURE'

  // En-tête : logo (optionnel) + titre
  if (entreprise.logoDataUrl) {
    try {
      pdf.addImage(entreprise.logoDataUrl, 'PNG', margeGauche, y - 4, 28, 28, undefined, 'FAST')
    } catch {
      // ignore les logos invalides
    }
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor(COULEUR_PRIMAIRE)
  pdf.text(titre, margeDroite, y + 2, { align: 'right' })

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(COULEUR_GRISE)
  let yEntete = y + 9
  pdf.text(`N° ${doc.numero}`, margeDroite, yEntete, { align: 'right' })
  yEntete += 6
  pdf.text(`Émis le ${formaterDate(doc.dateEmission)}`, margeDroite, yEntete, { align: 'right' })
  if (doc.dateEcheance) {
    yEntete += 6
    const libelle = doc.type === 'devis' ? "Valide jusqu'au" : 'Échéance'
    pdf.text(`${libelle} ${formaterDate(doc.dateEcheance)}`, margeDroite, yEntete, { align: 'right' })
  }

  // On descend sous le texte d'en-tête ET sous le logo (le plus grand des deux),
  // avec une marge, pour ne jamais chevaucher les blocs "De"/"À" dessinés ensuite.
  const basDuLogo = entreprise.logoDataUrl ? y - 4 + 28 : 0
  y = Math.max(yEntete, basDuLogo) + 10

  // Bloc "De" et "À"
  const colLargeur = (margeDroite - margeGauche - 10) / 2
  const yBloc = y
  pdf.setDrawColor(230)
  pdf.setFillColor(248, 249, 251)
  pdf.roundedRect(margeGauche, yBloc, colLargeur, 38, 2, 2, 'F')
  pdf.roundedRect(margeGauche + colLargeur + 10, yBloc, colLargeur, 38, 2, 2, 'F')

  ecrireBlocCoordonnees(pdf, 'DE', entreprise.nom, [
    entreprise.adresse,
    entreprise.numeroEntreprise ? `N° entreprise : ${entreprise.numeroEntreprise}` : '',
    entreprise.courriel,
    entreprise.telephone,
  ], margeGauche + 4, yBloc + 6, colLargeur - 8)

  ecrireBlocCoordonnees(pdf, 'À', client?.nom ?? '(aucun client)', [
    client?.adresse ?? '',
    client?.numeroTva ? `N° TVA/entreprise : ${client.numeroTva}` : '',
    client?.courriel ?? '',
    client?.telephone ?? '',
  ], margeGauche + colLargeur + 14, yBloc + 6, colLargeur - 8)

  y = yBloc + 38 + 10

  // Référence au devis d'origine
  if (doc.type === 'facture' && doc.devisOrigineId) {
    pdf.setFontSize(9)
    pdf.setTextColor(COULEUR_GRISE)
    pdf.text(`Facture émise suite au devis référencé dans votre historique.`, margeGauche, y)
    y += 6
  }

  // Tableau des lignes
  const corpsTableau = doc.lignes.map((l) => [
    l.description || '—',
    String(l.quantite),
    formaterMontant(l.prixUnitaire, devise),
    formaterMontant(totalLigne(l), devise),
  ])

  autoTable(pdf, {
    startY: y,
    margin: { left: margeGauche, right: 15 },
    head: [['Description', 'Quantité', 'Prix unitaire', 'Total']],
    body: corpsTableau,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    alternateRowStyles: { fillColor: [248, 249, 251] },
  })

  // @ts-expect-error propriété ajoutée par autotable au runtime
  y = pdf.lastAutoTable.finalY + 8

  // Totaux
  const totaux = totauxDocument(doc)
  const largeurTotaux = 80
  const xTotauxLabel = margeDroite - largeurTotaux
  const xTotauxValeur = margeDroite

  pdf.setFontSize(10)
  pdf.setTextColor(40)

  const ligneTotal = (label: string, valeur: string, gras = false) => {
    pdf.setFont('helvetica', gras ? 'bold' : 'normal')
    pdf.text(label, xTotauxLabel, y)
    pdf.text(valeur, xTotauxValeur, y, { align: 'right' })
    y += 6
  }

  ligneTotal('Sous-total', formaterMontant(totaux.sousTotal, devise))
  if (doc.remisePct > 0) {
    ligneTotal(`Remise (${doc.remisePct}%)`, `- ${formaterMontant(totaux.remiseMontant, devise)}`)
  }
  for (const t of totaux.taxes) {
    ligneTotal(`${t.nom} (${t.taux}%)`, formaterMontant(t.montant, devise))
  }
  pdf.setDrawColor(200)
  pdf.line(xTotauxLabel, y - 2, xTotauxValeur, y - 2)
  y += 2
  pdf.setFontSize(12)
  pdf.setTextColor(COULEUR_PRIMAIRE)
  ligneTotal('Total', formaterMontant(totaux.total, devise), true)

  // Notes / conditions
  if (doc.notes && doc.notes.trim()) {
    y += 8
    pdf.setFontSize(9)
    pdf.setTextColor(COULEUR_GRISE)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Notes', margeGauche, y)
    y += 5
    pdf.setFont('helvetica', 'normal')
    const lignesNotes = pdf.splitTextToSize(doc.notes, margeDroite - margeGauche)
    pdf.text(lignesNotes, margeGauche, y)
  }

  // Pied de page
  const hauteurPage = pdf.internal.pageSize.getHeight()
  pdf.setFontSize(8)
  pdf.setTextColor(COULEUR_GRISE)
  pdf.text(
    `${entreprise.nom || ''} — Document généré le ${formaterDate(dateAujourdhuiISO())}`,
    margeGauche,
    hauteurPage - 10,
  )

  return pdf
}

function ecrireBlocCoordonnees(
  pdf: jsPDF,
  etiquette: string,
  nom: string,
  lignes: string[],
  x: number,
  y: number,
  largeurMax: number,
) {
  pdf.setFontSize(8)
  pdf.setTextColor(COULEUR_GRISE)
  pdf.setFont('helvetica', 'bold')
  pdf.text(etiquette, x, y)

  pdf.setFontSize(11)
  pdf.setTextColor(30)
  pdf.text(nom || '—', x, y + 6)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(70)
  let yy = y + 12
  for (const ligne of lignes) {
    if (!ligne) continue
    const morceaux = pdf.splitTextToSize(ligne, largeurMax)
    pdf.text(morceaux, x, yy)
    yy += 4.5 * (Array.isArray(morceaux) ? morceaux.length : 1)
  }
}

/** Retire les accents (é, è, ô...) pour obtenir un nom de fichier ASCII propre. */
function translitererPourFichier(texte: string): string {
  // NFD sépare la lettre de son accent (ex. "é" -> "e" + U+0301) ;
  // on retire ensuite les marques diacritiques combinantes (U+0300–U+036F).
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function nomFichierPdf(doc: DocumentCommercial, client: Client | undefined): string {
  const brut = translitererPourFichier(client?.nom ?? 'client')
  const nomClient = brut
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'client'
  return `${doc.type}-${doc.numero}-${nomClient}.pdf`
}
