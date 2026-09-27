import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeStatut, Bouton, Carte, EtatVide, Selection } from '../components/ui'
import { totauxDocument } from '../lib/calc'
import { formaterDate, formaterMontant } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { TypeDocument } from '../types'

export default function ListeDocuments({ type }: { type: TypeDocument }) {
  const documents = useAppStore((s) => s.documents)
  const clients = useAppStore((s) => s.clients)
  const devise = useAppStore((s) => s.parametres.devise)
  const creerDevis = useAppStore((s) => s.creerDevis)
  const creerFactureDirecte = useAppStore((s) => s.creerFactureDirecte)
  const supprimerDocument = useAppStore((s) => s.supprimerDocument)
  const navigate = useNavigate()

  const [filtreStatut, setFiltreStatut] = useState('tous')

  const liste = useMemo(() => {
    return documents
      .filter((d) => d.type === type)
      .filter((d) => filtreStatut === 'tous' || d.statut === filtreStatut)
      .sort((a, b) => b.numero.localeCompare(a.numero))
  }, [documents, type, filtreStatut])

  const estDevis = type === 'devis'
  const titre = estDevis ? 'Devis' : 'Factures'
  const optionsStatut = estDevis
    ? [
        ['tous', 'Tous les statuts'],
        ['brouillon', 'Brouillon'],
        ['envoye', 'Envoyé'],
        ['accepte', 'Accepté'],
        ['refuse', 'Refusé'],
        ['transforme', 'Transformé'],
      ]
    : [
        ['tous', 'Tous les statuts'],
        ['brouillon', 'Brouillon'],
        ['envoyee', 'Envoyée'],
        ['payee', 'Payée'],
        ['en_retard', 'En retard'],
      ]

  const nouveauDocument = () => {
    const doc = estDevis ? creerDevis() : creerFactureDirecte()
    navigate(`/${type === 'devis' ? 'devis' : 'factures'}/${doc.id}`)
  }

  const demanderSuppression = (id: string, numero: string) => {
    if (confirm(`Supprimer définitivement ${estDevis ? 'le devis' : 'la facture'} ${numero} ?`)) {
      supprimerDocument(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{titre}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{liste.length} document(s)</p>
        </div>
        <Bouton onClick={nouveauDocument}>+ {estDevis ? 'Nouveau devis' : 'Nouvelle facture'}</Bouton>
      </div>

      {documents.some((d) => d.type === type) && (
        <Selection value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="max-w-xs">
          {optionsStatut.map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </Selection>
      )}

      {liste.length === 0 ? (
        <Carte>
          <EtatVide
            titre={estDevis ? 'Aucun devis' : 'Aucune facture'}
            description={
              estDevis
                ? 'Créez un devis pour le proposer à un client, puis transformez-le en facture en un clic une fois accepté.'
                : 'Créez une facture directement, ou transformez un devis accepté depuis la liste des devis.'
            }
            action={<Bouton onClick={nouveauDocument}>Créer {estDevis ? 'un devis' : 'une facture'}</Bouton>}
          />
        </Carte>
      ) : (
        <Carte className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Numéro</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liste.map((doc) => {
                  const client = clients.find((c) => c.id === doc.clientId)
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/${type === 'devis' ? 'devis' : 'factures'}/${doc.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{doc.numero}</td>
                      <td className="px-4 py-3 text-gray-600">{client?.nom ?? <span className="italic text-gray-400">Sans client</span>}</td>
                      <td className="px-4 py-3 text-gray-500">{formaterDate(doc.dateEmission)}</td>
                      <td className="px-4 py-3"><BadgeStatut statut={doc.statut} /></td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">
                        {formaterMontant(totauxDocument(doc).total, devise)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            demanderSuppression(doc.id, doc.numero)
                          }}
                          className="text-gray-400 hover:text-red-600 px-2"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Carte>
      )}
    </div>
  )
}
