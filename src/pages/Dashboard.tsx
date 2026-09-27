import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bouton, Carte, EtatVide } from '../components/ui'
import { totauxDocument } from '../lib/calc'
import { formaterDate, formaterMontant } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

export default function Dashboard() {
  const documents = useAppStore((s) => s.documents)
  const clients = useAppStore((s) => s.clients)
  const devise = useAppStore((s) => s.parametres.devise)
  const entreprise = useAppStore((s) => s.parametres.entreprise)
  const creerDevis = useAppStore((s) => s.creerDevis)
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const devis = documents.filter((d) => d.type === 'devis')
    const factures = documents.filter((d) => d.type === 'facture')
    const devisEnAttente = devis.filter((d) => d.statut === 'envoye' || d.statut === 'brouillon').length
    const facturesImpayees = factures.filter((f) => f.statut !== 'payee')
    const montantImpaye = facturesImpayees.reduce((acc, f) => acc + totauxDocument(f).total, 0)
    const chiffreAffaires = factures
      .filter((f) => f.statut === 'payee')
      .reduce((acc, f) => acc + totauxDocument(f).total, 0)
    return { nbDevis: devis.length, nbFactures: factures.length, devisEnAttente, montantImpaye, chiffreAffaires }
  }, [documents])

  const recents = useMemo(
    () =>
      [...documents]
        .sort((a, b) => b.modifieLe.localeCompare(a.modifieLe))
        .slice(0, 6),
    [documents],
  )

  const entrepriseIncomplete = !entreprise.nom || !entreprise.courriel

  const nouveauDevis = () => {
    const devis = creerDevis()
    navigate(`/devis/${devis.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <Bouton onClick={nouveauDevis}>+ Nouveau devis</Bouton>
      </div>

      {entrepriseIncomplete && (
        <Carte className="p-4 bg-amber-50 border-amber-200 flex items-center justify-between flex-wrap gap-3">
          <p className="text-amber-800 text-sm">
            👋 Bienvenue ! Complétez d'abord vos informations d'entreprise pour des documents professionnels.
          </p>
          <Link to="/parametres" className="text-amber-900 font-semibold text-sm underline whitespace-nowrap">
            Aller aux paramètres →
          </Link>
        </Carte>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CarteStat label="Devis créés" valeur={String(stats.nbDevis)} />
        <CarteStat label="Factures créées" valeur={String(stats.nbFactures)} />
        <CarteStat label="Devis en attente" valeur={String(stats.devisEnAttente)} />
        <CarteStat label="À encaisser" valeur={formaterMontant(stats.montantImpaye, devise)} accent />
      </div>

      <Carte className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Documents récents</h2>
          <Link to="/devis" className="text-primary-600 text-sm font-medium hover:underline">
            Voir tout
          </Link>
        </div>
        {recents.length === 0 ? (
          <EtatVide
            titre="Aucun document pour l'instant"
            description="Créez votre premier devis pour commencer à facturer vos clients."
            action={<Bouton onClick={nouveauDevis}>Créer un devis</Bouton>}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {recents.map((doc) => {
              const client = clients.find((c) => c.id === doc.clientId)
              return (
                <Link
                  key={doc.id}
                  to={`/${doc.type === 'devis' ? 'devis' : 'factures'}/${doc.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {doc.numero} · {client?.nom ?? 'Client à définir'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.type === 'devis' ? 'Devis' : 'Facture'} · {formaterDate(doc.dateEmission)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-700">
                    {formaterMontant(totauxDocument(doc).total, devise)}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </Carte>
    </div>
  )
}

function CarteStat({ label, valeur, accent = false }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <Carte className={`p-4 ${accent ? 'bg-primary-600 text-white' : ''}`}>
      <p className={`text-xs font-medium ${accent ? 'text-primary-100' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-white' : 'text-gray-800'}`}>{valeur}</p>
    </Carte>
  )
}
