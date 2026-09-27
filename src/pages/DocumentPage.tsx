import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import Modal from '../components/Modal'
import { BadgeStatut, Bouton, Carte, Champ, Saisie, Selection, ZoneTexte } from '../components/ui'
import { calculerTotaux } from '../lib/calc'
import { formaterMontant } from '../lib/format'
import { genererPdfDocument, nomFichierPdf } from '../lib/pdf'
import { useAppStore } from '../store/useAppStore'
import type { LigneDocument, TauxTaxe, TypeDocument } from '../types'

export default function DocumentPage({ type }: { type: TypeDocument }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const documents = useAppStore((s) => s.documents)
  const clients = useAppStore((s) => s.clients)
  const parametres = useAppStore((s) => s.parametres)
  const majDocument = useAppStore((s) => s.majDocument)
  const supprimerDocument = useAppStore((s) => s.supprimerDocument)
  const transformerEnFacture = useAppStore((s) => s.transformerEnFacture)
  const dupliquerDocument = useAppStore((s) => s.dupliquerDocument)
  const ajouterClient = useAppStore((s) => s.ajouterClient)

  const [clientRapideOuvert, setClientRapideOuvert] = useState(false)
  const [nomClientRapide, setNomClientRapide] = useState('')

  const doc = documents.find((d) => d.id === id)
  const client = clients.find((c) => c.id === doc?.clientId)

  const totaux = useMemo(
    () => (doc ? calculerTotaux(doc.lignes, doc.tauxTaxes, doc.remisePct) : null),
    [doc],
  )

  if (!doc) {
    return (
      <Carte className="p-8 text-center">
        <p className="text-gray-600">Document introuvable.</p>
        <Bouton className="mt-4" onClick={() => navigate(type === 'devis' ? '/devis' : '/factures')}>
          Retour à la liste
        </Bouton>
      </Carte>
    )
  }

  const estDevis = doc.type === 'devis'

  const majLigne = (index: number, patch: Partial<LigneDocument>) => {
    const lignes = doc.lignes.map((l, i) => (i === index ? { ...l, ...patch } : l))
    majDocument(doc.id, { lignes })
  }

  const ajouterLigne = () => {
    majDocument(doc.id, {
      lignes: [...doc.lignes, { id: uuid(), description: '', quantite: 1, prixUnitaire: 0 }],
    })
  }

  const supprimerLigne = (index: number) => {
    majDocument(doc.id, { lignes: doc.lignes.filter((_, i) => i !== index) })
  }

  const majTaux = (index: number, patch: Partial<TauxTaxe>) => {
    majDocument(doc.id, { tauxTaxes: doc.tauxTaxes.map((t, i) => (i === index ? { ...t, ...patch } : t)) })
  }

  const ajouterTaux = () => {
    majDocument(doc.id, { tauxTaxes: [...doc.tauxTaxes, { id: uuid(), nom: 'Taxe', taux: 0 }] })
  }

  const supprimerTaux = (index: number) => {
    majDocument(doc.id, { tauxTaxes: doc.tauxTaxes.filter((_, i) => i !== index) })
  }

  const telechargerPdf = () => {
    const pdf = genererPdfDocument(doc, parametres.entreprise, client, parametres.devise)
    pdf.save(nomFichierPdf(doc, client))
  }

  const transformer = () => {
    if (!confirm('Transformer ce devis en facture ? Un numéro de facture définitif lui sera attribué.')) return
    const facture = transformerEnFacture(doc.id)
    if (facture) navigate(`/factures/${facture.id}`)
  }

  const dupliquer = () => {
    const copie = dupliquerDocument(doc.id)
    if (copie) navigate(`/${copie.type === 'devis' ? 'devis' : 'factures'}/${copie.id}`)
  }

  const supprimer = () => {
    if (confirm(`Supprimer définitivement ${estDevis ? 'ce devis' : 'cette facture'} ?`)) {
      supprimerDocument(doc.id)
      navigate(estDevis ? '/devis' : '/factures')
    }
  }

  const creerClientRapide = () => {
    if (!nomClientRapide.trim()) return
    const nouveauClient = ajouterClient({ nom: nomClientRapide.trim(), adresse: '', courriel: '', telephone: '' })
    majDocument(doc.id, { clientId: nouveauClient.id })
    setNomClientRapide('')
    setClientRapideOuvert(false)
  }

  const devisLie = doc.devisOrigineId ? documents.find((d) => d.id === doc.devisOrigineId) : undefined
  const factureIssue = estDevis ? documents.find((d) => d.devisOrigineId === doc.id) : undefined

  const optionsStatut = estDevis
    ? [
        ['brouillon', 'Brouillon'],
        ['envoye', 'Envoyé au client'],
        ['accepte', 'Accepté'],
        ['refuse', 'Refusé'],
      ]
    : [
        ['brouillon', 'Brouillon'],
        ['envoyee', 'Envoyée au client'],
        ['payee', 'Payée'],
        ['en_retard', 'En retard'],
      ]

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate(estDevis ? '/devis' : '/factures')} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
            ← {estDevis ? 'Tous les devis' : 'Toutes les factures'}
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 flex-wrap">
            {doc.numero}
            <BadgeStatut statut={doc.statut} />
          </h1>
          {devisLie && (
            <p className="text-sm text-gray-500 mt-1">
              Issue du devis{' '}
              <button className="text-primary-600 hover:underline" onClick={() => navigate(`/devis/${devisLie.id}`)}>
                {devisLie.numero}
              </button>
            </p>
          )}
          {factureIssue && (
            <p className="text-sm text-gray-500 mt-1">
              Transformée en facture{' '}
              <button className="text-primary-600 hover:underline" onClick={() => navigate(`/factures/${factureIssue.id}`)}>
                {factureIssue.numero}
              </button>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={dupliquer}>⧉ Dupliquer</Bouton>
          {estDevis && doc.statut !== 'transforme' && (
            <Bouton onClick={transformer}>➜ Transformer en facture</Bouton>
          )}
          <Bouton onClick={telechargerPdf}>⬇ Télécharger le PDF</Bouton>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Carte className="p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Informations générales</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Champ label="Client">
                <div className="flex gap-2">
                  <Selection
                    value={doc.clientId}
                    onChange={(e) => majDocument(doc.id, { clientId: e.target.value })}
                  >
                    <option value="">— Sélectionner —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </Selection>
                </div>
                <button
                  type="button"
                  onClick={() => setClientRapideOuvert(true)}
                  className="text-xs text-primary-600 hover:underline text-left"
                >
                  + Nouveau client rapide
                </button>
              </Champ>
              <Champ label="Statut">
                <Selection value={doc.statut} onChange={(e) => majDocument(doc.id, { statut: e.target.value as typeof doc.statut })}>
                  {optionsStatut.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Selection>
              </Champ>
              <Champ label="Date d'émission">
                <Saisie type="date" value={doc.dateEmission} onChange={(e) => majDocument(doc.id, { dateEmission: e.target.value })} />
              </Champ>
              <Champ label={estDevis ? 'Valide jusqu\'au' : 'Échéance'}>
                <Saisie
                  type="date"
                  value={doc.dateEcheance ?? ''}
                  onChange={(e) => majDocument(doc.id, { dateEcheance: e.target.value })}
                />
              </Champ>
            </div>
          </Carte>

          <Carte className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Lignes</h2>
            </div>
            <div className="space-y-3">
              {/* En-têtes visibles seulement en desktop */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_110px_110px_32px] gap-2 text-xs font-medium text-gray-400 px-1">
                <span>Description</span>
                <span>Qté</span>
                <span>Prix unit.</span>
                <span className="text-right">Total</span>
                <span></span>
              </div>
              {doc.lignes.map((ligne, i) => (
                <div key={ligne.id} className="grid sm:grid-cols-[1fr_80px_110px_110px_32px] grid-cols-2 gap-2 items-center">
                  <Saisie
                    className="col-span-2 sm:col-span-1"
                    placeholder="Description de la prestation ou du produit"
                    value={ligne.description}
                    onChange={(e) => majLigne(i, { description: e.target.value })}
                  />
                  <Saisie
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Qté"
                    value={ligne.quantite}
                    onChange={(e) => majLigne(i, { quantite: parseFloat(e.target.value) || 0 })}
                  />
                  <Saisie
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Prix"
                    value={ligne.prixUnitaire}
                    onChange={(e) => majLigne(i, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-right font-medium text-gray-700 text-sm">
                    {formaterMontant(ligne.quantite * ligne.prixUnitaire, parametres.devise)}
                  </p>
                  <button
                    onClick={() => supprimerLigne(i)}
                    className="text-gray-400 hover:text-red-600 justify-self-center"
                    aria-label="Supprimer la ligne"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <Bouton variante="secondaire" onClick={ajouterLigne}>+ Ajouter une ligne</Bouton>
          </Carte>

          <Carte className="p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Notes / conditions</h2>
            <ZoneTexte
              rows={3}
              value={doc.notes}
              onChange={(e) => majDocument(doc.id, { notes: e.target.value })}
              placeholder="Conditions de paiement, remerciements, informations bancaires..."
            />
          </Carte>
        </div>

        <div className="space-y-6">
          <Carte className="p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Remise</h2>
            <Champ label="Remise globale (%)">
              <Saisie
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={doc.remisePct}
                onChange={(e) => majDocument(doc.id, { remisePct: parseFloat(e.target.value) || 0 })}
              />
            </Champ>
          </Carte>

          <Carte className="p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Taxes appliquées</h2>
            <div className="space-y-2">
              {doc.tauxTaxes.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2">
                  <Saisie value={t.nom} onChange={(e) => majTaux(i, { nom: e.target.value })} className="flex-1" />
                  <div className="relative w-24">
                    <Saisie
                      type="number"
                      step="0.001"
                      value={t.taux}
                      onChange={(e) => majTaux(i, { taux: parseFloat(e.target.value) || 0 })}
                      className="pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                  <button onClick={() => supprimerTaux(i)} className="text-gray-400 hover:text-red-600" aria-label="Supprimer">
                    ✕
                  </button>
                </div>
              ))}
              {doc.tauxTaxes.length === 0 && <p className="text-sm text-gray-400 italic">Aucune taxe appliquée.</p>}
            </div>
            <Bouton variante="secondaire" onClick={ajouterTaux} className="text-xs">+ Ajouter un taux</Bouton>
          </Carte>

          {totaux && (
            <Carte className="p-5 space-y-2 bg-primary-600 text-white">
              <LigneTotal label="Sous-total" valeur={formaterMontant(totaux.sousTotal, parametres.devise)} />
              {doc.remisePct > 0 && (
                <LigneTotal label={`Remise (${doc.remisePct}%)`} valeur={`- ${formaterMontant(totaux.remiseMontant, parametres.devise)}`} />
              )}
              {totaux.taxes.map((t) => (
                <LigneTotal key={t.nom} label={`${t.nom} (${t.taux}%)`} valeur={formaterMontant(t.montant, parametres.devise)} />
              ))}
              <div className="border-t border-white/20 pt-2 mt-2">
                <LigneTotal label="Total" valeur={formaterMontant(totaux.total, parametres.devise)} gras />
              </div>
            </Carte>
          )}

          <Bouton variante="danger" className="w-full" onClick={supprimer}>
            Supprimer ce document
          </Bouton>
        </div>
      </div>

      <Modal ouvert={clientRapideOuvert} onFermer={() => setClientRapideOuvert(false)} largeurMax="max-w-sm">
        <Carte className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Nouveau client rapide</h3>
          <Saisie
            autoFocus
            placeholder="Nom du client"
            value={nomClientRapide}
            onChange={(e) => setNomClientRapide(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && creerClientRapide()}
          />
          <div className="flex gap-2 mt-3">
            <Bouton className="flex-1" onClick={creerClientRapide} disabled={!nomClientRapide.trim()}>
              Créer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setClientRapideOuvert(false)}>Annuler</Bouton>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Vous pourrez compléter l'adresse et les coordonnées dans la section Clients.
          </p>
        </Carte>
      </Modal>
    </div>
  )
}

function LigneTotal({ label, valeur, gras = false }: { label: string; valeur: string; gras?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${gras ? 'text-lg font-bold' : 'text-sm text-primary-50'}`}>
      <span>{label}</span>
      <span>{valeur}</span>
    </div>
  )
}
