import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CONTACTS_STRUCTURES } from '../utils.js';

const MISE_A_JOUR = 'octobre 2026';

function Bloc({ titre, children }) {
  return (
    <section className="card bloc-rgpd">
      <h2>{titre}</h2>
      {children}
    </section>
  );
}

export default function ConfidentialitePage({ structureId, onRetour }) {
  const contact = CONTACTS_STRUCTURES[structureId];
  const toutes = Object.values(CONTACTS_STRUCTURES);

  return (
    <main className="page-content page-rgpd" style={{ paddingBottom: 32 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={onRetour} aria-label="Retour" style={{ padding: 8 }}>
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div>
          <h1>Vos données personnelles</h1>
          <p>Ce que nous faisons de vos informations, en clair.</p>
        </div>
      </div>

      <Bloc titre="Qui est responsable de vos données ?">
        {contact ? (
          <p>
            La structure qui vous accompagne : <strong>{contact.nom}</strong>
            {contact.adresse ? `, ${contact.adresse}` : ''}. Contact : <strong>{contact.email}</strong>.
          </p>
        ) : (
          <>
            <p>La structure qui vous accompagne :</p>
            <ul>
              {toutes.map((s) => <li key={s.nom}><strong>{s.nom}</strong> — {s.email}</li>)}
            </ul>
          </>
        )}
        <p>Mon Espace fait partie de la plateforme PCGI 87, l'outil commun utilisé par les structures d'insertion partenaires.</p>
      </Bloc>

      <Bloc titre="À quoi servent vos données ?">
        <ul>
          <li>suivre votre parcours d'insertion avec votre référent(e) ;</li>
          <li>organiser vos rendez-vous et ateliers ;</li>
          <li>échanger des messages avec votre référent(e) ;</li>
          <li>vous transmettre vos documents (contrats, bulletins de salaire, convocations).</li>
        </ul>
        <p>Elles sont utilisées dans le cadre de votre accompagnement ou de votre contrat, et pour les obligations légales de la structure.</p>
      </Bloc>

      <Bloc titre="Quelles données voyez-vous ici ?">
        <p>Votre identité, vos coordonnées, votre date d'entrée, votre prescripteur, votre projet professionnel, vos rendez-vous, vos messages et vos documents.</p>
      </Bloc>

      <Bloc titre="Qui peut les voir ?">
        <p>
          Uniquement l'équipe de votre structure qui vous accompagne. Vos données ne sont <strong>jamais vendues</strong>,
          ne servent pas à la publicité et ne font l'objet d'<strong>aucun suivi statistique</strong> (pas de Google Analytics,
          pas de cookies publicitaires).
        </p>
        <p>
          Elles sont hébergées par Google (service Firebase), qui agit pour le compte de la structure, sur des serveurs
          situés dans l'Union européenne (Francfort, Allemagne).
        </p>
      </Bloc>

      <Bloc titre="Combien de temps sont-elles gardées ?">
        <p>
          Pendant votre accompagnement, puis le temps nécessaire aux obligations légales de la structure.
          Elles sont ensuite supprimées ou rendues anonymes.
        </p>
        <p>L'historique des connexions (date, réussite ou échec) est conservé 12 mois pour la sécurité de votre compte.</p>
      </Bloc>

      <Bloc titre="Et sur votre téléphone ?">
        <p>
          Rien n'est enregistré sur votre téléphone, sauf si vous cochez « Rester connecté(e) ». Dans ce cas, seule
          votre connexion est gardée. Se déconnecter la supprime. Votre code n'est jamais enregistré en clair,
          ni sur le téléphone ni sur nos serveurs.
        </p>
      </Bloc>

      <Bloc titre="Quels sont vos droits ?">
        <p>Vous pouvez à tout moment demander :</p>
        <ul>
          <li>à <strong>voir</strong> les données qui vous concernent (droit d'accès) ;</li>
          <li>à les <strong>corriger</strong> si elles sont fausses (rectification) ;</li>
          <li>à les <strong>effacer</strong> ou à en <strong>limiter</strong> l'usage, quand la loi le permet ;</li>
          <li>à vous <strong>opposer</strong> à certains usages.</li>
        </ul>
        <p>
          Parlez-en à votre référent(e) ou écrivez à {contact ? <strong>{contact.email}</strong> : 'votre structure'}.
          Une réponse vous sera donnée dans un délai d'un mois.
        </p>
      </Bloc>

      <Bloc titre="Un problème ?">
        <p>
          Si vous pensez que vos droits ne sont pas respectés, vous pouvez faire une réclamation auprès de la CNIL :
          {' '}<a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">www.cnil.fr/fr/plaintes</a>
          {' '}ou par courrier : CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </p>
      </Bloc>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', padding: '0 16px' }}>Dernière mise à jour : {MISE_A_JOUR}</p>
    </main>
  );
}
