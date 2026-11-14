import React, { useMemo, useState } from 'react';
import { CalendarOff, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { libelleType, etatDemande } from '../utils.js';
import { retirerEvenement } from '../donnees.js';
import FenetreAjoutAgenda from '../components/FenetreAjoutAgenda.jsx';

const COULEURS = {
  rdv_referent: { bg: '#e6f1fb', color: 'var(--blue-800)', point: '#0e4bb7' },
  atelier_collectif: { bg: '#eaf3de', color: 'var(--green-700)', point: '#3b6d11' },
  rdv_administratif: { bg: '#faeeda', color: 'var(--amber-700)', point: '#d97706' },
  reunion: { bg: '#f1efe8', color: '#5f5e5a', point: '#78716c' },
  rappel: { bg: '#fcebeb', color: 'var(--red-700)', point: '#dc2626' },
  prestation: { bg: '#f3e8ff', color: '#7c3aed', point: '#7c3aed' },
  conge: { bg: '#fef3c7', color: '#92400e', point: '#f59e0b' },
  cp: { bg: '#fef3c7', color: '#92400e', point: '#f59e0b' },
  absence: { bg: '#fef3c7', color: '#92400e', point: '#f59e0b' },
  absence_sociopro: { bg: '#fcebeb', color: 'var(--red-700)', point: '#be123c' },
  repos: { bg: '#f1efe8', color: '#5f5e5a', point: '#64748b' },
  rdv_exterieur: { bg: '#ccfbf1', color: '#0f766e', point: '#0d9488' },
};
const COULEUR_DEFAUT = { bg: '#f1efe8', color: '#5f5e5a', point: '#78716c' };
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/* ── Dates en heure locale (jamais en UTC, sinon décalage d'un jour) ── */
const deux = (n) => String(n).padStart(2, '0');
const cleJour = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;

function lireDate(v) {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); // date seule : jour local
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
const aUneHeure = (v) => /T\d{2}:\d{2}/.test(String(v || ''));
const heure = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Jours (clés AAAA-MM-JJ) couverts par un événement — 60 jours maximum. */
function joursCouverts(e) {
  const debut = lireDate(e.startAt);
  if (!debut) return [];
  const fin = lireDate(e.endAt);
  const jours = [];
  const j = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate());
  const dernier = fin && fin > debut ? new Date(fin.getFullYear(), fin.getMonth(), fin.getDate()) : new Date(j);
  for (let i = 0; i < 60 && j <= dernier; i += 1) {
    jours.push(cleJour(j));
    j.setDate(j.getDate() + 1);
  }
  return jours;
}

/** Ce que le salarié a ajouté lui-même et peut encore retirer. */
function peutRetirer(e, aujourdhui) {
  if (e.source !== 'beneficiaire') return false;
  const dernierJour = joursCouverts(e).slice(-1)[0] || '';
  if (e.type === 'conge') return etatDemande(e)?.cle === 'attente';
  return dernierJour >= aujourdhui;
}

