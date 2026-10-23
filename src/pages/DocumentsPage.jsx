import React, { useMemo } from 'react';
import { FileText, FileCheck, FileClock, Download, FolderOpen } from 'lucide-react';
import { urlSure } from '../utils.js';

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

export default function DocumentsPage({ messages, charge }) {
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
    <main className="page-content">
      <div className="page-header">
        <h1>Documents</h1>
        <p>Pièces et documents partagés par votre structure</p>
      </div>

      {!charge ? <p style={{ textAlign: 'center', marginTop: 30 }}>Chargement…</p> : null}

      {charge && !docs.length && !convocations.length ? (
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

      <div className="card">
        <p style={{ fontSize: '0.82rem' }}>
          🔒 Ces documents sont personnels. Si vous les téléchargez sur un téléphone partagé,
          pensez à les supprimer ensuite.
        </p>
      </div>
    </main>
  );
}
