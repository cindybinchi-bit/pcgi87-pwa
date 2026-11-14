import React, { useEffect, useState } from 'react';
import { X, TreePalm, Handshake } from 'lucide-react';
import { MOTIFS_RDV, demanderConge, ajouterRendezVous } from '../donnees.js';

const deux = (n) => String(n).padStart(2, '0');
const cleJour = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const jourLisible = (cle) => {
  const [a, m, j] = cle.split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const nbJours = (du, au) => {
  const [a1, m1, j1] = du.split('-').map(Number);
  const [a2, m2, j2] = au.split('-').map(Number);
  return Math.round((new Date(a2, m2 - 1, j2) - new Date(a1, m1 - 1, j1)) / 86400000) + 1;
};

/**
 * Fenêtre « Ajouter à mon agenda » (en bas de l'écran).
 * Deux possibilités : demander un congé payé, ou noter un rendez-vous socio-professionnel.
 * - jourInitial : jour déjà choisi dans le calendrier (AAAA-MM-JJ).
 */
export default function FenetreAjoutAgenda({ fiche, structureId, jourInitial, onFerme, onAjoute }) {
  const aujourdhui = cleJour(new Date());
  const depart = jourInitial && jourInitial >= aujourdhui ? jourInitial : aujourdhui;
  const [genre, setGenre] = useState(''); // '' | 'cp' | 'rdv'
  const [du, setDu] = useState(depart);
  const [au, setAu] = useState(depart);
  const [commentaire, setCommentaire] = useState('');
  const [motif, setMotif] = useState('');
  const [precision, setPrecision] = useState('');
  const [jour, setJour] = useState(depart);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [lieu, setLieu] = useState('');
  const [notes, setNotes] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    const echap = (e) => { if (e.key === 'Escape' && !envoi) onFerme?.(); };
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFerme, envoi]);

  function verifier() {
    if (genre === 'cp') {
      if (!du) return 'Indiquez le premier jour de congé.';
      if (du < aujourdhui) return 'Le premier jour ne peut pas être dans le passé.';
      if (!au || au < du) return 'Le dernier jour doit être après le premier jour.';
      if (nbJours(du, au) > 60) return 'Une demande ne peut pas dépasser 60 jours. Faites deux demandes.';
      return '';
    }
    if (!motif) return 'Choisissez avec qui vous avez rendez-vous.';
    if (motif === 'autre' && !precision.trim()) return 'Précisez de quel rendez-vous il s\'agit.';
    if (!jour) return 'Indiquez le jour du rendez-vous.';
    if (jour < aujourdhui) return 'Le rendez-vous ne peut pas être dans le passé.';
    if (!debut) return 'Indiquez l\'heure du rendez-vous.';
    if (fin && fin <= debut) return 'L\'heure de fin doit être après l\'heure de début.';
    return '';
  }

  async function valider() {
    if (envoi) return;
    const probleme = verifier();
    if (probleme) { setErreur(probleme); return; }
    setErreur('');
    setEnvoi(true);
    try {
      if (genre === 'cp') {
        await demanderConge(fiche, structureId, { du, au, commentaire });
        onAjoute?.({ jour: du, texte: 'Votre demande de congé est envoyée. Vous verrez la réponse ici, dans votre agenda.' });
      } else {
        await ajouterRendezVous(fiche, structureId, { motif, precision, jour, debut, fin, lieu, notes });
        onAjoute?.({ jour, texte: 'Rendez-vous ajouté. Votre référent(e) est prévenu(e).' });
      }
    } catch (err) {
      const code = String(err?.code || '');
      setErreur(
        code.includes('permission-denied') ? 'Cette fonction n\'est pas encore activée pour votre structure. Prévenez votre référent(e) par message.'
          : 'L\'ajout n\'a pas fonctionné. Vérifiez votre connexion et réessayez.',
      );
      setEnvoi(false);
    }
  }

  const titre = genre === 'cp' ? 'Demander un congé payé' : genre === 'rdv' ? 'Ajouter un rendez-vous' : 'Ajouter à mon agenda';

  return (
    <div className="depot-voile" role="presentation" onClick={() => { if (!envoi) onFerme?.(); }}>
      <div className="depot-fenetre" role="dialog" aria-modal="true" aria-labelledby="ajout-titre" onClick={(e) => e.stopPropagation()}>
        <div className="depot-entete">
          <h2 id="ajout-titre">{titre}</h2>
          <button type="button" className="depot-fermer" onClick={onFerme} disabled={envoi} aria-label="Fermer">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {!genre ? (
          <div className="ajout-choix">
            <button type="button" className="ajout-carte" onClick={() => setGenre('cp')}>
              <span className="ajout-icone" style={{ background: '#fef3c7', color: '#b45309' }}><TreePalm size={24} aria-hidden="true" /></span>
              <span><strong>Un congé payé</strong><small>Je demande des jours de congé à ma structure</small></span>
            </button>
            <button type="button" className="ajout-carte" onClick={() => setGenre('rdv')}>
              <span className="ajout-icone" style={{ background: '#ccfbf1', color: '#0f766e' }}><Handshake size={24} aria-hidden="true" /></span>
              <span><strong>Un rendez-vous</strong><small>France Travail, Mission locale, assistant(e) social(e)…</small></span>
            </button>
          </div>
        ) : null}

        {genre === 'cp' ? (
          <>
            <div className="ajout-deux">
              <div className="form-field">
                <label htmlFor="cp-du">Premier jour</label>
                <input id="cp-du" type="date" min={aujourdhui} value={du} disabled={envoi}
                  onChange={(e) => { setDu(e.target.value); if (!au || au < e.target.value) setAu(e.target.value); setErreur(''); }} />
              </div>
              <div className="form-field">
                <label htmlFor="cp-au">Dernier jour</label>
                <input id="cp-au" type="date" min={du || aujourdhui} value={au} disabled={envoi}
                  onChange={(e) => { setAu(e.target.value); setErreur(''); }} />
              </div>
            </div>
            {du && au && au >= du ? (
              <p className="ajout-resume">
                {du === au ? `Le ${jourLisible(du)}` : `Du ${jourLisible(du)} au ${jourLisible(au)}`}
              </p>
            ) : null}
            <div className="form-field">
              <label htmlFor="cp-mot">Un mot pour la structure <small>(facultatif)</small></label>
              <textarea id="cp-mot" rows={2} maxLength={500} value={commentaire} disabled={envoi}
                onChange={(e) => setCommentaire(e.target.value)} placeholder="Ex : je peux décaler d'une semaine si besoin" />
            </div>
            <div className="info-box" style={{ marginBottom: 12 }}>
              Ceci est une <strong>demande</strong>. Le congé n'est accordé que lorsque « ✅ Accepté » apparaît dans votre agenda.
            </div>
          </>
        ) : null}

        {genre === 'rdv' ? (
          <>
            <div className="form-field">
              <label htmlFor="rdv-motif">Avec qui ?</label>
              <select id="rdv-motif" value={motif} disabled={envoi} onChange={(e) => { setMotif(e.target.value); setErreur(''); }}>
                <option value="">— Choisir —</option>
                {MOTIFS_RDV.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            {motif === 'autre' ? (
              <div className="form-field">
                <label htmlFor="rdv-precision">Quel rendez-vous ?</label>
                <input id="rdv-precision" type="text" maxLength={80} value={precision} disabled={envoi}
                  onChange={(e) => { setPrecision(e.target.value); setErreur(''); }} placeholder="Ex : rendez-vous à l'auto-école" />
              </div>
            ) : null}
            <div className="form-field">
              <label htmlFor="rdv-jour">Quel jour ?</label>
              <input id="rdv-jour" type="date" min={aujourdhui} value={jour} disabled={envoi}
                onChange={(e) => { setJour(e.target.value); setErreur(''); }} />
            </div>
            <div className="ajout-deux">
              <div className="form-field">
                <label htmlFor="rdv-debut">Heure de début</label>
                <input id="rdv-debut" type="time" value={debut} disabled={envoi} onChange={(e) => { setDebut(e.target.value); setErreur(''); }} />
              </div>
              <div className="form-field">
                <label htmlFor="rdv-fin">Heure de fin <small>(facultatif)</small></label>
                <input id="rdv-fin" type="time" value={fin} disabled={envoi} onChange={(e) => { setFin(e.target.value); setErreur(''); }} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="rdv-lieu">Où ? <small>(facultatif)</small></label>
              <input id="rdv-lieu" type="text" maxLength={150} value={lieu} disabled={envoi}
                onChange={(e) => setLieu(e.target.value)} placeholder="Ex : agence de Saint-Yrieix" />
            </div>
            <div className="form-field">
              <label htmlFor="rdv-notes">Un mot pour votre référent(e) <small>(facultatif)</small></label>
              <textarea id="rdv-notes" rows={2} maxLength={500} value={notes} disabled={envoi}
                onChange={(e) => setNotes(e.target.value)} placeholder="Ex : je serai de retour vers 15 h" />
            </div>
          </>
        ) : null}

        {erreur ? <div className="error-box" role="alert">{erreur}</div> : null}

        {genre ? (
          <>
            <button type="button" className="btn btn-primary" onClick={valider} disabled={envoi}>
              {envoi ? 'Envoi…' : genre === 'cp' ? 'Envoyer ma demande' : 'Ajouter à mon agenda'}
            </button>
            {!envoi ? (
              <button type="button" className="lien ajout-retour" onClick={() => { setGenre(''); setErreur(''); }}>← Choisir autre chose</button>
            ) : null}
          </>
        ) : null}

        <p className="depot-aide" style={{ marginTop: 10 }}>
          🔒 Visible par vous et par l'équipe de votre structure.
        </p>
      </div>
    </div>
  );
}
