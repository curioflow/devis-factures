import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { Bouton, Carte, Champ, EtatVide, Saisie, ZoneTexte } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import type { Client } from '../types'

const clientVide = { nom: '', adresse: '', courriel: '', telephone: '', numeroTva: '', notes: '' }

export default function Clients() {
  const clients = useAppStore((s) => s.clients)
  const documents = useAppStore((s) => s.documents)
  const ajouterClient = useAppStore((s) => s.ajouterClient)
  const majClient = useAppStore((s) => s.majClient)
  const supprimerClient = useAppStore((s) => s.supprimerClient)

  const [recherche, setRecherche] = useState('')
  const [enEdition, setEnEdition] = useState<Client | null>(null)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [form, setForm] = useState(clientVide)

  const clientsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => c.nom.toLowerCase().includes(q) || c.courriel.toLowerCase().includes(q),
    )
  }, [clients, recherche])

  const ouvrirNouveau = () => {
    setEnEdition(null)
    setForm(clientVide)
    setFormulaireOuvert(true)
  }

  const ouvrirEdition = (client: Client) => {
    setEnEdition(client)
    setForm({
      nom: client.nom,
      adresse: client.adresse,
      courriel: client.courriel,
      telephone: client.telephone,
      numeroTva: client.numeroTva ?? '',
      notes: client.notes ?? '',
    })
    setFormulaireOuvert(true)
  }

  const enregistrer = () => {
    if (!form.nom.trim()) return
    if (enEdition) {
      majClient(enEdition.id, form)
    } else {
      ajouterClient(form)
    }
    setFormulaireOuvert(false)
  }

  const demanderSuppression = (client: Client) => {
    const utilise = documents.some((d) => d.clientId === client.id)
    if (utilise) {
      alert(
        "Ce client est associé à au moins un devis ou une facture. Vous pouvez le modifier mais pas le supprimer, afin de conserver l'historique de vos documents.",
      )
      return
    }
    if (confirm(`Supprimer le client « ${client.nom} » ?`)) {
      supprimerClient(client.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clients.length} client(s) enregistré(s)</p>
        </div>
        <Bouton onClick={ouvrirNouveau}>+ Ajouter un client</Bouton>
      </div>

      {clients.length > 0 && (
        <Saisie
          placeholder="Rechercher un client par nom ou courriel..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="max-w-sm"
        />
      )}

      {clients.length === 0 ? (
        <Carte>
          <EtatVide
            titre="Aucun client"
            description="Ajoutez vos clients pour pouvoir créer des devis et des factures rapidement."
            action={<Bouton onClick={ouvrirNouveau}>Ajouter mon premier client</Bouton>}
          />
        </Carte>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientsFiltres.map((client) => (
            <Carte key={client.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-800">{client.nom}</h3>
              </div>
              <p className="text-sm text-gray-500 whitespace-pre-line">{client.adresse}</p>
              {client.courriel && <p className="text-sm text-gray-600">✉️ {client.courriel}</p>}
              {client.telephone && <p className="text-sm text-gray-600">📞 {client.telephone}</p>}
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                <Bouton variante="secondaire" className="flex-1" onClick={() => ouvrirEdition(client)}>
                  Modifier
                </Bouton>
                <Bouton variante="danger" onClick={() => demanderSuppression(client)}>
                  Suppr.
                </Bouton>
              </div>
            </Carte>
          ))}
        </div>
      )}

      <Modal ouvert={formulaireOuvert} onFermer={() => setFormulaireOuvert(false)}>
        <Carte className="p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {enEdition ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <div className="space-y-4">
            <Champ label="Nom / Raison sociale *">
              <Saisie
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                autoFocus
              />
            </Champ>
            <Champ label="Adresse">
              <ZoneTexte
                rows={2}
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              />
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Courriel">
                <Saisie
                  type="email"
                  value={form.courriel}
                  onChange={(e) => setForm({ ...form, courriel: e.target.value })}
                />
              </Champ>
              <Champ label="Téléphone">
                <Saisie
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                />
              </Champ>
            </div>
            <Champ label="N° de TVA / entreprise (optionnel)">
              <Saisie
                value={form.numeroTva}
                onChange={(e) => setForm({ ...form, numeroTva: e.target.value })}
              />
            </Champ>
            <Champ label="Notes internes (optionnel)">
              <ZoneTexte
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Champ>
          </div>
          <div className="flex gap-2 mt-6">
            <Bouton className="flex-1" onClick={enregistrer} disabled={!form.nom.trim()}>
              Enregistrer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setFormulaireOuvert(false)}>
              Annuler
            </Bouton>
          </div>
        </Carte>
      </Modal>
    </div>
  )
}
