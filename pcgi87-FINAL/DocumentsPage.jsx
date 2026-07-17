import React, { useMemo } from 'react';
import { load, STORAGE_KEYS, formatDate } from './storage.js';
import { FileText, FileCheck, FileClock, Download, FolderOpen } from 'lucide-react';

const DOC_TYPES = {
  contract: { label: 'Contrat', icon: FileCheck, color: '#e6f1fb', iconColor: 'var(--blue-700)' },
  payslip:  { label: 'Bulletin de salaire', icon: FileText, color: '#eaf3de', iconColor: 'var(--green-700)' },
  convocation: { label: 'Convocation', icon: FileClock, color: '#faeeda', iconColor: 'var(--amber-700)' },
  other:    { label: 'Document', icon: FileText, color: '#f1efe8', iconColor: '#5f5e5a' },
};

function DocItem({ doc }) {
  const type = DOC_TYPES[doc.type] || DOC_TYPES.other;
  const Icon = type.icon;

  return (
    <div className="doc-item">
      <div className="doc-icon" style={{ background: type.color }}>
        <Icon size={20} color={type.iconColor} />
      </div>
      <div className="doc-info">
        <strong>{doc.title || doc.type || 'Document'}</strong>
        <p>{type.label} · {formatDate(doc.date || doc.createdAt)}</p>
      </div>
      <div className="doc-action">
        {doc.fileUrl ? (
          <a href={doc.fileUrl} download style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--blue-700)', fontWeight: 500 }}>
            <Download size={15} /> Télécharger
          </a>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>À venir</span>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage({ ben }) {
  const docs = useMemo(() => {
    const secretariat = load(STORAGE_KEYS.secretariat, {});
    const s = secretariat?.[ben.structureId] || {};

    const contracts = (s.contracts || [])
      .filter(d => d.beneficiaryId === ben.id)
      .map(d => ({ ...d, type: 'contract', title: d.contractType || 'Contrat', date: d.startDate }));

    const payslips = (s.payslips || [])
      .filter(d => d.beneficiaryId === ben.id)
      .map(d => ({ ...d, type: 'payslip', title: `Bulletin · ${d.period || ''}`, date: d.createdAt }));

    const convocations = (s.convocations || [])
      .filter(d => d.beneficiaryId === ben.id)
      .map(d => ({ ...d, type: 'convocation', title: `Convocation · ${d.motif || ''}`, date: d.date }));

    return [...contracts, ...payslips, ...convocations].sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || ''))
    );
  }, [ben]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Documents</h1>
        <p>Pièces et documents partagés par la structure</p>
      </div>

      {docs.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <FolderOpen size={40} />
          <p>Aucun document disponible pour l'instant.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>
            Vos contrats, bulletins et convocations apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <div className="section-label">{docs.length} document{docs.length > 1 ? 's' : ''}</div>
          <div className="card" style={{ padding: 0 }}>
            {docs.map((d, i) => <DocItem key={d.id || i} doc={d} />)}
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <FileText size={18} color="var(--text-subtle)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.82rem' }}>
            Les documents vous sont transmis par votre référent(e) au fil de votre parcours. 
            Pour toute demande, utilisez la messagerie.
          </p>
        </div>
      </div>
    </div>
  );
}
