import React, { useMemo, useRef, useState } from 'react';
import { FileText, FileCheck, FileClock, Download, FolderOpen, Upload, Send } from 'lucide-react';
import { urlSure } from '../utils.js';
import { CATEGORIES_DEPOT } from '../donnees.js';
import FenetreDepot from '../components/FenetreDepot.jsx';

// Mêmes dossiers que l'application bureau (Secrétariat > Dossiers & envois)
const DOSSIERS = {
  paie: { label: 'Bulletins de salaire', icon: FileText, color: '#eaf3de', iconColor: 'var(--green-700)' },
  contrat: { label: 'Contrats', icon: FileCheck, color: '#e6f1fb', iconColor: 'var(--blue-700)' },
  convocation: { label: 'Convocations', icon: FileClock, color: '#faeeda', iconColor: 'var(--amber-700)' },
  courrier: { label: 'Courriers', icon: FileText, color: '#f3e8ff', iconColor: '#7e22ce' },
  administratif: { label: 'Pièces administratives', icon: FileText, color: '#e0f2fe', iconColor: '#0369a1' },
  autre: { label: 'Autres documents', icon: FileText, color: '#f1efe8', iconColor: '#5f5e5a' },
};
const ORDRE = ['paie', 'contrat', 'convocation', 'courrier', 'administratif', 'autre'];

function date(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR');
}

function Document({ item }) {
  const dossier = DOSSIERS[item.folder] || DOSSIERS.autre;
  const Icone = dossier.icon;
  return (
    <div className="doc-item">
      <div className="doc-icon" style={{ background: dossier.color }}><Icone size={20} color={dossier.iconColor} aria-hidden="true" /></div>
      <div className="doc-info">
        <strong>{item.title}</strong>
        <p>Reçu le {date(item.date)}{item.from ? ` · ${item.from}` : ''}</p>
      </div>
      <div className="doc-action">
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--blue-700)', fontWeight: 500 }}>
          <Download size={15} aria-hidden="true" /> Ouvrir
        </a>
      </div>
    </div>
  );
}