function Carte({ evenement: e, avecDate = false, structureId, aujourdhui }) {
  const [confirmer, setConfirmer] = useState(false);
  const [retrait, setRetrait] = useState(false);
  const [echec, setEchec] = useState('');
  const etat = etatDemande(e);
  const retirable = structureId ? peutRetirer(e, aujourdhui) : false;

  async function retirer() {
    setRetrait(true);
    setEchec('');
    try {
      await retirerEvenement(structureId, e.id);
    } catch {
      setEchec('Impossible pour le moment. Prévenez votre référent(e) par message.');
      setRetrait(false);
      setConfirmer(false);
    }
  }

  const debut = lireDate(e.startAt);
  const fin = lireDate(e.endAt);
  const couleurs = COULEURS[e.type] || COULEUR_DEFAUT;
  const plusieursJours = debut && fin && cleJour(fin) !== cleJour(debut);
  let horaire = '';
  if (debut && !e.allDay && aUneHeure(e.startAt)) {
    horaire = heure(debut);
    if (fin && e.endAt !== e.startAt) {
      horaire += plusieursJours
        ? ` → ${fin.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}${aUneHeure(e.endAt) ? ` ${heure(fin)}` : ''}`
        : ` – ${heure(fin)}`;
    }
  } else if (plusieursJours) {
    horaire = `Jusqu'au ${fin.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  } else {
    horaire = 'Toute la journée';
  }
  return (
    <div className="agenda-card" style={{ borderLeft: `4px solid ${couleurs.point}`, opacity: etat?.cle === 'refuse' ? 0.75 : 1 }}>
      {avecDate ? (
        <div className="agenda-date-chip">
          <span>{debut ? debut.toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
          <strong>{debut ? debut.getDate() : '—'}</strong>
        </div>
      ) : null}
      <div className="agenda-info" style={{ flex: 1 }}>
        <strong>{e.title || libelleType(e.type)}</strong>
        <p>🕒 {horaire}</p>
        {e.lieu ? <p style={{ marginTop: 4, fontSize: '0.8rem' }}>📍 {e.lieu}</p> : null}
        {e.notes ? <p style={{ marginTop: 4, fontStyle: 'italic', fontSize: '0.8rem' }}>{e.notes}</p> : null}
        <span className="badge" style={{ background: couleurs.bg, color: couleurs.color, marginTop: 6 }}>{libelleType(e.type)}</span>
        {etat ? <span className={`badge ${etat.classe}`} style={{ marginTop: 6, marginLeft: 6 }}>{etat.texte}</span> : null}
        {e.source === 'beneficiaire' && !etat ? <span className="badge badge-gray" style={{ marginTop: 6, marginLeft: 6 }}>Ajouté par moi</span> : null}
        {etat?.cle === 'refuse' && e.motifRefus ? <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--red-700)' }}>Motif : {e.motifRefus}</p> : null}
        {echec ? <p role="alert" style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--red-700)' }}>{echec}</p> : null}
        {retirable && !confirmer ? (
          <button type="button" className="lien agenda-retirer" onClick={() => setConfirmer(true)}>
            {e.type === 'conge' ? 'Annuler ma demande' : 'Supprimer ce rendez-vous'}
          </button>
        ) : null}
        {retirable && confirmer ? (
          <div className="agenda-confirmer">
            <span>{e.type === 'conge' ? 'Annuler cette demande ?' : 'Supprimer ce rendez-vous ?'}</span>
            <button type="button" className="btn btn-danger" onClick={retirer} disabled={retrait}>{retrait ? '…' : 'Oui'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmer(false)} disabled={retrait}>Non</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function trier(a, b) {
  return String(a.startAt || '').localeCompare(String(b.startAt || ''));
}

export default function AgendaPage({ agenda, fiche, structureId }) {
  const aujourdhui = cleJour(new Date());
  const [ajout, setAjout] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [mois, setMois] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [jourChoisi, setJourChoisi] = useState(aujourdhui);
  const [vue, setVue] = useState('calendrier');

  // Événements rangés par jour
  const parJour = useMemo(() => {
    const m = new Map();
    agenda.forEach((e) => joursCouverts(e).forEach((k) => {
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(e);
    }));
    m.forEach((l) => l.sort(trier));
    return m;
  }, [agenda]);

  const { avenir, passes } = useMemo(() => {
    const finDuJour = (e) => joursCouverts(e).slice(-1)[0] || '';
    return {
      avenir: agenda.filter((e) => finDuJour(e) >= aujourdhui).sort(trier),
      passes: agenda.filter((e) => finDuJour(e) && finDuJour(e) < aujourdhui).sort((a, b) => trier(b, a)),
    };
  }, [agenda, aujourdhui]);

  // Cases de la grille : semaines du lundi au dimanche
  const cases = useMemo(() => {
    const premier = new Date(mois);
    const decalage = (premier.getDay() + 6) % 7; // lundi = 0
    const debut = new Date(premier.getFullYear(), premier.getMonth(), 1 - decalage);
    const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
    const total = Math.ceil((decalage + nbJours) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      return { d, cle: cleJour(d), dansLeMois: d.getMonth() === mois.getMonth() };
    });
  }, [mois]);

  function changerMois(delta) {
    const n = new Date(mois.getFullYear(), mois.getMonth() + delta, 1);
    setMois(n);
    // Sélectionne aujourd'hui si on revient sur le mois en cours, sinon le 1er rendez-vous du mois (ou le 1er du mois)
    const prefixe = `${n.getFullYear()}-${deux(n.getMonth() + 1)}`;
    if (aujourdhui.startsWith(prefixe)) { setJourChoisi(aujourdhui); return; }
    const premierRdv = [...parJour.keys()].filter((k) => k.startsWith(prefixe)).sort()[0];
    setJourChoisi(premierRdv || `${prefixe}-01`);
  }

  function revenirAujourdhui() {
    const d = new Date();
    setMois(new Date(d.getFullYear(), d.getMonth(), 1));
    setJourChoisi(aujourdhui);
  }

  const evenementsDuJour = parJour.get(jourChoisi) || [];
  const dateChoisie = lireDate(jourChoisi);
  const titreJour = dateChoisie
    ? `${jourChoisi === aujourdhui ? "Aujourd'hui, " : ''}${JOURS_LONGS[(dateChoisie.getDay() + 6) % 7]} ${dateChoisie.getDate()} ${dateChoisie.toLocaleDateString('fr-FR', { month: 'long' })}`
    : '';
  const prochains = avenir.filter((e) => (joursCouverts(e)[0] || '') > jourChoisi).slice(0, 3);
  const titreMois = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const carte = { structureId, aujourdhui };

  function apresAjout({ jour, texte }) {
    setAjout(false);
    setConfirmation(texte);
    const d = lireDate(jour);
    if (d) { setMois(new Date(d.getFullYear(), d.getMonth(), 1)); setJourChoisi(jour); }
    setVue('calendrier');
  }

  return (
    <main className="page-content">
      <div className="page-header agenda-entete">
        <div>
          <h1>Mon agenda</h1>
          <p>Rendez-vous, ateliers et congés</p>
        </div>
        <button type="button" className="btn btn-primary agenda-ajouter" onClick={() => { setConfirmation(''); setAjout(true); }}>
          <Plus size={18} aria-hidden="true" /> Ajouter
        </button>
      </div>

      {confirmation ? <div className="info-box" role="status" style={{ margin: '12px 16px 0' }}>✓ {confirmation}</div> : null}

      <div className="tab-bar" role="tablist">
        <button type="button" role="tab" aria-selected={vue === 'calendrier'} className={`tab-pill ${vue === 'calendrier' ? 'active' : ''}`} onClick={() => setVue('calendrier')}>
          📅 Calendrier
        </button>
        <button type="button" role="tab" aria-selected={vue === 'avenir'} className={`tab-pill ${vue === 'avenir' ? 'active' : ''}`} onClick={() => setVue('avenir')}>
          À venir ({avenir.length})
        </button>
        <button type="button" role="tab" aria-selected={vue === 'passes'} className={`tab-pill ${vue === 'passes' ? 'active' : ''}`} onClick={() => setVue('passes')}>
          Passés ({passes.length})
        </button>
      </div>

      {vue === 'calendrier' ? (
        <>
          <div className="card calendrier">
            <div className="calendrier-entete">
              <button type="button" className="calendrier-fleche" onClick={() => changerMois(-1)} aria-label="Mois précédent">
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <h2 aria-live="polite">{titreMois}</h2>
              <button type="button" className="calendrier-fleche" onClick={() => changerMois(1)} aria-label="Mois suivant">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="calendrier-grille" role="grid" aria-label={`Calendrier de ${titreMois}`}>
              {JOURS.map((j, i) => <div key={`t${i}`} className={`calendrier-jour-nom ${i >= 5 ? 'we' : ''}`} aria-hidden="true">{j}</div>)}
              {cases.map(({ d, cle, dansLeMois }) => {
                const evts = parJour.get(cle) || [];
                const classes = [
                  'calendrier-case',
                  dansLeMois ? '' : 'hors-mois',
                  cle === aujourdhui ? 'aujourdhui' : '',
                  cle === jourChoisi ? 'choisi' : '',
                  evts.length ? 'avec-rdv' : '',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={cle}
                    type="button"
                    role="gridcell"
                    className={classes}
                    aria-selected={cle === jourChoisi}
                    aria-label={`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${evts.length ? `, ${evts.length} rendez-vous` : ''}`}
                    onClick={() => {
                      setJourChoisi(cle);
                      if (!dansLeMois) setMois(new Date(d.getFullYear(), d.getMonth(), 1));
                    }}
                  >
                    <span className="calendrier-num">{d.getDate()}</span>
                    {evts.length ? (
                      <span className="calendrier-points" aria-hidden="true">
                        {evts.slice(0, 3).map((e, i) => (
                          <i key={e.id || i} style={{ background: (COULEURS[e.type] || COULEUR_DEFAUT).point }} />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {(jourChoisi !== aujourdhui || !aujourdhui.startsWith(`${mois.getFullYear()}-${deux(mois.getMonth() + 1)}`)) ? (
              <button type="button" className="lien calendrier-auj" onClick={revenirAujourdhui}>Revenir à aujourd'hui</button>
            ) : null}
          </div>

          <div className="section-label" style={{ textTransform: 'none' }}>{titreJour}</div>
          {evenementsDuJour.length ? (
            <div className="card" style={{ padding: 0 }}>
              {evenementsDuJour.map((e) => <Carte key={e.id} evenement={e} {...carte} />)}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Rien de prévu ce jour-là.
            </div>
          )}
          {jourChoisi >= aujourdhui ? (
            <button type="button" className="agenda-ajouter-jour" onClick={() => { setConfirmation(''); setAjout(true); }}>
              <Plus size={16} aria-hidden="true" /> Ajouter un congé ou un rendez-vous ce jour-là
            </button>
          ) : null}

          {prochains.length ? (
            <>
              <div className="section-label">Ensuite</div>
              <div className="card" style={{ padding: 0 }}>
                {prochains.map((e) => <Carte key={e.id} evenement={e} avecDate {...carte} />)}
              </div>
            </>
          ) : null}
        </>
      ) : (
        (vue === 'avenir' ? avenir : passes).length === 0 ? (
          <div className="empty-state">
            <CalendarOff size={40} aria-hidden="true" />
            <p>{vue === 'avenir' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous passé.'}</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {(vue === 'avenir' ? avenir : passes).map((e) => <Carte key={e.id} evenement={e} avecDate {...carte} />)}
          </div>
        )
      )}

      {ajout ? (
        <FenetreAjoutAgenda
          fiche={fiche}
          structureId={structureId}
          jourInitial={vue === 'calendrier' ? jourChoisi : aujourdhui}
          onFerme={() => setAjout(false)}
          onAjoute={apresAjout}
        />
      ) : null}
    </main>
  );
}
