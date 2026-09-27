import { useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { Bouton, Carte, Champ, Saisie, Selection, ZoneTexte } from '../components/ui'
import { dateAujourdhuiISO } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { DEVISES, PROFILS_PREDEFINIS, type TauxTaxe } from '../types'

export default function Parametres() {
  const parametres = useAppStore((s) => s.parametres)
  const majEntreprise = useAppStore((s) => s.majEntreprise)
  const majParametres = useAppStore((s) => s.majParametres)
  const exporterDonnees = useAppStore((s) => s.exporterDonnees)
  const importerDonnees = useAppStore((s) => s.importerDonnees)
  const reinitialiser = useAppStore((s) => s.reinitialiser)

  const inputImportRef = useRef<HTMLInputElement>(null)
  const [messageImport, setMessageImport] = useState<string | null>(null)

  const entreprise = parametres.entreprise

  const appliquerProfil = (profilId: string) => {
    const profil = PROFILS_PREDEFINIS.find((p) => p.id === profilId)
    majParametres({
      profilTaxeId: profilId,
      tauxTaxesParDefaut: profil ? profil.taux.map((t) => ({ ...t, id: uuid() })) : [],
    })
  }

  const majTaux = (index: number, patch: Partial<TauxTaxe>) => {
    const nouveaux = parametres.tauxTaxesParDefaut.map((t, i) => (i === index ? { ...t, ...patch } : t))
    majParametres({ tauxTaxesParDefaut: nouveaux, profilTaxeId: 'personnalise' })
  }

  const ajouterTaux = () => {
    majParametres({
      tauxTaxesParDefaut: [...parametres.tauxTaxesParDefaut, { id: uuid(), nom: 'Nouvelle taxe', taux: 0 }],
      profilTaxeId: 'personnalise',
    })
  }

  const supprimerTaux = (index: number) => {
    majParametres({
      tauxTaxesParDefaut: parametres.tauxTaxesParDefaut.filter((_, i) => i !== index),
      profilTaxeId: 'personnalise',
    })
  }

  const gererLogo = (fichier: File | null) => {
    if (!fichier) return
    if (fichier.size > 600_000) {
      alert("Cette image est un peu lourde. Choisissez une image plus légère (moins de 600 Ko) pour un PDF rapide.")
      return
    }
    const lecteur = new FileReader()
    lecteur.onload = () => majEntreprise({ logoDataUrl: lecteur.result as string })
    lecteur.readAsDataURL(fichier)
  }

  const telechargerSauvegarde = () => {
    const json = exporterDonnees()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sauvegarde-devis-factures-${dateAujourdhuiISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importerFichier = (fichier: File | null) => {
    if (!fichier) return
    const lecteur = new FileReader()
    lecteur.onload = () => {
      try {
        importerDonnees(lecteur.result as string)
        setMessageImport('✅ Données importées avec succès.')
      } catch {
        setMessageImport("❌ Le fichier n'est pas valide.")
      }
    }
    lecteur.readAsText(fichier)
  }

  const demanderReinitialisation = () => {
    if (confirm('Cette action supprimera définitivement toutes vos données (clients, devis, factures, paramètres). Continuer ?')) {
      reinitialiser()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configurez vos informations, votre devise et vos taxes.</p>
      </div>

      <Carte className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Mon entreprise</h2>
        <div className="flex items-center gap-4">
          {entreprise.logoDataUrl ? (
            <img src={entreprise.logoDataUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
          ) : (
            <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center">
              Logo
            </div>
          )}
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200">
                Choisir un logo
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => gererLogo(e.target.files?.[0] ?? null)}
              />
            </label>
            {entreprise.logoDataUrl && (
              <Bouton variante="discret" onClick={() => majEntreprise({ logoDataUrl: undefined })}>
                Retirer
              </Bouton>
            )}
          </div>
        </div>

        <Champ label="Nom / raison sociale *">
          <Saisie value={entreprise.nom} onChange={(e) => majEntreprise({ nom: e.target.value })} />
        </Champ>
        <Champ label="Adresse">
          <ZoneTexte rows={2} value={entreprise.adresse} onChange={(e) => majEntreprise({ adresse: e.target.value })} />
        </Champ>
        <div className="grid sm:grid-cols-2 gap-3">
          <Champ label="Numéro d'entreprise">
            <Saisie value={entreprise.numeroEntreprise} onChange={(e) => majEntreprise({ numeroEntreprise: e.target.value })} />
          </Champ>
          <Champ label="Téléphone">
            <Saisie value={entreprise.telephone} onChange={(e) => majEntreprise({ telephone: e.target.value })} />
          </Champ>
        </div>
        <Champ label="Courriel *">
          <Saisie type="email" value={entreprise.courriel} onChange={(e) => majEntreprise({ courriel: e.target.value })} />
        </Champ>
        <Champ label="Mentions par défaut (conditions de paiement, remerciements...)">
          <ZoneTexte
            rows={3}
            value={entreprise.mentions ?? ''}
            onChange={(e) => majEntreprise({ mentions: e.target.value })}
            placeholder="Ex. : Paiement à réception. Merci de votre confiance !"
          />
        </Champ>
      </Carte>

      <Carte className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Devise</h2>
        <Champ label="Devise utilisée pour vos documents">
          <Selection value={parametres.devise} onChange={(e) => majParametres({ devise: e.target.value as typeof parametres.devise })}>
            {DEVISES.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </Selection>
        </Champ>
      </Carte>

      <Carte className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Taxes</h2>
        <p className="text-sm text-gray-500">
          Choisissez un modèle selon votre pays, ou personnalisez vos propres taux. Ces taux seront proposés par
          défaut pour chaque nouveau document (modifiables au cas par cas).
        </p>
        <Champ label="Modèle de taxes">
          <Selection value={parametres.profilTaxeId} onChange={(e) => appliquerProfil(e.target.value)}>
            {PROFILS_PREDEFINIS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </Selection>
        </Champ>

        <div className="space-y-2">
          {parametres.tauxTaxesParDefaut.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2">
              <Saisie
                value={t.nom}
                onChange={(e) => majTaux(i, { nom: e.target.value })}
                placeholder="Nom (ex. TVA)"
                className="flex-1"
              />
              <div className="relative w-32">
                <Saisie
                  type="number"
                  step="0.001"
                  value={t.taux}
                  onChange={(e) => majTaux(i, { taux: parseFloat(e.target.value) || 0 })}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <Bouton variante="danger" onClick={() => supprimerTaux(i)} aria-label="Supprimer ce taux">
                ✕
              </Bouton>
            </div>
          ))}
          {parametres.tauxTaxesParDefaut.length === 0 && (
            <p className="text-sm text-gray-400 italic">Aucune taxe — vos documents seront émis hors taxes.</p>
          )}
        </div>
        <Bouton variante="secondaire" onClick={ajouterTaux}>
          + Ajouter un taux
        </Bouton>
      </Carte>

      <Carte className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Numérotation</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Champ label="Préfixe des devis">
            <Saisie value={parametres.prefixeDevis} onChange={(e) => majParametres({ prefixeDevis: e.target.value })} />
          </Champ>
          <Champ label="Prochain numéro de devis">
            <Saisie
              type="number"
              min={1}
              value={parametres.compteurs.devis}
              onChange={(e) =>
                majParametres({ compteurs: { ...parametres.compteurs, devis: parseInt(e.target.value) || 1 } })
              }
            />
          </Champ>
          <Champ label="Préfixe des factures">
            <Saisie value={parametres.prefixeFacture} onChange={(e) => majParametres({ prefixeFacture: e.target.value })} />
          </Champ>
          <Champ label="Prochain numéro de facture">
            <Saisie
              type="number"
              min={1}
              value={parametres.compteurs.facture}
              onChange={(e) =>
                majParametres({ compteurs: { ...parametres.compteurs, facture: parseInt(e.target.value) || 1 } })
              }
            />
          </Champ>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Champ label="Validité des devis (jours)">
            <Saisie
              type="number"
              min={1}
              value={parametres.delaiValiditeDevisJours}
              onChange={(e) => majParametres({ delaiValiditeDevisJours: parseInt(e.target.value) || 30 })}
            />
          </Champ>
          <Champ label="Échéance des factures (jours)">
            <Saisie
              type="number"
              min={1}
              value={parametres.delaiEcheanceFactureJours}
              onChange={(e) => majParametres({ delaiEcheanceFactureJours: parseInt(e.target.value) || 30 })}
            />
          </Champ>
        </div>
      </Carte>

      <Carte className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Sauvegarde de vos données</h2>
        <p className="text-sm text-gray-500">
          Toutes vos données restent uniquement dans ce navigateur. Pensez à exporter régulièrement une sauvegarde
          (par exemple avant de vider votre navigateur ou de changer d'appareil).
        </p>
        <div className="flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={telechargerSauvegarde}>
            ⬇ Télécharger une sauvegarde
          </Bouton>
          <Bouton variante="secondaire" onClick={() => inputImportRef.current?.click()}>
            ⬆ Importer une sauvegarde
          </Bouton>
          <input
            ref={inputImportRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importerFichier(e.target.files?.[0] ?? null)}
          />
        </div>
        {messageImport && <p className="text-sm">{messageImport}</p>}
      </Carte>

      <Carte className="p-6 space-y-3 border-red-200">
        <h2 className="font-semibold text-red-700">Zone de danger</h2>
        <p className="text-sm text-gray-500">Supprime définitivement toutes vos données locales.</p>
        <Bouton variante="danger" onClick={demanderReinitialisation}>
          Réinitialiser toutes les données
        </Bouton>
      </Carte>
    </div>
  )
}