export default function DocumentsPage({ fiche, structureId, messages, charge, aSigner = 0, onSignatures }) {
  const [depot, setDepot] = useState(null); // null | { fichier }
  const [survol, setSurvol] = useState(false);
  const [envoye, setEnvoye] = useState('');
  const compteur = useRef(0);

  // Documents que j'ai envoyés moi-même
  const mesEnvois = useMemo(() => messages
    .filter((m) => m.authorType === 'beneficiary' && urlSure(m.attachment?.url))
    .map((m) => ({
      id: m.id,
      title: m.attachment.name || 'Document',
      url: urlSure(m.attachment.url),
      categorie: CATEGORIES_DEPOT.find((c) => c.id === m.attachment.categorie)?.label.replace(/\s*\(.*\)$/, '') || 'Document',
      date: m.createdAt,
      lu: Boolean(m.readAt),
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date))), [messages]);

  const avecFichiers = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
  const glisser = {
    onDragEnter: (e) => { if (!avecFichiers(e)) return; e.preventDefault(); compteur.current += 1; setSurvol(true); },
    onDragOver: (e) => { if (avecFichiers(e)) e.preventDefault(); },
    onDragLeave: () => { compteur.current = Math.max(0, compteur.current - 1); if (!compteur.current) setSurvol(false); },
    onDrop: (e) => {
      if (!avecFichiers(e)) return;
      e.preventDefault();
      compteur.current = 0;
      setSurvol(false);
      const f = e.dataTransfer.files?.[0];
      if (f) { setEnvoye(''); setDepot({ fichier: f }); }
    },
  };

  const docs = useMemo(() => {
    const vus = new Map();
    messages.filter((m) => m.authorType === 'professional').forEach((m) => {
      const docUrl = urlSure(m.document?.url);
      if (docUrl) {
        const cle = m.document.id || docUrl;
        vus.set(cle, {
          id: cle,
          title: m.document.title || m.document.fileName || 'Document',
          url: docUrl,
          folder: DOSSIERS[m.document.folder] ? m.document.folder : 'autre',
          date: m.createdAt,
          from: m.authorName || '',
        });
        return;
      }
      const a = m.attachment;
      const url = a ? urlSure(a.url || a.downloadUrl || a.downloadURL || a.dataUrl) : '';
      if (url) vus.set(url, { id: url, title: a.name || 'Pièce jointe', url, folder: 'autre', date: m.createdAt, from: m.authorName || '' });
    });
    return [...vus.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [messages]);

  const convocations = useMemo(() => messages
    .filter((m) => m.authorType === 'professional' && m.kind === 'convocation')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [messages]);

  const groupes = ORDRE
    .map((cle) => ({ cle, ...DOSSIERS[cle], items: docs.filter((d) => d.folder === cle) }))
    .filter((g) => g.items.length);

  return (
    <main className="page-content" {...glisser}>
      <div className="page-header">
        <h1>Documents</h1>
        <p>Vos documents et ceux de votre structure</p>
      </div>

      <div
        className={`depot-zone ${survol ? 'survol' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => { setEnvoye(''); setDepot({ fichier: null }); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEnvoye(''); setDepot({ fichier: null }); } }}
      >
        <span className="depot-zone-icone"><Upload size={26} aria-hidden="true" /></span>
        <strong>{survol ? 'Lâchez le fichier ici' : 'Envoyer un document'}</strong>
        <small>Photo, PDF ou Word · touchez ici{' '}<span className="depot-zone-ordi">ou glissez un fichier</span></small>
      </div>

      {envoye ? <div className="info-box" role="status" style={{ margin: '0 16px 12px' }}>✓ « {envoye} » a bien été envoyé à votre référent(e).</div> : null}

      {onSignatures ? (
        <button type="button" className="card" onClick={onSignatures}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: 'calc(100% - 32px)', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', marginTop: 12, border: `2px solid ${aSigner ? '#f59e0b' : 'var(--border)'}`, background: aSigner ? '#fffbeb' : undefined }}>
          <span style={{ fontSize: 24 }} aria-hidden="true">✍️</span>
          <span style={{ flex: 1 }}>
            <strong style={{ display: 'block' }}>Documents à signer</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{aSigner ? `${aSigner} en attente de votre signature` : 'Contrat d’engagement, évaluations signées'}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      ) : null}

      {!charge ? <p style={{ textAlign: 'center', marginTop: 30 }}>Chargement…</p> : null}

      {charge && !docs.length && !convocations.length && !mesEnvois.length ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <FolderOpen size={40} aria-hidden="true" />
          <p>Aucun document pour l'instant.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>Vos bulletins de salaire, contrats et convocations apparaîtront ici.</p>
        </div>
      ) : null}

      {convocations.length ? (
        <>
          <div className="section-label">Mes convocations ({convocations.length})</div>
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            {convocations.slice(0, 10).map((c) => (
              <div key={c.id} style={{ borderLeft: '4px solid #d97706', background: '#fffbeb', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: '#92400e', marginBottom: 4 }}>Reçue le {date(c.createdAt)}</div>
                <div style={{ whiteSpace: 'pre-line', fontSize: '0.86rem', color: '#78350f' }}>{c.content}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {groupes.map((g) => (
        <React.Fragment key={g.cle}>
          <div className="section-label">{g.label} ({g.items.length})</div>
          <div className="card" style={{ padding: 0 }}>
            {g.items.map((item) => <Document key={item.id} item={item} />)}
          </div>
        </React.Fragment>
      ))}

      {mesEnvois.length ? (
        <>
          <div className="section-label">Mes envois ({mesEnvois.length})</div>
          <div className="card" style={{ padding: 0 }}>
            {mesEnvois.map((d) => (
              <div key={d.id} className="doc-item">
                <div className="doc-icon" style={{ background: '#e0e7ff' }}><Send size={18} color="#4338ca" aria-hidden="true" /></div>
                <div className="doc-info">
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</strong>
                  <p>{d.categorie} · envoyé le {date(d.date)} · <span style={{ color: d.lu ? '#0e9f6e' : 'var(--text-subtle)' }}>{d.lu ? '✓✓ Vu' : '✓ Envoyé'}</span></p>
                </div>
                <div className="doc-action">
                  <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--blue-700)', fontWeight: 500 }}>
                    <Download size={15} aria-hidden="true" /> Ouvrir
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="card">
        <p style={{ fontSize: '0.82rem' }}>
          🔒 Ces documents sont personnels. Si vous les téléchargez sur un téléphone partagé,
          pensez à les supprimer ensuite.
        </p>
      </div>

      {depot ? (
        <FenetreDepot
          fiche={fiche}
          structureId={structureId}
          fichierInitial={depot.fichier}
          onFerme={() => setDepot(null)}
          onEnvoye={(nom) => { setDepot(null); setEnvoye(nom); }}
        />
      ) : null}
    </main>
  );
}
