
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Building2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  NotebookText,
  Paperclip,
  Bell,
  Search,
  Plus,
  Save,
  Send,
  Shield,
  Trash2,
  UserPlus,
  Users,
  CircleAlert,
  RefreshCw,
  CalendarDays,
  FileText,
  Table2,
} from 'lucide-react';
import DocumentsIntelligentsPanel from './features/documents/DocumentsIntelligentsPanel.jsx';
import ImportBeneficiaires from './features/import/ImportBeneficiaires.jsx';
import './styles/documents-intelligents.css';
import configStructures from './config-structures.js';
import { DEFAULT_ANNUAIRE, flattenAnnuaire } from './annuaireData.js';
import { addBeneficiary, initFirebase } from './firebase-service.js';
  import {
    initSync,
    listenStructures,
    syncStructure,
    deleteStructure as fbDeleteStructure,
    syncBeneficiaire,
    deleteBeneficiaire as fbDeleteBeneficiaire,
    listenBeneficiaires,
    syncAgendaBeneficiaire,
    deleteAgendaEvent as fbDeleteAgendaEvent,
    listenAgenda,
    syncMessage,
    syncConversationMeta,
    uploadEvaluationPdf,
    deleteEvaluationPdf,
    listenEvaluationPdfs,
    uploadSalarieDocument,
    deleteSalarieDocument,
    listenSalarieDocuments,
  } from './firebase-sync.js';

const { STRUCTURES, ROLE_PERMISSIONS, validateUserData } = configStructures;

const STORAGE_KEYS = {
  structures: 'pcgi87.structures.v30',
  beneficiaires: 'pcgi87.beneficiaires.v30',
  annuaire: 'pcgi87.annuaire.v30',
  workspace: 'pcgi87.workspace.v30',
  chats: 'pcgi87.chats.v30',
  agendas: 'pcgi87.agendas.v30',
  chatReads: 'pcgi87.chatReads.v30',
  tracking: 'pcgi87.tracking.v30',
  secretariat: 'pcgi87.secretariat.v30',
  audit: 'pcgi87.audit.v31',
  rh: 'pcgi87.rh.v41',
  evaluations: 'pcgi87.evaluations.v1',
  customSkills: 'pcgi87.customSkills.v1',
  beneficiaryAssignments: 'pcgi87.beneficiaryAssignments.v1',
  delegatedAccesses: 'pcgi87.delegatedAccesses.v1',
  invoices: 'pcgi87.invoices.v1',
  invitations: 'pcgi87.invitations.v1',
  activities: 'pcgi87.activities.v1',
  rememberedSession: 'pcgi87.rememberedSession.v30',
};

const DEFAULT_PASSWORD = 'PCGI87!';
const INITIAL_EMAIL_SETTINGS = {
  serviceUrl: 'http://127.0.0.1:8790',
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromEmail: '',
  fromName: 'PCGI 87',
  replyTo: '',
  autoReminders: false,
};


const INITIAL_CHAT_STATE = {
  channels: {},
  directConversations: {},
  beneficiaryConversations: {},
};


const INITIAL_AGENDA_STATE = {
  personal: {},
  beneficiary: {},
  structure: {},
};


const TRACKING_COLUMNS = [
  { key: 'salarieNom', label: 'Noms des salariés' },
  { key: 'sexe', label: 'Sexe' },
  { key: 'prescripteur', label: 'Prescripteurs' },
  { key: 'age', label: 'Ages' },
  { key: 'reconnaissance', label: 'RQTH' },
  { key: 'situation', label: 'Situation' },
  { key: 'enfants', label: 'Enfants' },
  { key: 'ressources', label: 'Ressources' },
  { key: 'mobilite', label: 'Mobilité' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'dateEntree', label: 'Date d’Entrée' },
  { key: 'outilsMobilises', label: 'Outils Mobilisés' },
  { key: 'projetProfessionnel', label: 'Projet Professionnel' },
  { key: 'sorties', label: 'Sorties' },
  { key: 'pmsmp', label: 'PMSMP' },
  { key: 'infoCollectiveInterne', label: 'Info Collective en Interne' },
  { key: 'infoCollectiveExterne', label: 'Info Collective en Externe' },
  { key: 'ateliersInterneExterne', label: 'Ateliers Interne/Externe' },
  { key: 'formationsExterieur', label: 'Formations Extérieur' },
  { key: 'entretiensExterieur', label: 'Entretiens Extérieur' },
  { key: 'cdd', label: 'CDD' },
  { key: 'interim', label: 'Intérim' },
  { key: 'miseADisposition', label: 'Mise à Disposition' },
  { key: 'demarchesEmploi', label: "Démarche en lien avec l'emploi" },
  { key: 'demarchesFreins', label: 'Démarche en lien avec freins périphériques sociaux' },
];

const INITIAL_SYNTHESIS_FORM = {
  beneficiaryId: '',
  sexe: '',
  prescripteur: '',
  age: '',
  reconnaissance: '',
  situation: '',
  enfants: '',
  ressources: '',
  mobilite: '',
  qualification: '',
  dateEntree: '',
  outilsMobilises: '',
  projetProfessionnel: '',
  sorties: '',
  pmsmp: '',
  infoCollectiveInterne: '',
  infoCollectiveExterne: '',
  ateliersInterneExterne: '',
  formationsExterieur: '',
  entretiensExterieur: '',
  cdd: '',
  interim: '',
  miseADisposition: '',
  demarchesEmploi: '',
  demarchesFreins: '',
  notes: '',
};

const INITIAL_EVALUATION_FORM = {
  beneficiaryId: '',
  type: 'technique',
  skill: '',
  status: 'non_acquis',
  comment: '',
};

const DEFAULT_SKILLS = {
  technique: [
    'Communication écrite',
    'Communication orale',
    'Utilisation informatique',
    'Organisation et planification',
    'Gestion du temps',
    'Résolution de problèmes',
    'Autonomie',
  ],
  savoir_etre: [
    'Respect des consignes',
    'Ponctualité',
    'Travail en équipe',
    'Adaptabilité',
    'Attitude professionnelle',
    'Gestion du stress',
    'Implication',
  ],
};

const INITIAL_MEETING_REPORT_FORM = {
  title: '',
  meetingDate: '',
  participants: '',
  summary: '',
  decisions: '',
  nextActions: '',
};

const ANNUAIRE_LINK = 'https://sites.google.com/view/inkeocc/pcgi-87';

const EMPTY_DIRECTORY_FORM = {
  id: '',
  grandDomaine: 'Insertion & Emploi',
  categorie: "SIAE (Insertion par l'Activité)",
  nom: '',
  desc: '',
  tel: '',
  email: '',
  siteWeb: '',
  adresse: '',
};

function defaultTrackingState(structures) {
  const base = Object.fromEntries(Object.values(structures).map((structure) => [structure.id, { syntheses: {}, meetingReports: [] }]));
  return base;
}

function emptyStructureTracking() {
  return { syntheses: {}, meetingReports: [] };
}

function latestSynthesisFor(trackingState, structureId, beneficiaryId) {
  const list = trackingState?.[structureId]?.syntheses?.[beneficiaryId] || [];
  return list.length ? list[list.length - 1] : null;
}

function defaultAgendaState(structures) {
  const base = Object.fromEntries(Object.values(structures).map((structure) => [structure.id, []]));
  return {
    personal: {},
    beneficiary: base,
    structure: base,
  };
}

function sortAgenda(items) {
  return [...(items || [])].sort((a, b) => String(a.startAt || '').localeCompare(String(b.startAt || '')));
}

function agendaLabel(type) {
  switch (type) {
    case 'rdv_referent':
      return 'RDV référent';
    case 'atelier_collectif':
      return 'Atelier collectif';
    case 'rdv_administratif':
      return 'RDV administratif';
    case 'reunion':
      return 'Réunion';
    case 'atelier_structure':
      return 'Atelier structure';
    case 'rappel':
      return 'Rappel';
    default:
      return type || 'Événement';
  }
}

function defaultChatState(structures) {
  return {
    channels: Object.fromEntries(Object.values(structures).map((structure) => [structure.id, []])),
    directConversations: {},
    beneficiaryConversations: {},
  };
}

const TAB_ACCESS = {
  dashboard: null,
  pilotage: 'voir_stats',
  beneficiaires: 'suivi_beneficiaires',
  suivis: 'suivi_beneficiaires',
  annuaire: null,
  messagerie: 'messagerie',
  agendas: 'gestion_planning',
  activites: 'gestion_activites',
  secretariat: null,
  rh: null,
  utilisateurs: 'modifier_utilisateurs',
  structure: 'gestion_documents',
};

function participantKey(type, id) {
  return `${type}:${id}`;
}

function directKey(a, b) {
  return [a, b].sort().join('__');
}

function pushMessage(list, message) {
  return [...(list || []), { id: uid('msg'), createdAt: new Date().toISOString(), ...message }];
}

function countUnread(messages, currentUserId, lastReadAt) {
  return (messages || []).filter((message) =>
    message.authorId !== currentUserId && (!lastReadAt || String(message.createdAt) > String(lastReadAt))
  ).length;
}

function formatFileSize(size) {
  if (!size) return '';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function matchesSearch(value, search) {
  return String(value || '').toLowerCase().includes(String(search || '').toLowerCase());
}

function notifyDesktop(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, silent: false });
  } catch (error) {
    console.warn('Notification impossible', error);
  }
}

const text = (value) => String(value ?? '').trim();
const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
const today = () => new Date().toISOString().slice(0, 10);
const clone = (value) => JSON.parse(JSON.stringify(value));
const titleCase = (value) => text(value)
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const randomPassword = () => `PCGI-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

const DEFAULT_BENEFICIAIRES = {
  struct_001: [],
};

function initializeStructures(source) {
  const next = clone(source);
  Object.values(next).forEach((structure) => {
    structure.utilisateurs = (structure.utilisateurs || []).map((user) => ({
      statut: 'Actif',
      dateEmbauche: today(),
      ...user,
      motDePasse: text(user.motDePasse) || DEFAULT_PASSWORD,
      firstLogin: typeof user.firstLogin === 'boolean' ? user.firstLogin : !text(user.motDePasse),
    }));
  });
  return next;
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeCsvValue(value) {
  const textValue = String(value ?? '');
  if (/[";,\n]/.test(textValue)) {
    return `"${textValue.replace(/"/g, '""')}"`;
  }
  return textValue;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportRowsToCsv(filename, columns, rows) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(';');
  const lines = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key] ?? '')).join(';'));
  downloadFile(filename, [header, ...lines].join('\n'), 'text/csv;charset=utf-8;');
}

function printHtmlReport(title, bodyHtml) {
  const popup = window.open('', '_blank', 'width=1100,height=800');
  if (!popup) return false;
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#142135} h1{margin:0 0 8px} h2{margin:24px 0 8px;font-size:18px} table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #d8e1ef;padding:8px;vertical-align:top;text-align:left;font-size:12px} .meta{color:#52627a;margin:0 0 16px} .card{border:1px solid #d8e1ef;border-radius:14px;padding:14px;margin:0 0 12px} .muted{color:#64748b}</style></head><body><h1>${title}</h1>${bodyHtml}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}

function defaultSecretariatState(structures) {
  return Object.fromEntries(
    Object.values(structures).map((structure) => [
      structure.id,
      {
        beneficiaryAdmin: {},
        frontDesk: [],
        convocations: [],
        workshops: [],
        contracts: [],
        payslips: [],
      },
    ]),
  );
}

function emptyStructureSecretariat() {
  return { beneficiaryAdmin: {}, frontDesk: [], convocations: [], workshops: [], contracts: [], payslips: [] };
}

function defaultAuditState(structures) {
  return Object.fromEntries(
    Object.values(structures).map((structure) => [
      structure.id,
      { logs: [], archives: [] },
    ]),
  );
}

function emptyStructureAudit() {
  return { logs: [], archives: [] };
}


function defaultRhState(structures) {
  return Object.fromEntries(
    Object.values(structures).map((structure) => [
      structure.id,
      {
        employees: [],
        contracts: [],
        absences: [],
        medicalVisits: [],
        incidents: [],
        timeEntries: [],
      },
    ]),
  );
}

function emptyStructureRh() {
  return { employees: [], contracts: [], absences: [], medicalVisits: [], incidents: [], timeEntries: [] };
}

const INITIAL_RH_EMPLOYEE_FORM = {
  beneficiaryId: '',
  fullName: '',
  email: '',
  phone: '',
  poste: '',
  service: '',
  statut: 'Actif',
};

const INITIAL_RH_CONTRACT_FORM = {
  employeeId: '',
  employeeName: '',
  contractType: 'CDD Insertion',
  startDate: '',
  endDate: '',
  renewalDate: '',
  weeklyHours: '26h',
  status: 'Actif',
  notes: '',
};

const INITIAL_ABSENCE_FORM = {
  employeeId: '',
  employeeName: '',
  dateDebut: '',
  dateFin: '',
  type: 'Absence',
  reason: '',
  justified: false,
  comments: '',
};

const INITIAL_MEDICAL_FORM = {
  employeeId: '',
  employeeName: '',
  visitDate: '',
  visitType: 'Visite périodique',
  nextVisitDate: '',
  status: 'À planifier',
  notes: '',
};

const INITIAL_INCIDENT_FORM = {
  employeeId: '',
  employeeName: '',
  date: '',
  severity: 'Information',
  category: 'Avertissement',
  description: '',
  followUp: '',
};

const INITIAL_TIME_ENTRY_FORM = {
  employeeId: '',
  employeeName: '',
  date: '',
  hours: '7',
  status: 'Présent',
  notes: '',
};

const INITIAL_ACTIVITY_FORM = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  assignedBeneficiaries: [],
  comments: [],
};

function addAuditEntry(previousState, structureId, entry) {
  const current = previousState?.[structureId] || emptyStructureAudit();
  return {
    ...previousState,
    [structureId]: {
      ...current,
      logs: [{ id: uid('audit'), createdAt: new Date().toISOString(), ...entry }, ...(current.logs || [])],
      archives: current.archives || [],
    },
  };
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysSince(dateValue) {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((Date.now() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function generateContractTemplate(structure, beneficiary, form) {
  const fullName = `${beneficiary?.prenom || ''} ${beneficiary?.nom || ''}`.trim() || form.employeeName || 'Salarié concerné';
  return `CONTRAT PRÉREMPLI\n\nStructure : ${structure?.nom || ''}\nType de contrat : ${form.contractType || ''}\nSalarié : ${fullName}\nDate de début : ${form.startDate || ''}\nDate de fin : ${form.endDate || ''}\nDurée hebdomadaire : ${form.weeklyHours || ''}\nRémunération : ${form.remuneration || ''}\n\nClauses / précisions :\n${form.details || ''}\n`;
}

function defaultWorkspace(structures) {
  return Object.fromEntries(
    Object.values(structures).map((structure) => [
      structure.id,
      {
        emailSettings: { ...INITIAL_EMAIL_SETTINGS },
        messages: [],
        meetings: [],
      },
    ]),
  );
}

function App() {
  const [structures, setStructures] = useState(() => initializeStructures(STRUCTURES));
  const [beneficiairesByStructure, setBeneficiairesByStructure] = useState(DEFAULT_BENEFICIAIRES);
  const [annuaire, setAnnuaire] = useState(DEFAULT_ANNUAIRE);
  const [workspace, setWorkspace] = useState(() => defaultWorkspace(initializeStructures(STRUCTURES)));
  const [chatState, setChatState] = useState(() => defaultChatState(initializeStructures(STRUCTURES)));
  const [agendaState, setAgendaState] = useState(() => defaultAgendaState(initializeStructures(STRUCTURES)));
  const [trackingState, setTrackingState] = useState(() => defaultTrackingState(initializeStructures(STRUCTURES)));
  const [secretariatState, setSecretariatState] = useState(() => defaultSecretariatState(initializeStructures(STRUCTURES)));
  const [auditState, setAuditState] = useState(() => defaultAuditState(initializeStructures(STRUCTURES)));
  const [rhState, setRhState] = useState(() => defaultRhState(initializeStructures(STRUCTURES)));
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStructureId, setCurrentStructureId] = useState('struct_001');
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messagingTab, setMessagingTab] = useState('channel');
  const [agendaTab, setAgendaTab] = useState('reminders');
  const [trackingTab, setTrackingTab] = useState('synthese');
  const [secretariatTab, setSecretariatTab] = useState('accueil');
  const [pilotageTab, setPilotageTab] = useState('overview');
  const [rhTab, setRhTab] = useState('employees');
  const [notice, setNotice] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [firstAccessInfo, setFirstAccessInfo] = useState(null);
  const [loginForm, setLoginForm] = useState({
    structureId: 'struct_001',
    email: '',
    motDePasse: '',
    rememberMe: false,
  });
  const [forgotForm, setForgotForm] = useState({ structureId: 'struct_001', email: '' });
  const [newUserForm, setNewUserForm] = useState({ nom: '', email: '', role: 'CIP', motDePasse: '' });
  const [newStructureForm, setNewStructureForm] = useState({
    nom: '',
    type: 'SIAE - Insertion',
    ville: '',
    telephone: '',
    email: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPassword: '',
  });
  const [beneficiaryForm, setBeneficiaryForm] = useState({ nom: '', prenom: '', email: '', telephone: '', statut: 'En cours' });
  const [channelMessage, setChannelMessage] = useState('');
  const [channelAttachment, setChannelAttachment] = useState(null);
  const [directForm, setDirectForm] = useState({ structureId: 'struct_001', userId: '', message: '' });
  const [directAttachment, setDirectAttachment] = useState(null);
  const [beneficiaryChatForm, setBeneficiaryChatForm] = useState({ beneficiaryId: '', message: '' });
  const [beneficiaryAttachment, setBeneficiaryAttachment] = useState(null);
  const [chatFilters, setChatFilters] = useState({ channelSearch: '', directSearch: '', beneficiarySearch: '', unreadOnly: false });
  const [agendaFilters, setAgendaFilters] = useState({ search: '', upcomingOnly: false });
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryForm, setDirectoryForm] = useState(EMPTY_DIRECTORY_FORM);
  const [chatReads, setChatReads] = useState({});
  const [emailTest, setEmailTest] = useState('');
  const [personalAgendaForm, setPersonalAgendaForm] = useState({ title: '', startAt: '', notes: '' });
  const [beneficiaryAgendaForm, setBeneficiaryAgendaForm] = useState({ beneficiaryId: '', type: 'rdv_referent', startAt: '', notes: '' });
  const [structureAgendaForm, setStructureAgendaForm] = useState({ type: 'reunion', title: '', startAt: '', notes: '' });
  const [synthesisForm, setSynthesisForm] = useState(INITIAL_SYNTHESIS_FORM);
  const [meetingReportForm, setMeetingReportForm] = useState(INITIAL_MEETING_REPORT_FORM);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [complianceBeneficiaryId, setComplianceBeneficiaryId] = useState('');
  const [frontDeskForm, setFrontDeskForm] = useState({ person: '', contact: '', subject: '', destination: '', urgency: 'Normale', notes: '' });
  const [adminRecordForm, setAdminRecordForm] = useState({ beneficiaryId: '', prescripteur: '', situationAdministrative: '', piecesManquantes: '', notes: '', dossierComplet: false });
  const [convocationForm, setConvocationForm] = useState({ beneficiaryId: '', date: '', heure: '', motif: 'RDV administratif', canal: 'Application', commentaire: '' });
  const [workshopForm, setWorkshopForm] = useState({ title: '', date: '', heure: '', lieu: '', participants: '', notes: '' });
  const [contractForm, setContractForm] = useState({ beneficiaryId: '', employeeName: '', contractType: 'CDD Insertion', startDate: '', endDate: '', weeklyHours: '26h', remuneration: '', details: '', content: '' });
  const [paySlipForm, setPaySlipForm] = useState({ beneficiaryId: '', employeeName: '', period: '', notes: '' });
  const [paySlipAttachment, setPaySlipAttachment] = useState(null);
  const [rhEmployeeForm, setRhEmployeeForm] = useState(INITIAL_RH_EMPLOYEE_FORM);
  const [rhContractForm, setRhContractForm] = useState(INITIAL_RH_CONTRACT_FORM);
  const [absenceForm, setAbsenceForm] = useState(INITIAL_ABSENCE_FORM);
  const [medicalForm, setMedicalForm] = useState(INITIAL_MEDICAL_FORM);
  const [incidentForm, setIncidentForm] = useState(INITIAL_INCIDENT_FORM);
  const [timeEntryForm, setTimeEntryForm] = useState(INITIAL_TIME_ENTRY_FORM);
  const [evaluationForm, setEvaluationForm] = useState(INITIAL_EVALUATION_FORM);
  const [evaluations, setEvaluations] = useState({});
  const [evaluationTab, setEvaluationTab] = useState('technique');
  const [customSkills, setCustomSkills] = useState({ technique: [], savoir_etre: [] });
  const [newSkillInput, setNewSkillInput] = useState('');
  const [evalPdfBeneficiaryId, setEvalPdfBeneficiaryId] = useState('');
  const [evalPdfList, setEvalPdfList] = useState([]);
  const [evalPdfUploading, setEvalPdfUploading] = useState(false);
  const [salarieDocBeneficiaryId, setSalarieDocBeneficiaryId] = useState('');
  const [salarieDocList, setSalarieDocList] = useState([]);
  const [salarieDocUploading, setSalarieDocUploading] = useState(false);
  const [salarieDocCategory, setSalarieDocCategory] = useState('autre');
  const [showPassword, setShowPassword] = useState(false);
  const [beneficiaryAssignments, setBeneficiaryAssignments] = useState({});
  const [assignForm, setAssignForm] = useState({ beneficiaryId: '', cipIds: [], encadrantIds: [] });
  const [delegatedAccessForm, setDelegatedAccessForm] = useState({ fromUserId: '', toUserId: '', endDate: '' });
  const [delegatedAccesses, setDelegatedAccesses] = useState({});
  const [invoiceForm, setInvoiceForm] = useState({ beneficiaryId: '', amount: '', description: '', invoiceDate: today() });
  const [invoices, setInvoices] = useState({});
  const [invitations, setInvitations] = useState({});
  const [activities, setActivities] = useState({});
  const [activityForm, setActivityForm] = useState(INITIAL_ACTIVITY_FORM);
  const [activitiesTab, setActivitiesTab] = useState('list');
  const [startupPanelOpen, setStartupPanelOpen] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState(() => new Date().toISOString());
  const syncSnapshotRef = useRef({ chats: '', agendas: '', chatReads: '', tracking: '', secretariat: '', audit: '', rh: '', evaluations: '' });
  const liveCountersRef = useRef({ userKey: '', unread: null, reminders: null });
  const backupImportRef = useRef(null);

  useEffect(() => {
    const initialStructures = initializeStructures(loadFromStorage(STORAGE_KEYS.structures, STRUCTURES));
    setStructures(initialStructures);
    setBeneficiairesByStructure(loadFromStorage(STORAGE_KEYS.beneficiaires, DEFAULT_BENEFICIAIRES));
    setAnnuaire(loadFromStorage(STORAGE_KEYS.annuaire, DEFAULT_ANNUAIRE));
    setWorkspace(loadFromStorage(STORAGE_KEYS.workspace, defaultWorkspace(initialStructures)));
    const initialTracking = loadFromStorage(STORAGE_KEYS.tracking, defaultTrackingState(initialStructures));
    const initialSecretariat = loadFromStorage(STORAGE_KEYS.secretariat, defaultSecretariatState(initialStructures));
    const initialAudit = loadFromStorage(STORAGE_KEYS.audit, defaultAuditState(initialStructures));
    const initialRh = loadFromStorage(STORAGE_KEYS.rh, defaultRhState(initialStructures));
    const initialEvaluations = loadFromStorage(STORAGE_KEYS.evaluations, {});
    const initialCustomSkills = loadFromStorage(STORAGE_KEYS.customSkills, { technique: [], savoir_etre: [] });
    const initialAssignments = loadFromStorage(STORAGE_KEYS.beneficiaryAssignments, {});
    const initialDelegated = loadFromStorage(STORAGE_KEYS.delegatedAccesses, {});
    const initialInvoices = loadFromStorage(STORAGE_KEYS.invoices, {});
    const initialInvitations = loadFromStorage(STORAGE_KEYS.invitations, {});
    const initialActivities = loadFromStorage(STORAGE_KEYS.activities, {});
    const initialChatReads = loadFromStorage(STORAGE_KEYS.chatReads, {});
    const initialChatState = loadFromStorage(STORAGE_KEYS.chats, defaultChatState(initialStructures));
    const initialAgendaState = loadFromStorage(STORAGE_KEYS.agendas, defaultAgendaState(initialStructures));
    setChatState(initialChatState);
    setAgendaState(initialAgendaState);
    setTrackingState(initialTracking);
    setSecretariatState(initialSecretariat);
    setAuditState(initialAudit);
    setRhState(initialRh);
    setEvaluations(initialEvaluations);
    setCustomSkills(initialCustomSkills);
    setBeneficiaryAssignments(initialAssignments);
    setDelegatedAccesses(initialDelegated);
    setInvoices(initialInvoices);
    setInvitations(initialInvitations);
    setActivities(initialActivities);
    setChatReads(initialChatReads);
    syncSnapshotRef.current = {
      chats: JSON.stringify(initialChatState),
      agendas: JSON.stringify(initialAgendaState),
      chatReads: JSON.stringify(initialChatReads),
      tracking: JSON.stringify(initialTracking),
      secretariat: JSON.stringify(initialSecretariat),
      audit: JSON.stringify(initialAudit),
      rh: JSON.stringify(initialRh),
    };
    setLastSyncAt(new Date().toISOString());

    const remembered = loadFromStorage(STORAGE_KEYS.rememberedSession, null);
    if (remembered?.structureId && remembered?.userId) {
      const structure = initialStructures[remembered.structureId];
      const user = structure?.utilisateurs?.find((item) => item.id === remembered.userId);
      if (structure && user) {
        setCurrentStructureId(structure.id);
        setCurrentUser(user);
        setLoginForm((prev) => ({ ...prev, structureId: structure.id, email: user.email, rememberMe: true }));
        setMustChangePassword(Boolean(user.firstLogin));
      }
    }
  }, []);

  // Initialiser Firebase au démarrage
   useEffect(() => {
    initFirebase().catch(err => console.warn('Firebase non disponible:', err));
    initSync().then(() => {
      // 🔥 Écouter TOUTES les structures en temps réel (ajout dynamique multi-PC)
      const unsubStructures = listenStructures((map) => {
        if (Object.keys(map).length > 0) {
          setStructures((prev) => {
            const merged = { ...prev };
            for (const [id, remoteStruct] of Object.entries(map)) {
              merged[id] = {
                ...(prev[id] || {}),
                ...remoteStruct,
              };
            }
            return merged;
          });
        }
      });

      // Écouter les bénéficiaires de la structure courante en temps réel
      const unsubBenef = listenBeneficiaires(currentStructureId || 'struct_001', (list) => {
        if (list.length > 0) {
          setBeneficiairesByStructure((prev) => ({ ...prev, [currentStructureId || 'struct_001']: list }));
        }
      });
      // Écouter l'agenda bénéficiaire en temps réel
      const unsubAgenda = listenAgenda(currentStructureId || 'struct_001', (events) => {
        setAgendaState((prev) => ({
          ...prev,
          beneficiary: { ...prev.beneficiary, [currentStructureId || 'struct_001']: events },
        }));
      });
      return () => { unsubStructures(); unsubBenef(); unsubAgenda(); };
    }).catch(err => console.warn('Firebase Sync non disponible:', err));
  }, [currentStructureId]);

  // Écouter les PDF d'évaluation du bénéficiaire sélectionné
  useEffect(() => {
    if (!evalPdfBeneficiaryId || !currentStructureId) {
      setEvalPdfList([]);
      return;
    }
    let unsub = () => {};
    initSync().then(() => {
      unsub = listenEvaluationPdfs(currentStructureId, evalPdfBeneficiaryId, (list) => {
        setEvalPdfList(list);
      });
    }).catch(err => console.warn('Firebase Sync non disponible:', err));
    return () => unsub();
  }, [evalPdfBeneficiaryId, currentStructureId]);

  // Écouter les documents salarié du bénéficiaire sélectionné (dossiers CDDI, etc.)
  useEffect(() => {
    if (!salarieDocBeneficiaryId || !currentStructureId) {
      setSalarieDocList([]);
      return;
    }
    let unsub = () => {};
    initSync().then(() => {
      unsub = listenSalarieDocuments(currentStructureId, salarieDocBeneficiaryId, (list) => {
        setSalarieDocList(list);
      });
    }).catch(err => console.warn('Firebase Sync non disponible:', err));
    return () => unsub();
  }, [salarieDocBeneficiaryId, currentStructureId]);

  useEffect(() => saveToStorage(STORAGE_KEYS.structures, structures), [structures]);
  useEffect(() => saveToStorage(STORAGE_KEYS.beneficiaires, beneficiairesByStructure), [beneficiairesByStructure]);
  useEffect(() => saveToStorage(STORAGE_KEYS.annuaire, annuaire), [annuaire]);
  useEffect(() => saveToStorage(STORAGE_KEYS.workspace, workspace), [workspace]);
  useEffect(() => {
    syncSnapshotRef.current.evaluations = JSON.stringify(evaluations);
    saveToStorage(STORAGE_KEYS.evaluations, evaluations);
  }, [evaluations]);
  useEffect(() => saveToStorage(STORAGE_KEYS.customSkills, customSkills), [customSkills]);
  useEffect(() => saveToStorage(STORAGE_KEYS.beneficiaryAssignments, beneficiaryAssignments), [beneficiaryAssignments]);
  useEffect(() => saveToStorage(STORAGE_KEYS.delegatedAccesses, delegatedAccesses), [delegatedAccesses]);
  useEffect(() => saveToStorage(STORAGE_KEYS.invoices, invoices), [invoices]);
  useEffect(() => saveToStorage(STORAGE_KEYS.invitations, invitations), [invitations]);
  useEffect(() => saveToStorage(STORAGE_KEYS.activities, activities), [activities]);
  useEffect(() => {
    syncSnapshotRef.current.chats = JSON.stringify(chatState);
    saveToStorage(STORAGE_KEYS.chats, chatState);
  }, [chatState]);
  useEffect(() => {
    syncSnapshotRef.current.agendas = JSON.stringify(agendaState);
    saveToStorage(STORAGE_KEYS.agendas, agendaState);
  }, [agendaState]);
  useEffect(() => {
    syncSnapshotRef.current.chatReads = JSON.stringify(chatReads);
    saveToStorage(STORAGE_KEYS.chatReads, chatReads);
  }, [chatReads]);
  useEffect(() => {
    syncSnapshotRef.current.tracking = JSON.stringify(trackingState);
    saveToStorage(STORAGE_KEYS.tracking, trackingState);
  }, [trackingState]);
  useEffect(() => {
    syncSnapshotRef.current.secretariat = JSON.stringify(secretariatState);
    saveToStorage(STORAGE_KEYS.secretariat, secretariatState);
  }, [secretariatState]);
  useEffect(() => {
    syncSnapshotRef.current.audit = JSON.stringify(auditState);
    saveToStorage(STORAGE_KEYS.audit, auditState);
  }, [auditState]);
  useEffect(() => {
    syncSnapshotRef.current.rh = JSON.stringify(rhState);
    saveToStorage(STORAGE_KEYS.rh, rhState);
  }, [rhState]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  useEffect(() => {
    if (currentUser) setStartupPanelOpen(true);
  }, [currentUser?.id, currentStructureId]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const handleStorage = (event) => {
      if (!event.key || !Object.values(STORAGE_KEYS).includes(event.key)) return;
      syncLiveData(false);
    };
    window.addEventListener('storage', handleStorage);
    const interval = window.setInterval(() => syncLiveData(false), 5000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
    };
  }, [currentUser?.id, currentStructureId]);

  useEffect(() => {
    if (!currentUser || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => null);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.role === 'CIP' && evaluationTab === 'technique') {
      setEvaluationTab('savoir_etre');
      setEvaluationForm((prev) => ({ ...prev, type: 'savoir_etre', skill: '' }));
    }
  }, [currentUser?.role]);

  const currentStructure = structures[currentStructureId] || Object.values(structures)[0] || null;
  const users = currentStructure?.utilisateurs || [];
  const beneficiaires = beneficiairesByStructure[currentStructureId] || [];
  const unassignedBeneficiaires = beneficiaires.filter((b) => {
    const assignment = beneficiaryAssignments[b.id];
    if (!assignment) return true;
    return (!assignment.cipIds || assignment.cipIds.length === 0) && (!assignment.encadrantIds || assignment.encadrantIds.length === 0);
  });
  const allStructures = Object.values(structures);
  const allProfessionalOptions = allStructures.flatMap((structure) => (structure.utilisateurs || []).map((user) => ({ ...user, structureId: structure.id, structureName: structure.nom })));
  const currentChannelMessages = chatState.channels[currentStructureId] || [];
  const currentPersonalAgenda = sortAgenda(agendaState.personal[currentUser?.id] || []);
  const currentBeneficiaryAgenda = sortAgenda(agendaState.beneficiary[currentStructureId] || []);
  const currentStructureAgenda = sortAgenda(agendaState.structure[currentStructureId] || []);
  const currentTracking = trackingState[currentStructureId] || emptyStructureTracking();
  const currentSecretariat = secretariatState[currentStructureId] || emptyStructureSecretariat();
  const currentSyntheses = currentTracking.syntheses || {};
  const currentMeetingReports = currentTracking.meetingReports || [];
  const currentAdminRecords = currentSecretariat.beneficiaryAdmin || {};
  const currentFrontDesk = currentSecretariat.frontDesk || [];
  const currentConvocations = currentSecretariat.convocations || [];
  const currentWorkshops = currentSecretariat.workshops || [];
  const currentContracts = currentSecretariat.contracts || [];
  const currentPayslips = currentSecretariat.payslips || [];
  const currentAudit = auditState[currentStructureId] || emptyStructureAudit();
  const currentAuditLogs = currentAudit.logs || [];
  const currentArchives = currentAudit.archives || [];
  const currentRh = rhState[currentStructureId] || emptyStructureRh();
  const currentEmployees = currentRh.employees || [];
  const currentRhContracts = currentRh.contracts || [];
  const currentAbsences = currentRh.absences || [];
  const currentMedicalVisits = currentRh.medicalVisits || [];
  const currentIncidents = currentRh.incidents || [];
  const currentTimeEntries = currentRh.timeEntries || [];
  const trackingRows = beneficiaires
    .map((beneficiary) => {
      const latest = latestSynthesisFor(trackingState, currentStructureId, beneficiary.id) || {};
      const salarieNom = `${beneficiary.nom || ''} ${beneficiary.prenom || ''}`.trim();
      return {
        beneficiaryId: beneficiary.id,
        salarieNom,
        sexe: latest.sexe || '',
        prescripteur: latest.prescripteur || '',
        age: latest.age || '',
        reconnaissance: latest.reconnaissance || '',
        situation: latest.situation || beneficiary.statut || '',
        enfants: latest.enfants || '',
        ressources: latest.ressources || '',
        mobilite: latest.mobilite || '',
        qualification: latest.qualification || '',
        dateEntree: latest.dateEntree || beneficiary.dateEntree || '',
        outilsMobilises: latest.outilsMobilises || '',
        projetProfessionnel: latest.projetProfessionnel || '',
        sorties: latest.sorties || '',
        pmsmp: latest.pmsmp || '',
        infoCollectiveInterne: latest.infoCollectiveInterne || '',
        infoCollectiveExterne: latest.infoCollectiveExterne || '',
        ateliersInterneExterne: latest.ateliersInterneExterne || '',
        formationsExterieur: latest.formationsExterieur || '',
        entretiensExterieur: latest.entretiensExterieur || '',
        cdd: latest.cdd || '',
        interim: latest.interim || '',
        miseADisposition: latest.miseADisposition || '',
        demarchesEmploi: latest.demarchesEmploi || '',
        demarchesFreins: latest.demarchesFreins || '',
        notes: latest.notes || '',
        updatedAt: latest.createdAt || '',
      };
    })
    .filter((row) => !trackingSearch || matchesSearch(Object.values(row).join(' '), trackingSearch));
  const emailSettings = workspace[currentStructureId]?.emailSettings || INITIAL_EMAIL_SETTINGS;
  const permissions = currentUser ? (ROLE_PERMISSIONS[currentUser.role] || []) : [];
  const hasPermission = (permission) => permissions.includes(permission);
  const canCreateStructure = Boolean(
    currentUser &&
    currentUser.role === 'Coordinateur' &&
    currentStructure?.id === 'struct_001' &&
    text(currentUser.email).toLowerCase() === 'cindybinchi@gmail.com'
  );

  const roleCanAccessTab = (tab) => {
    if (tab === 'rh') return ['Coordinateur', 'Secrétaire'].includes(currentUser?.role);
    if (tab === 'secretariat') return ['Coordinateur', 'Secrétaire'].includes(currentUser?.role);
    if (tab === 'pilotage') return ['Coordinateur'].includes(currentUser?.role);
    if (tab === 'utilisateurs') return currentUser?.role === 'Coordinateur';
    return true;
  };
  const canAccessTab = (tab) => {
    const needed = TAB_ACCESS[tab];
    if (needed && !hasPermission(needed)) return false;
    return roleCanAccessTab(tab);
  };
  const visibleNavTabs = [
    'dashboard',
    'pilotage',
    'beneficiaires',
    'suivis',
    'annuaire',
    'messagerie',
    'agendas',
    'activites',
    'secretariat',
    'rh',
    'utilisateurs',
    'structure',
  ].filter(canAccessTab);

  const stats = useMemo(() => ({
    utilisateurs: users.length,
    beneficiaires: beneficiaires.length,
    alertes: beneficiaires.filter((item) => item.statut === 'Urgence').length,
    messages: (chatState.channels[currentStructureId] || []).length,
    agenda: (agendaState.structure[currentStructureId] || []).length + (agendaState.beneficiary[currentStructureId] || []).length,
  }), [users, beneficiaires, chatState, currentStructureId, agendaState]);

  const annuaireFlat = useMemo(() => flattenAnnuaire(annuaire), [annuaire]);
  const filteredAnnuaire = useMemo(() => annuaireFlat.filter((item) => [item.nom, item.desc, item.tel, item.email, item.siteWeb, item.adresse, item.grandDomaine, item.categorie].some((field) => matchesSearch(field, directorySearch))), [annuaireFlat, directorySearch]);

  const showMessage = (message) => setNotice(message);

  const registerAudit = (action, details = '', meta = {}) => {
    if (!currentStructureId) return;
    setAuditState((prev) => addAuditEntry(prev, currentStructureId, {
      action,
      details,
      meta,
      userId: currentUser?.id || 'system',
      userName: currentUser?.nom || 'Système',
      userRole: currentUser?.role || 'Système',
    }));
  };

  const incompleteAdminCount = Object.values(currentAdminRecords || {}).filter((record) => !record?.dossierComplet).length;
  const synthesesToUpdate = beneficiaires.filter((beneficiary) => {
    const latest = latestSynthesisFor(trackingState, currentStructureId, beneficiary.id);
    const age = daysSince(latest?.createdAt);
    return !latest || age === null || age > 30;
  });
  const contractsExpiringSoon = currentContracts.filter((contract) => {
    const remaining = daysUntil(contract.endDate);
    return remaining !== null && remaining >= 0 && remaining <= 30;
  });
  const upcomingConvocations = currentConvocations.filter((convocation) => {
    if (!convocation.date) return false;
    const target = `${convocation.date}T${convocation.heure || '09:00'}`;
    const remaining = daysUntil(target);
    return remaining !== null && remaining >= 0 && remaining <= 14;
  });
  const complianceAlerts = [
    incompleteAdminCount ? { id: 'admin', title: `${incompleteAdminCount} dossier(s) administratif(s) incomplet(s)`, detail: 'Mettre à jour les pièces manquantes et statuts de dossier.' } : null,
    synthesesToUpdate.length ? { id: 'synthese', title: `${synthesesToUpdate.length} synthèse(s) à actualiser`, detail: 'Aucune synthèse récente sur les 30 derniers jours.' } : null,
    contractsExpiringSoon.length ? { id: 'contracts', title: `${contractsExpiringSoon.length} contrat(s) arrivent à échéance`, detail: 'Prévoir renouvellement, sortie ou archivage.' } : null,
    upcomingConvocations.length ? { id: 'convocations', title: `${upcomingConvocations.length} convocation(s) dans les 14 jours`, detail: 'Vérifier préparation et présence.' } : null,
  ].filter(Boolean);
  const complianceScore = Math.max(0, Math.min(100, 100 - (incompleteAdminCount * 12 + synthesesToUpdate.length * 8 + contractsExpiringSoon.length * 5)));
  const filteredAuditLogs = currentAuditLogs.filter((entry) => {
    const actionOk = auditActionFilter === 'all' || entry.action === auditActionFilter;
    const searchOk = !text(auditSearch) || matchesSearch(`${entry.action} ${entry.details} ${entry.userName}`, auditSearch);
    return actionOk && searchOk;
  });

  const contractsToRenew = currentRhContracts.filter((item) => {
    const remaining = daysUntil(item.endDate || item.renewalDate);
    return remaining !== null && remaining >= 0 && remaining <= 30;
  });
  const upcomingMedicalVisits = currentMedicalVisits.filter((item) => {
    const remaining = daysUntil(item.nextVisitDate || item.visitDate);
    return remaining !== null && remaining >= 0 && remaining <= 30;
  });
  const recentAbsences = currentAbsences.filter((item) => {
    const age = daysSince(item.date);
    return age !== null && age >= 0 && age <= 30;
  });
  const rhAlerts = [
    ...contractsToRenew.map((item) => ({ id: `renew-${item.id}`, label: `Contrat à renouveler : ${item.employeeName}`, kind: 'Contrat' })),
    ...upcomingMedicalVisits.map((item) => ({ id: `medical-${item.id}`, label: `Visite médicale : ${item.employeeName}`, kind: 'Visite' })),
    ...recentAbsences.filter((item) => !item.justified).map((item) => ({ id: `absence-${item.id}`, label: `Absence non justifiée : ${item.employeeName}`, kind: 'Absence' })),
  ];

  const syncLiveData = (withNotice = false) => {
    const latestChats = loadFromStorage(STORAGE_KEYS.chats, chatState);
    const latestAgendas = loadFromStorage(STORAGE_KEYS.agendas, agendaState);
    const latestReads = loadFromStorage(STORAGE_KEYS.chatReads, chatReads);
    const latestTracking = loadFromStorage(STORAGE_KEYS.tracking, trackingState);
    const latestSecretariat = loadFromStorage(STORAGE_KEYS.secretariat, secretariatState);
    const latestAudit = loadFromStorage(STORAGE_KEYS.audit, auditState);
    const latestRh = loadFromStorage(STORAGE_KEYS.rh, rhState);
    const latestEvaluations = loadFromStorage(STORAGE_KEYS.evaluations, evaluations);

    let changed = false;
    const chatSerialized = JSON.stringify(latestChats);
    const agendaSerialized = JSON.stringify(latestAgendas);
    const readSerialized = JSON.stringify(latestReads);
    const trackingSerialized = JSON.stringify(latestTracking);
    const secretariatSerialized = JSON.stringify(latestSecretariat);
    const auditSerialized = JSON.stringify(latestAudit);
    const rhSerialized = JSON.stringify(latestRh);
    const evaluationsSerialized = JSON.stringify(latestEvaluations);

    if (chatSerialized !== syncSnapshotRef.current.chats) {
      setChatState(latestChats);
      changed = true;
    }
    if (agendaSerialized !== syncSnapshotRef.current.agendas) {
      setAgendaState(latestAgendas);
      changed = true;
    }
    if (readSerialized !== syncSnapshotRef.current.chatReads) {
      setChatReads(latestReads);
      changed = true;
    }
    if (trackingSerialized !== syncSnapshotRef.current.tracking) {
      setTrackingState(latestTracking);
      changed = true;
    }
    if (secretariatSerialized !== syncSnapshotRef.current.secretariat) {
      setSecretariatState(latestSecretariat);
      changed = true;
    }
    if (auditSerialized !== syncSnapshotRef.current.audit) {
      setAuditState(latestAudit);
      changed = true;
    }
    if (rhSerialized !== syncSnapshotRef.current.rh) {
      setRhState(latestRh);
      changed = true;
    }
    if (evaluationsSerialized !== syncSnapshotRef.current.evaluations) {
      setEvaluations(latestEvaluations);
      changed = true;
    }

    setLastSyncAt(new Date().toISOString());
    if (changed && withNotice) showMessage('Données synchronisées.');
    return changed;
  };

  const openMainTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'messagerie') setMessagingTab('channel');
    if (tab === 'agendas') setAgendaTab('reminders');
    if (tab === 'suivis') setTrackingTab('synthese');
    if (tab === 'secretariat') setSecretariatTab('accueil');
    if (tab === 'pilotage') setPilotageTab('overview');
    if (tab === 'rh') setRhTab('employees');
  };

  useEffect(() => {
    if (currentUser && !canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser, currentStructureId]);

  const exportFullBackup = () => {
    const payload = {
      version: 'V14',
      exportedAt: new Date().toISOString(),
      structures,
      beneficiairesByStructure,
      annuaire,
      workspace,
      chatState,
      agendaState,
      chatReads,
      trackingState,
      secretariatState,
      auditState,
      rhState,
      evaluations,
      customSkills,
    };
    downloadFile(`pcgi87-sauvegarde-${today()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8;');
    registerAudit('SAUVEGARDE_EXPORT', 'Sauvegarde complète exportée');
    showMessage('Sauvegarde exportée.');
  };

  const exportAuditCsvFile = () => {
    exportRowsToCsv(`pcgi87-audit-${today()}.csv`, [
      { key: "createdAt", label: "Date" },
      { key: "action", label: "Action" },
      { key: "details", label: "Détails" },
      { key: "userName", label: "Utilisateur" },
      { key: "userRole", label: "Rôle" },
    ], currentAuditLogs);
    showMessage("Journal d’audit exporté.");
  };

  const exportBeneficiariesExcel = () => {
    const workbook = XLSX.utils.book_new();

    beneficiaires.forEach((beneficiary) => {
      const worksheetData = [];

      worksheetData.push(["FICHE BÉNÉFICIAIRE", `${beneficiary.nom} ${beneficiary.prenom}`]);
      worksheetData.push([]);

      worksheetData.push(["INFORMATIONS PERSONNELLES"]);
      worksheetData.push(["Nom", beneficiary.nom]);
      worksheetData.push(["Prénom", beneficiary.prenom]);
      worksheetData.push(["Email", beneficiary.email || ""]);
      worksheetData.push(["Téléphone", beneficiary.telephone || ""]);
      worksheetData.push(["Statut", beneficiary.statut || ""]);
      worksheetData.push(["Date d’entrée", beneficiary.dateEntree || ""]);
      worksheetData.push([]);

      const latestSynthesis = latestSynthesisFor(trackingState, currentStructureId, beneficiary.id);
      if (latestSynthesis) {
        worksheetData.push(["SYNTHÈSE DE SUIVI"]);
        worksheetData.push(["Date", new Date(latestSynthesis.createdAt).toLocaleString("fr-FR")]);
        worksheetData.push(["Sexe", latestSynthesis.sexe || ""]);
        worksheetData.push(["Prescripteur", latestSynthesis.prescripteur || ""]);
        worksheetData.push(["Âge", latestSynthesis.age || ""]);
        worksheetData.push(["RQTH", latestSynthesis.reconnaissance || ""]);
        worksheetData.push(["Situation", latestSynthesis.situation || ""]);
        worksheetData.push(["Enfants", latestSynthesis.enfants || ""]);
        worksheetData.push(["Ressources", latestSynthesis.ressources || ""]);
        worksheetData.push(["Mobilité", latestSynthesis.mobilite || ""]);
        worksheetData.push(["Qualification", latestSynthesis.qualification || ""]);
        worksheetData.push(["Outils mobilisés", latestSynthesis.outilsMobilises || ""]);
        worksheetData.push(["Projet professionnel", latestSynthesis.projetProfessionnel || ""]);
        worksheetData.push(["Sorties", latestSynthesis.sorties || ""]);
        worksheetData.push(["PMSMP", latestSynthesis.pmsmp || ""]);
        worksheetData.push(["CDD", latestSynthesis.cdd || ""]);
        worksheetData.push(["Intérim", latestSynthesis.interim || ""]);
        worksheetData.push(["Mise à disposition", latestSynthesis.miseADisposition || ""]);
        worksheetData.push(["Démarches emploi", latestSynthesis.demarchesEmploi || ""]);
        worksheetData.push(["Démarches freins", latestSynthesis.demarchesFreins || ""]);
        worksheetData.push(["Notes", latestSynthesis.notes || ""]);
        worksheetData.push([]);
      }

      const beneficiaryEvals = evaluations[beneficiary.id] || [];
      if (beneficiaryEvals.length > 0) {
        worksheetData.push(["ÉVALUATIONS"]);
        worksheetData.push(["Compétence", "Type", "Statut", "Commentaire", "Date"]);
        beneficiaryEvals.forEach((eva) => {
          worksheetData.push([
            eva.skill,
            eva.type === "technique" ? "Technique" : "Savoir-être",
            eva.status === "acquis" ? "Acquis" : eva.status === "en_cours" ? "En cours" : "Non acquis",
            eva.comment || "",
            new Date(eva.createdAt).toLocaleDateString("fr-FR"),
          ]);
        });
        worksheetData.push([]);
      }

      const beneficiaryAgendaItems = (agendaState.beneficiary[currentStructureId] || []).filter((item) => item.beneficiaryId === beneficiary.id);
      if (beneficiaryAgendaItems.length > 0) {
        worksheetData.push(["AGENDA"]);
        worksheetData.push(["Type", "Date/Heure", "Notes"]);
        beneficiaryAgendaItems.forEach((item) => {
          worksheetData.push([
            agendaLabel(item.type),
            new Date(item.startAt).toLocaleString("fr-FR"),
            item.notes || "",
          ]);
        });
      }

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet["!cols"] = [{ wch: 30 }, { wch: 40 }];
      const safeName = `${beneficiary.nom} ${beneficiary.prenom}`.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
    });

    XLSX.writeFile(workbook, `pcgi87-export-${currentStructure?.nom || "beneficiaires"}-${today()}.xlsx`);
    registerAudit("EXPORT_EXCEL", `Export Excel des bénéficiaires : ${beneficiaires.length} fiches`);
    showMessage("Export Excel créé avec succès.");
  };

  const handleImportBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || '{}'));
        if (!payload?.structures || !payload?.workspace) throw new Error('Fichier invalide');
        setStructures(payload.structures);
        setBeneficiairesByStructure(payload.beneficiairesByStructure || {});
        setAnnuaire(payload.annuaire || DEFAULT_ANNUAIRE);
        setWorkspace(payload.workspace || defaultWorkspace(payload.structures));
        setChatState(payload.chatState || defaultChatState(payload.structures));
        setAgendaState(payload.agendaState || defaultAgendaState(payload.structures));
        setChatReads(payload.chatReads || {});
        setTrackingState(payload.trackingState || defaultTrackingState(payload.structures));
        setSecretariatState(payload.secretariatState || defaultSecretariatState(payload.structures));
        setAuditState(payload.auditState || defaultAuditState(payload.structures));
        setRhState(payload.rhState || defaultRhState(payload.structures));
        setEvaluations(payload.evaluations || {});
        setCustomSkills(payload.customSkills || { technique: [], savoir_etre: [] });
        const firstStructureId = Object.keys(payload.structures || {})[0] || 'struct_001';
        setCurrentStructureId(firstStructureId);
        setLoginForm((prev) => ({ ...prev, structureId: firstStructureId }));
        syncSnapshotRef.current = {
          chats: JSON.stringify(payload.chatState || defaultChatState(payload.structures)),
          agendas: JSON.stringify(payload.agendaState || defaultAgendaState(payload.structures)),
          chatReads: JSON.stringify(payload.chatReads || {}),
          tracking: JSON.stringify(payload.trackingState || defaultTrackingState(payload.structures)),
          secretariat: JSON.stringify(payload.secretariatState || defaultSecretariatState(payload.structures)),
          audit: JSON.stringify(payload.auditState || defaultAuditState(payload.structures)),
          rh: JSON.stringify(payload.rhState || defaultRhState(payload.structures)),
          evaluations: JSON.stringify(payload.evaluations || {}),
        };
        showMessage('Sauvegarde restaurée.');
      } catch (error) {
        showMessage(`Import impossible : ${error.message}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleAttachmentPick = (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) {
      setter(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('La pièce jointe dépasse 5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => showMessage('Impossible de lire la pièce jointe.');
    reader.readAsDataURL(file);
  };

  const persistRememberedSession = (structureId, user) => {
    if (loginForm.rememberMe) {
      saveToStorage(STORAGE_KEYS.rememberedSession, { structureId, userId: user.id });
    } else {
      localStorage.removeItem(STORAGE_KEYS.rememberedSession);
    }
  };

  const sendChannelMessage = (event) => {
    event.preventDefault();
    if (!currentUser || !currentStructureId || !text(channelMessage)) return;
    const conversationId = `channel_${currentStructureId}`;
    setChatState((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [currentStructureId]: pushMessage(prev.channels[currentStructureId], {
          authorType: 'professional',
          authorId: currentUser.id,
          authorName: currentUser.nom,
          content: text(channelMessage),
          scope: 'structure',
          attachment: channelAttachment,
        }),
      },
    }));
    syncMessage(conversationId, {
      authorType: 'professional',
      authorId: currentUser.id,
      authorName: currentUser.nom,
      content: text(channelMessage),
      scope: 'structure',
    }).catch(err => console.warn('Sync message:', err));
    syncConversationMeta(conversationId, {
      scope: 'structure',
      structureId: currentStructureId,
      memberEmails: (currentStructure?.utilisateurs || []).filter((u) => u.id !== currentUser.id).map((u) => u.email).filter(Boolean),
      authorId: currentUser.id,
      authorName: currentUser.nom,
    }).catch(err => console.warn('Sync meta:', err));
    registerAudit('MESSAGE_STRUCTURE', 'Message envoyé dans le canal structure.', { scope: 'channel' });
    setChannelMessage('');
    setChannelAttachment(null);
    showMessage('Message envoyé dans le canal de la structure.');
  };

  const sendDirectMessage = (event) => {
    event.preventDefault();
    if (!currentUser || !text(directForm.userId) || !text(directForm.message)) return;
    const conversationId = directKey(participantKey('pro', currentUser.id), participantKey('pro', directForm.userId));
    const target = allProfessionalOptions.find((user) => user.id === directForm.userId);
    if (!target) {
      showMessage('Destinataire introuvable.');
      return;
    }
    setChatState((prev) => ({
      ...prev,
      directConversations: {
        ...prev.directConversations,
        [conversationId]: {
          id: conversationId,
          participantIds: [participantKey('pro', currentUser.id), participantKey('pro', target.id)],
          participantNames: [currentUser.nom, target.nom],
          messages: pushMessage(prev.directConversations[conversationId]?.messages, {
            authorType: 'professional',
            authorId: currentUser.id,
            authorName: currentUser.nom,
            content: text(directForm.message),
            scope: 'direct',
            attachment: directAttachment,
          }),
        },
      },
    }));
    syncMessage(conversationId, {
      authorType: 'professional',
      authorId: currentUser.id,
      authorName: currentUser.nom,
      content: text(directForm.message),
      scope: 'direct',
    }).catch(err => console.warn('Sync message:', err));
    syncConversationMeta(conversationId, {
      scope: 'direct',
      structureId: currentStructureId,
      memberEmails: [target.email].filter(Boolean),
      authorId: currentUser.id,
      authorName: currentUser.nom,
    }).catch(err => console.warn('Sync meta:', err));
    registerAudit('MESSAGE_PRO', `Message envoyé à ${target.nom}.`, { targetUserId: target.id });
    setDirectForm((prev) => ({ ...prev, message: '' }));
    setDirectAttachment(null);
    showMessage('Message envoyé au professionnel.');
  };

  const sendBeneficiaryMessage = (event) => {
    event.preventDefault();
    if (!currentUser || !text(beneficiaryChatForm.beneficiaryId) || !text(beneficiaryChatForm.message)) return;
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(beneficiaryChatForm.beneficiaryId));
    if (!beneficiary) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const conversationId = directKey(participantKey('pro', currentUser.id), participantKey('benef', beneficiary.id));
    setChatState((prev) => ({
      ...prev,
      beneficiaryConversations: {
        ...prev.beneficiaryConversations,
        [conversationId]: {
          id: conversationId,
          participantIds: [participantKey('pro', currentUser.id), participantKey('benef', beneficiary.id)],
          participantNames: [currentUser.nom, `${beneficiary.prenom} ${beneficiary.nom}`.trim()],
          beneficiaryId: beneficiary.id,
          messages: pushMessage(prev.beneficiaryConversations[conversationId]?.messages, {
            authorType: 'professional',
            authorId: currentUser.id,
            authorName: currentUser.nom,
            content: text(beneficiaryChatForm.message),
            scope: 'beneficiary',
            attachment: beneficiaryAttachment,
          }),
        },
      },
    }));
    syncMessage(conversationId, {
      authorType: 'professional',
      authorId: currentUser.id,
      authorName: currentUser.nom,
      content: text(beneficiaryChatForm.message),
      scope: 'beneficiary',
    }).catch(err => console.warn('Sync message:', err));
    syncConversationMeta(conversationId, {
      beneficiaryId: beneficiary.id,
      beneficiaryName: `${beneficiary.prenom} ${beneficiary.nom}`.trim(),
      beneficiaryEmail: beneficiary.email || '',
      referentId: currentUser.id,
      referentName: currentUser.nom,
      referentEmail: currentUser.email || '',
      structureId: currentStructureId,
      scope: 'beneficiary',
      authorId: currentUser.id,
      authorName: currentUser.nom,
    }).catch(err => console.warn('Sync meta:', err));
    registerAudit('MESSAGE_BENEFICIAIRE', `Message envoyé au fil de ${beneficiary.prenom} ${beneficiary.nom}`.trim(), { beneficiaryId: beneficiary.id });
    setBeneficiaryChatForm((prev) => ({ ...prev, message: '' }));
    setBeneficiaryAttachment(null);
    showMessage('Message envoyé au fil bénéficiaire/référent.');
  };


  const addPersonalAgendaItem = (event) => {
    event.preventDefault();
    if (!currentUser || !text(personalAgendaForm.title) || !text(personalAgendaForm.startAt)) {
      showMessage('Titre et date/heure sont obligatoires pour l’agenda personnel.');
      return;
    }
    const entry = {
      id: uid('agenda'),
      structureId: currentStructureId,
      ownerUserId: currentUser.id,
      title: text(personalAgendaForm.title),
      startAt: personalAgendaForm.startAt,
      notes: text(personalAgendaForm.notes),
      createdBy: currentUser.nom,
      createdAt: new Date().toISOString(),
    };
    setAgendaState((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [currentUser.id]: sortAgenda([...(prev.personal[currentUser.id] || []), entry]),
      },
    }));
    setPersonalAgendaForm({ title: '', startAt: '', notes: '' });
    registerAudit('AGENDA_PERSONNEL', `Événement personnel créé : ${entry.title}`, { agendaId: entry.id });
    showMessage('Événement ajouté à votre agenda personnel.');
  };

  const addBeneficiaryAgendaItem = (event) => {
    event.preventDefault();
    if (!currentUser || !text(beneficiaryAgendaForm.beneficiaryId) || !text(beneficiaryAgendaForm.startAt)) {
      showMessage('Bénéficiaire et date/heure sont obligatoires.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(beneficiaryAgendaForm.beneficiaryId));
    if (!beneficiary) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const entry = {
      id: uid('bagenda'),
      beneficiaryId: beneficiary.id,
      beneficiaryName: `${beneficiary.prenom} ${beneficiary.nom}`.trim(),
      type: beneficiaryAgendaForm.type,
      startAt: beneficiaryAgendaForm.startAt,
      notes: text(beneficiaryAgendaForm.notes),
      referentUserId: currentUser.id,
      referentName: currentUser.nom,
      createdAt: new Date().toISOString(),
    };
    setAgendaState((prev) => ({
      ...prev,
      beneficiary: {
        ...prev.beneficiary,
        [currentStructureId]: sortAgenda([...(prev.beneficiary[currentStructureId] || []), entry]),
      },
    }));
    syncAgendaBeneficiaire(currentStructureId, entry).catch(err => console.warn('Sync agenda:', err));
    setBeneficiaryAgendaForm({ beneficiaryId: '', type: 'rdv_referent', startAt: '', notes: '' });
    registerAudit('AGENDA_BENEFICIAIRE', `Événement bénéficiaire créé pour ${beneficiary.prenom} ${beneficiary.nom}`.trim(), { beneficiaryId: beneficiary.id, agendaId: entry.id });
    showMessage('Événement ajouté à l’agenda bénéficiaire.');
  };

  const addStructureAgendaItem = (event) => {
    event.preventDefault();
    if (!currentUser || !text(structureAgendaForm.title) || !text(structureAgendaForm.startAt)) {
      showMessage('Titre et date/heure sont obligatoires pour l’agenda structure.');
      return;
    }
    const entry = {
      id: uid('sagenda'),
      type: structureAgendaForm.type,
      title: text(structureAgendaForm.title),
      startAt: structureAgendaForm.startAt,
      notes: text(structureAgendaForm.notes),
      createdBy: currentUser.nom,
      createdAt: new Date().toISOString(),
    };
    setAgendaState((prev) => ({
      ...prev,
      structure: {
        ...prev.structure,
        [currentStructureId]: sortAgenda([...(prev.structure[currentStructureId] || []), entry]),
      },
    }));
    setStructureAgendaForm({ type: 'reunion', title: '', startAt: '', notes: '' });
    registerAudit('AGENDA_STRUCTURE', `Événement structure créé : ${entry.title}`, { agendaId: entry.id });
    showMessage('Événement ajouté à l’agenda de la structure.');
  };

  const removeAgendaItem = (scope, id) => {
    setAgendaState((prev) => {
      if (scope === 'personal' && currentUser) {
        return {
          ...prev,
          personal: {
            ...prev.personal,
            [currentUser.id]: (prev.personal[currentUser.id] || []).filter((item) => item.id !== id),
          },
        };
      }
      if (scope === 'beneficiary') {
        return {
          ...prev,
          beneficiary: {
            ...prev.beneficiary,
            [currentStructureId]: (prev.beneficiary[currentStructureId] || []).filter((item) => item.id !== id),
          },
        };
      }
      return {
        ...prev,
        structure: {
          ...prev.structure,
          [currentStructureId]: (prev.structure[currentStructureId] || []).filter((item) => item.id !== id),
        },
      };
    });
    showMessage('Événement supprimé.');
  };


  const directConversationsForCurrentUser = Object.values(chatState.directConversations || {}).filter((conversation) =>
    conversation.participantIds?.includes(participantKey('pro', currentUser?.id))
  );

  const beneficiaryConversationsForCurrentUser = Object.values(chatState.beneficiaryConversations || {}).filter((conversation) =>
    conversation.participantIds?.includes(participantKey('pro', currentUser?.id))
  );

  const currentReads = chatReads[currentUser?.id] || { channel: {}, direct: {}, beneficiary: {} };
  const unreadChannelCount = countUnread(currentChannelMessages, currentUser?.id, currentReads.channel?.[currentStructureId]);
  const directUnreadByConversation = Object.fromEntries(directConversationsForCurrentUser.map((conversation) => [
    conversation.id,
    countUnread(conversation.messages, currentUser?.id, currentReads.direct?.[conversation.id]),
  ]));
  const beneficiaryUnreadByConversation = Object.fromEntries(beneficiaryConversationsForCurrentUser.map((conversation) => [
    conversation.id,
    countUnread(conversation.messages, currentUser?.id, currentReads.beneficiary?.[conversation.id]),
  ]));
  const unreadDirectCount = Object.values(directUnreadByConversation).reduce((sum, value) => sum + value, 0);
  const unreadBeneficiaryCount = Object.values(beneficiaryUnreadByConversation).reduce((sum, value) => sum + value, 0);
  const totalUnreadMessages = unreadChannelCount + unreadDirectCount + unreadBeneficiaryCount;

  const markChannelRead = () => {
    if (!currentUser || !currentStructureId) return;
    setChatReads((prev) => ({
      ...prev,
      [currentUser.id]: {
        ...(prev[currentUser.id] || {}),
        channel: {
          ...((prev[currentUser.id] || {}).channel || {}),
          [currentStructureId]: new Date().toISOString(),
        },
        direct: (prev[currentUser.id] || {}).direct || {},
        beneficiary: (prev[currentUser.id] || {}).beneficiary || {},
      },
    }));
    showMessage('Canal marqué comme lu.');
  };

  const markConversationRead = (scope, conversationId) => {
    if (!currentUser || !conversationId) return;
    setChatReads((prev) => ({
      ...prev,
      [currentUser.id]: {
        ...(prev[currentUser.id] || {}),
        channel: (prev[currentUser.id] || {}).channel || {},
        direct: scope === 'direct' ? { ...((prev[currentUser.id] || {}).direct || {}), [conversationId]: new Date().toISOString() } : ((prev[currentUser.id] || {}).direct || {}),
        beneficiary: scope === 'beneficiary' ? { ...((prev[currentUser.id] || {}).beneficiary || {}), [conversationId]: new Date().toISOString() } : ((prev[currentUser.id] || {}).beneficiary || {}),
      },
    }));
  };

  const filteredChannelMessages = currentChannelMessages.filter((message) => {
    const matches = !text(chatFilters.channelSearch) || matchesSearch(`${message.authorName} ${message.content} ${message.attachment?.name || ''}`, chatFilters.channelSearch);
    const unreadOk = !chatFilters.unreadOnly || (message.authorId !== currentUser?.id && (!currentReads.channel?.[currentStructureId] || String(message.createdAt) > String(currentReads.channel?.[currentStructureId])));
    return matches && unreadOk;
  });

  const filteredDirectConversations = directConversationsForCurrentUser.filter((conversation) => {
    const hay = `${(conversation.participantNames || []).join(' ')} ${(conversation.messages || []).map((m) => `${m.authorName} ${m.content} ${m.attachment?.name || ''}`).join(' ')}`;
    const matches = !text(chatFilters.directSearch) || matchesSearch(hay, chatFilters.directSearch);
    const unreadOk = !chatFilters.unreadOnly || (directUnreadByConversation[conversation.id] || 0) > 0;
    return matches && unreadOk;
  });

  const filteredBeneficiaryConversations = beneficiaryConversationsForCurrentUser.filter((conversation) => {
    const hay = `${conversation.beneficiaryName || ''} ${(conversation.participantNames || []).join(' ')} ${(conversation.messages || []).map((m) => `${m.authorName} ${m.content} ${m.attachment?.name || ''}`).join(' ')}`;
    const matches = !text(chatFilters.beneficiarySearch) || matchesSearch(hay, chatFilters.beneficiarySearch);
    const unreadOk = !chatFilters.unreadOnly || (beneficiaryUnreadByConversation[conversation.id] || 0) > 0;
    return matches && unreadOk;
  });

  const reminderItems = useMemo(() => {
    const now = Date.now();
    const upcomingLimit = now + 1000 * 60 * 60 * 24 * 3;
    const source = [
      ...(currentPersonalAgenda || []).map((item) => ({ ...item, scope: 'Personnel' })),
      ...(currentBeneficiaryAgenda || []).map((item) => ({ ...item, scope: 'Bénéficiaires', title: item.beneficiaryName })),
      ...(currentStructureAgenda || []).map((item) => ({ ...item, scope: 'Structure' })),
    ];
    return source
      .filter((item) => item.startAt)
      .map((item) => ({
        ...item,
        timestamp: new Date(item.startAt).getTime(),
        reminderType: new Date(item.startAt).getTime() < now ? 'En retard' : 'À venir',
      }))
      .filter((item) => item.timestamp <= upcomingLimit)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [currentPersonalAgenda, currentBeneficiaryAgenda, currentStructureAgenda]);

  const agendaReminderCount = reminderItems.length;
  const startupHighlights = useMemo(() => {
    const items = [];
    if (totalUnreadMessages) items.push({ id: 'unread', title: `${totalUnreadMessages} message(s) non lu(s)`, detail: 'Consultez l’onglet Messagerie pour les lire.' });
    reminderItems.slice(0, 4).forEach((item) => items.push({
      id: `rem-${item.id}`,
      title: item.title || item.beneficiaryName || 'Événement',
      detail: `${item.scope} · ${new Date(item.startAt).toLocaleString('fr-FR')} · ${item.reminderType}`,
    }));
    return items;
  }, [totalUnreadMessages, reminderItems]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `${currentUser.id}:${currentStructureId}`;
    if (liveCountersRef.current.userKey !== userKey) {
      liveCountersRef.current = { userKey, unread: totalUnreadMessages, reminders: agendaReminderCount };
      return;
    }
    if (typeof liveCountersRef.current.unread === 'number' && totalUnreadMessages > liveCountersRef.current.unread) {
      const diff = totalUnreadMessages - liveCountersRef.current.unread;
      notifyDesktop('PCGI 87 · Messagerie', `${diff} nouveau(x) message(s) non lu(s).`);
      if (activeTab !== 'messagerie') showMessage(`${diff} nouveau(x) message(s) reçu(s).`);
    }
    if (typeof liveCountersRef.current.reminders === 'number' && agendaReminderCount > liveCountersRef.current.reminders) {
      const diff = agendaReminderCount - liveCountersRef.current.reminders;
      notifyDesktop('PCGI 87 · Agenda', `${diff} rappel(s) agenda à consulter.`);
      if (activeTab !== 'agendas') showMessage(`${diff} nouveau(x) rappel(s) agenda.`);
    }
    liveCountersRef.current.unread = totalUnreadMessages;
    liveCountersRef.current.reminders = agendaReminderCount;
  }, [totalUnreadMessages, agendaReminderCount, currentUser?.id, currentStructureId, activeTab]);

  const filterAgendaItems = (items) => items.filter((item) => {
    const hay = `${item.title || ''} ${item.notes || ''} ${item.beneficiaryName || ''} ${agendaLabel(item.type)}`;
    const matches = !text(agendaFilters.search) || matchesSearch(hay, agendaFilters.search);
    const upcomingOk = !agendaFilters.upcomingOnly || new Date(item.startAt).getTime() <= Date.now() + 1000 * 60 * 60 * 24 * 7;
    return matches && upcomingOk;
  });

  const handleProfessionalLogin = (event) => {
    event.preventDefault();
    const structure = structures[loginForm.structureId];
    if (!structure) {
      showMessage('Structure introuvable.');
      return;
    }
    const user = structure.utilisateurs.find((item) => text(item.email).toLowerCase() === text(loginForm.email).toLowerCase());
    if (!user || user.motDePasse !== loginForm.motDePasse) {
      showMessage('Identifiant ou mot de passe incorrect.');
      return;
    }
    setCurrentStructureId(structure.id);
    setCurrentUser(user);
    persistRememberedSession(structure.id, user);
    setMustChangePassword(Boolean(user.firstLogin));
    setActiveTab('dashboard');
    registerAudit('CONNEXION', `Connexion de ${user.nom}`, { userId: user.id });
    showMessage(`Bienvenue ${user.nom}.`);
  };

  const handleChangePassword = (event) => {
    event.preventDefault();
    if (!currentUser || !currentStructureId) return;
    if (text(passwordForm.password).length < 6) {
      showMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      showMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    let updatedUser = null;
    let updatedStructureForSync = null;
    setStructures((prev) => {
      const next = {
        ...prev,
        [currentStructureId]: {
          ...prev[currentStructureId],
          utilisateurs: prev[currentStructureId].utilisateurs.map((user) => {
            if (user.id !== currentUser.id) return user;
            updatedUser = { ...user, motDePasse: passwordForm.password, firstLogin: false };
            return updatedUser;
          }),
        },
      };
      updatedStructureForSync = next[currentStructureId];
      return next;
    });
    if (updatedStructureForSync) {
      syncStructure(updatedStructureForSync).catch(err => console.warn('Sync structure:', err));
    }
    if (updatedUser) {
      setCurrentUser(updatedUser);
      persistRememberedSession(currentStructureId, updatedUser);
    }
    setPasswordForm({ password: '', confirmPassword: '' });
    setMustChangePassword(false);
    registerAudit('MOT_DE_PASSE', 'Mot de passe changé au premier accès.', { userId: currentUser.id });
    showMessage('Mot de passe mis à jour.');
  };

  const handleForgotPassword = (event) => {
    event.preventDefault();
    const structure = structures[forgotForm.structureId];
    const user = structure?.utilisateurs.find((item) => text(item.email).toLowerCase() === text(forgotForm.email).toLowerCase());
    if (!structure || !user) {
      showMessage('Aucun compte correspondant trouvé.');
      return;
    }
    const tempPassword = randomPassword();
    let updatedStructureForSync2 = null;
    setStructures((prev) => {
      const next = {
        ...prev,
        [structure.id]: {
          ...prev[structure.id],
          utilisateurs: prev[structure.id].utilisateurs.map((item) => item.id === user.id ? { ...item, motDePasse: tempPassword, firstLogin: true } : item),
        },
      };
      updatedStructureForSync2 = next[structure.id];
      return next;
    });
    if (updatedStructureForSync2) {
      syncStructure(updatedStructureForSync2).catch(err => console.warn('Sync structure:', err));
    }
    setForgotResult({ structure: structure.nom, email: user.email, motDePasse: tempPassword });
    showMessage('Mot de passe temporaire généré.');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.rememberedSession);
    setCurrentUser(null);
    setMustChangePassword(false);
    setActiveTab('dashboard');
    setLoginForm((prev) => ({ ...prev, motDePasse: '', rememberMe: false }));
  };

  const handleAddUser = (event) => {
    event.preventDefault();
    if (!currentStructureId || !currentUser) return;
    const validation = validateUserData(newUserForm);
    if (!validation.isValid) {
      showMessage(validation.errors.join(' · '));
      return;
    }
    if (text(newUserForm.motDePasse).length < 6) {
      showMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    const newUser = {
      id: uid('user'),
      nom: titleCase(newUserForm.nom),
      email: text(newUserForm.email).toLowerCase(),
      role: newUserForm.role,
      motDePasse: text(newUserForm.motDePasse),
      firstLogin: true,
      statut: 'Actif',
      dateEmbauche: today(),
    };
    let newStructureForSync = null;
    setStructures((prev) => {
      const next = {
        ...prev,
        [currentStructureId]: {
          ...prev[currentStructureId],
          utilisateurs: [...prev[currentStructureId].utilisateurs, newUser],
        },
      };
      newStructureForSync = next[currentStructureId];
      return next;
    });
    if (newStructureForSync) {
      syncStructure(newStructureForSync).catch(err => console.warn('Sync structure:', err));
    }
    setFirstAccessInfo({ structure: currentStructure.nom, email: newUser.email, motDePasse: newUser.motDePasse });
    setNewUserForm({ nom: '', email: '', role: 'CIP', motDePasse: '' });
    registerAudit('UTILISATEUR_AJOUTE', `Utilisateur ajouté : ${newUser.nom}`, { userId: newUser.id });
    showMessage('Utilisateur ajouté.');
  };

  const handleDeleteUser = (userId) => {
    if (!currentStructureId || !currentUser) return;
    if (userId === currentUser.id) {
      showMessage('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    let deletedUserStructureForSync = null;
    setStructures((prev) => {
      const next = {
        ...prev,
        [currentStructureId]: {
          ...prev[currentStructureId],
          utilisateurs: prev[currentStructureId].utilisateurs.filter((user) => user.id !== userId),
        },
      };
      deletedUserStructureForSync = next[currentStructureId];
      return next;
    });
    if (deletedUserStructureForSync) {
      syncStructure(deletedUserStructureForSync).catch(err => console.warn('Sync structure:', err));
    }
    registerAudit('UTILISATEUR_SUPPRIME', `Utilisateur supprimé : ${userId}`, { userId });
    showMessage('Utilisateur supprimé.');
  };

  const handleEditDirectoryEntry = (entry) => {
    setDirectoryForm({
      id: String(entry.id || ''),
      grandDomaine: entry.grandDomaine || 'Insertion & Emploi',
      categorie: entry.categorie || "SIAE (Insertion par l'Activité)",
      nom: entry.nom || '',
      desc: entry.desc || '',
      tel: entry.tel || '',
      email: entry.email || '',
      siteWeb: entry.siteWeb || '',
      adresse: entry.adresse || '',
    });
    setActiveTab('annuaire');
  };

  const handleDeleteDirectoryEntry = (entryId) => {
    if (!entryId) return;
    setAnnuaire((prev) => clone(prev).map((bloc) => ({ ...bloc, structures: (bloc.structures || []).filter((item) => String(item.id) !== String(entryId)) })).filter((bloc) => (bloc.structures || []).length));
    if (String(directoryForm.id) === String(entryId)) setDirectoryForm(EMPTY_DIRECTORY_FORM);
    registerAudit('ANNUAIRE_SUPPRESSION', `Contact annuaire supprimé : ${entryId}`, { entryId });
    showMessage('Contact supprimé de l’annuaire.');
  };

  const handleSaveDirectoryEntry = (event) => {
    event.preventDefault();
    if (!text(directoryForm.nom)) {
      showMessage('Le nom du contact / de la structure est obligatoire.');
      return;
    }
    const entry = {
      id: text(directoryForm.id) || uid('dir'),
      grandDomaine: text(directoryForm.grandDomaine) || 'Insertion & Emploi',
      categorie: text(directoryForm.categorie) || 'Contacts',
      nom: text(directoryForm.nom),
      desc: text(directoryForm.desc),
      tel: text(directoryForm.tel),
      email: text(directoryForm.email).toLowerCase(),
      siteWeb: text(directoryForm.siteWeb),
      adresse: text(directoryForm.adresse),
    };
    setAnnuaire((prev) => {
      const next = clone(prev).map((bloc) => ({ ...bloc, structures: [...(bloc.structures || [])] }));
      next.forEach((bloc) => {
        bloc.structures = (bloc.structures || []).filter((item) => String(item.id) !== String(entry.id));
      });
      let bloc = next.find((item) => item.grandDomaine === entry.grandDomaine && item.categorie === entry.categorie);
      if (!bloc) {
        bloc = { grandDomaine: entry.grandDomaine, categorie: entry.categorie, structures: [] };
        next.push(bloc);
      }
      bloc.structures.unshift({
        id: entry.id,
        nom: entry.nom,
        desc: entry.desc,
        tel: entry.tel,
        email: entry.email,
        siteWeb: entry.siteWeb,
        adresse: entry.adresse,
      });
      return next.filter((item) => (item.structures || []).length);
    });
    setDirectoryForm(EMPTY_DIRECTORY_FORM);
    registerAudit('ANNUAIRE_MAJ', `Annuaire mis à jour : ${entry.nom}`, { entryId: entry.id });
    showMessage(String(directoryForm.id) ? 'Contact annuaire modifié.' : 'Contact ajouté à l’annuaire.');
  };

  const handleAddStructure = (event) => {
    event.preventDefault();
    if (!canCreateStructure) {
      showMessage('Seule Cindy Binchi peut créer une structure.');
      return;
    }
    if (!text(newStructureForm.nom) || !text(newStructureForm.coordinatorEmail) || !text(newStructureForm.coordinatorName)) {
      showMessage('Nom de structure, nom coordinateur et email coordinateur sont obligatoires.');
      return;
    }
    const structureId = uid('struct');
    const managerId = uid('user');
    const tempPassword = text(newStructureForm.coordinatorPassword) || randomPassword();
    const structure = {
      id: structureId,
      nom: text(newStructureForm.nom),
      type: text(newStructureForm.type) || 'SIAE - Insertion',
      ville: text(newStructureForm.ville),
      telephone: text(newStructureForm.telephone),
      email: text(newStructureForm.email).toLowerCase(),
      manager: {
        id: managerId,
        nom: titleCase(newStructureForm.coordinatorName),
        email: text(newStructureForm.coordinatorEmail).toLowerCase(),
      },
      utilisateurs: [
        {
          id: managerId,
          nom: titleCase(newStructureForm.coordinatorName),
          email: text(newStructureForm.coordinatorEmail).toLowerCase(),
          role: 'Coordinateur',
          motDePasse: tempPassword,
          firstLogin: true,
          statut: 'Actif',
          dateEmbauche: today(),
        },
      ],
    };
    setStructures((prev) => ({ ...prev, [structureId]: structure }));
    syncStructure(structure).catch(err => console.warn('Sync structure:', err));
    setBeneficiairesByStructure((prev) => ({ ...prev, [structureId]: [] }));
    setWorkspace((prev) => ({ ...prev, [structureId]: { emailSettings: { ...INITIAL_EMAIL_SETTINGS }, messages: [], meetings: [] } }));
    setAgendaState((prev) => ({
      personal: prev.personal,
      beneficiary: { ...prev.beneficiary, [structureId]: [] },
      structure: { ...prev.structure, [structureId]: [] },
    }));
    setTrackingState((prev) => ({ ...prev, [structureId]: emptyStructureTracking() }));
    setSecretariatState((prev) => ({ ...prev, [structureId]: emptyStructureSecretariat() }));
    setAnnuaire((prev) => {
      const next = clone(prev);
      let bloc = next.find((item) => item.grandDomaine === 'Insertion & Emploi' && item.categorie === "SIAE (Insertion par l'Activité)");
      if (!bloc) {
        bloc = { grandDomaine: 'Insertion & Emploi', categorie: "SIAE (Insertion par l'Activité)", structures: [] };
        next.push(bloc);
      }
      bloc.structures.push({
        id: structureId,
        nom: structure.nom,
        desc: structure.type,
        tel: structure.telephone,
        email: structure.email,
        siteWeb: '',
        adresse: structure.ville,
      });
      return next;
    });
    setFirstAccessInfo({ structure: structure.nom, email: structure.manager.email, motDePasse: tempPassword });
    setNewStructureForm({ nom: '', type: 'SIAE - Insertion', ville: '', telephone: '', email: '', coordinatorName: '', coordinatorEmail: '', coordinatorPassword: '' });
    registerAudit('STRUCTURE_AJOUTEE', `Structure créée : ${structure.nom}`, { structureId });
    showMessage('Structure créée.');
  };

  const handleAddBeneficiary = (event) => {
    event.preventDefault();
    if (!currentStructureId || !text(beneficiaryForm.nom) || !text(beneficiaryForm.prenom)) {
      showMessage('Le nom et le prénom du bénéficiaire sont obligatoires.');
      return;
    }
    const entry = {
  id: uid('benef'),
  nom: titleCase(beneficiaryForm.nom),
  prenom: titleCase(beneficiaryForm.prenom),
  email: text(beneficiaryForm.email).toLowerCase(),
  telephone: text(beneficiaryForm.telephone),
  statut: beneficiaryForm.statut,
  dateEntree: today(),
  accessCode: 'PCGI87!',
};
    setBeneficiairesByStructure((prev) => ({ ...prev, [currentStructureId]: [entry, ...(prev[currentStructureId] || [])] }));
    syncBeneficiaire(currentStructureId, entry).catch(err => console.warn('Sync bénéficiaire:', err));

    setBeneficiaryForm({ nom: '', prenom: '', email: '', telephone: '', statut: 'En cours' });
    registerAudit('BENEFICIAIRE_AJOUTE', `Bénéficiaire ajouté : ${entry.prenom} ${entry.nom}`.trim(), { beneficiaryId: entry.id });
    showMessage('Bénéficiaire ajouté.');
  };

  const handleImportBeneficiaries = (importedList) => {
    if (!currentStructureId || !importedList || importedList.length === 0) return;
    setBeneficiairesByStructure((prev) => ({
      ...prev,
      [currentStructureId]: [...importedList, ...(prev[currentStructureId] || [])],
    }));
    importedList.forEach((entry) => {
      syncBeneficiaire(currentStructureId, entry).catch(err => console.warn('Sync import:', err));
    });
    registerAudit('IMPORT_BENEFICIAIRES', `Import en masse : ${importedList.length} bénéficiaires`, {});
    showMessage(`${importedList.length} bénéficiaires importés avec succès.`);
  };



  const handleAddSynthesis = (event) => {
    event.preventDefault();
    if (!currentStructureId || !text(synthesisForm.beneficiaryId)) {
      showMessage('Sélectionnez un bénéficiaire pour enregistrer la synthèse.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(synthesisForm.beneficiaryId));
    if (!beneficiary) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const payload = { ...synthesisForm, beneficiaryName: `${beneficiary.nom || ''} ${beneficiary.prenom || ''}`.trim(), authorId: currentUser.id, authorName: currentUser.nom, createdAt: new Date().toISOString() };
    setTrackingState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureTracking()),
        syntheses: {
          ...((prev[currentStructureId] || emptyStructureTracking()).syntheses || {}),
          [beneficiary.id]: [
            ...((((prev[currentStructureId] || emptyStructureTracking()).syntheses || {})[beneficiary.id]) || []),
            payload,
          ],
        },
        meetingReports: (prev[currentStructureId] || emptyStructureTracking()).meetingReports || [],
      },
    }));
    setSynthesisForm(INITIAL_SYNTHESIS_FORM);
    registerAudit('SYNTHESE', `Synthèse enregistrée pour ${beneficiary.prenom} ${beneficiary.nom}`.trim(), { beneficiaryId: beneficiary.id });
    showMessage('Synthèse enregistrée et tableau de suivi mis à jour.');
  };

  const handleAddMeetingReport = (event) => {
    event.preventDefault();
    if (!currentStructureId || !text(meetingReportForm.title) || !text(meetingReportForm.meetingDate)) {
      showMessage('Titre et date du compte rendu sont obligatoires.');
      return;
    }
    const entry = {
      id: uid('meeting'),
      ...meetingReportForm,
      authorId: currentUser.id,
      authorName: currentUser.nom,
      createdAt: new Date().toISOString(),
    };
    setTrackingState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureTracking()),
        syntheses: (prev[currentStructureId] || emptyStructureTracking()).syntheses || {},
        meetingReports: [entry, ...((prev[currentStructureId] || emptyStructureTracking()).meetingReports || [])],
      },
    }));
    setMeetingReportForm(INITIAL_MEETING_REPORT_FORM);
    registerAudit('REUNION', `Compte rendu enregistré : ${entry.title}`, { reportId: entry.id });
    showMessage('Compte rendu de réunion enregistré.');
  };

  const removeMeetingReport = (reportId) => {
    setTrackingState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureTracking()),
        syntheses: (prev[currentStructureId] || emptyStructureTracking()).syntheses || {},
        meetingReports: ((prev[currentStructureId] || emptyStructureTracking()).meetingReports || []).filter((item) => item.id !== reportId),
      },
    }));
    showMessage('Compte rendu supprimé.');
  };

  const handleAddEvaluation = (event) => {
    event.preventDefault();
    if (!text(evaluationForm.beneficiaryId) || !text(evaluationForm.skill)) {
      showMessage('Bénéficiaire et compétence sont obligatoires.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(evaluationForm.beneficiaryId));
    if (!beneficiary) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const entry = {
      id: uid('eval'),
      beneficiaryId: beneficiary.id,
      beneficiaryName: `${beneficiary.prenom} ${beneficiary.nom}`.trim(),
      type: evaluationForm.type,
      skill: evaluationForm.skill,
      status: evaluationForm.status,
      comment: evaluationForm.comment,
      authorId: currentUser.id,
      authorName: currentUser.nom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEvaluations((prev) => ({
      ...prev,
      [beneficiary.id]: [...(prev[beneficiary.id] || []), entry],
    }));
    setEvaluationForm(INITIAL_EVALUATION_FORM);
    registerAudit('EVALUATION', `Évaluation créée pour ${beneficiary.prenom} ${beneficiary.nom}`.trim(), { beneficiaryId: beneficiary.id, skill: evaluationForm.skill, type: evaluationForm.type });
    showMessage('Évaluation enregistrée.');
  };

  const updateEvaluation = (beneficiaryId, evaluationId, updates) => {
    setEvaluations((prev) => ({
      ...prev,
      [beneficiaryId]: (prev[beneficiaryId] || []).map((item) =>
        item.id === evaluationId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    }));
    showMessage('Évaluation mise à jour.');
  };

  const removeEvaluation = (beneficiaryId, evaluationId) => {
    setEvaluations((prev) => ({
      ...prev,
      [beneficiaryId]: (prev[beneficiaryId] || []).filter((item) => item.id !== evaluationId),
    }));
    showMessage('Évaluation supprimée.');
  };

  const handleUploadEvaluationPdf = async (fileList) => {
    if (!evalPdfBeneficiaryId) {
      showMessage('Sélectionnez un bénéficiaire avant de charger un document.');
      return;
    }
    const files = Array.from(fileList || []).filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (files.length === 0) {
      showMessage('Veuillez sélectionner un ou plusieurs fichiers PDF.');
      return;
    }
    setEvalPdfUploading(true);
    try {
      await initSync();
      for (const file of files) {
        await uploadEvaluationPdf(currentStructureId, evalPdfBeneficiaryId, file, {
          authorId: currentUser?.id,
          authorName: currentUser?.nom,
        });
      }
      const beneficiary = beneficiaires.find((b) => b.id === evalPdfBeneficiaryId);
      registerAudit('EVALUATION_PDF_IMPORT', `${files.length} document(s) d'évaluation papier importé(s) pour ${beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : ''}`.trim(), { beneficiaryId: evalPdfBeneficiaryId });
      showMessage(`${files.length} document${files.length > 1 ? 's' : ''} importé${files.length > 1 ? 's' : ''} avec succès.`);
    } catch (err) {
      console.error(err);
      showMessage("Erreur lors de l'import du document. Vérifiez votre connexion.");
    }
    setEvalPdfUploading(false);
  };

  const handleDeleteEvaluationPdf = async (pdfDoc) => {
    if (!evalPdfBeneficiaryId) return;
    try {
      await deleteEvaluationPdf(currentStructureId, evalPdfBeneficiaryId, pdfDoc);
      showMessage('Document supprimé.');
    } catch (err) {
      console.error(err);
      showMessage('Erreur lors de la suppression du document.');
    }
  };

  const handleUploadSalarieDocument = async (fileList) => {
    if (!salarieDocBeneficiaryId) {
      showMessage('Sélectionnez un bénéficiaire avant de charger un document.');
      return;
    }
    const files = Array.from(fileList || []).filter((f) =>
      f.type === 'application/pdf' ||
      f.type === 'application/msword' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      /\.(pdf|doc|docx)$/i.test(f.name)
    );
    if (files.length === 0) {
      showMessage('Veuillez sélectionner un ou plusieurs fichiers PDF ou Word.');
      return;
    }
    setSalarieDocUploading(true);
    try {
      await initSync();
      for (const file of files) {
        await uploadSalarieDocument(currentStructureId, salarieDocBeneficiaryId, file, {
          authorId: currentUser?.id,
          authorName: currentUser?.nom,
          category: salarieDocCategory,
        });
      }
      const beneficiary = beneficiaires.find((b) => b.id === salarieDocBeneficiaryId);
      registerAudit('SALARIE_DOC_IMPORT', `${files.length} document(s) salarié importé(s) pour ${beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : ''}`.trim(), { beneficiaryId: salarieDocBeneficiaryId });
      showMessage(`${files.length} document${files.length > 1 ? 's' : ''} importé${files.length > 1 ? 's' : ''} avec succès.`);
    } catch (err) {
      console.error(err);
      showMessage("Erreur lors de l'import du document. Vérifiez votre connexion.");
    }
    setSalarieDocUploading(false);
  };

  const handleDeleteSalarieDocument = async (docItem) => {
    if (!salarieDocBeneficiaryId) return;
    try {
      await deleteSalarieDocument(currentStructureId, salarieDocBeneficiaryId, docItem);
      showMessage('Document supprimé.');
    } catch (err) {
      console.error(err);
      showMessage('Erreur lors de la suppression du document.');
    }
  };

  const addCustomSkill = () => {
    if (!text(newSkillInput)) {
      showMessage('Veuillez entrer le nom de la compétence.');
      return;
    }
    setCustomSkills((prev) => ({
      ...prev,
      [evaluationTab]: [...(prev[evaluationTab] || []), newSkillInput],
    }));
    setNewSkillInput('');
    showMessage('Compétence ajoutée.');
  };

  const generateInvitationLink = (beneficiaryId) => {
    const beneficiary = beneficiaires.find((b) => b.id === beneficiaryId);
    if (!beneficiary) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const invitationId = uid('invite');
    const invitationLink = `https://pcgi87beneficiaire.vercel.app/?invite=${invitationId}&benId=${beneficiaryId}&structId=${currentStructureId}`;

    setInvitations((prev) => ({
      ...prev,
      [invitationId]: {
        id: invitationId,
        beneficiaryId,
        beneficiaryName: `${beneficiary.prenom} ${beneficiary.nom}`,
        structureId: currentStructureId,
        link: invitationLink,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.nom,
        used: false,
      },
    }));

    // Marquer le bénéficiaire en "première connexion" pour forcer le changement de code à l'arrivée
    const updatedBeneficiary = { ...beneficiary, firstLogin: true };
    setBeneficiairesByStructure((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).map((b) => b.id === beneficiaryId ? updatedBeneficiary : b),
    }));
    syncBeneficiaire(currentStructureId, updatedBeneficiary).catch(err => console.warn('Sync bénéficiaire:', err));

    navigator.clipboard.writeText(invitationLink);
    registerAudit("GENERATE_INVITATION", `Lien d'invitation généré pour ${beneficiary.prenom} ${beneficiary.nom}`, { beneficiaryId });
    showMessage("Lien d'invitation copié dans le presse-papiers !");
  };

  const assignBeneficiaryToCipEncadrant = (event) => {
    event.preventDefault();
    if (!text(assignForm.beneficiaryId) || (assignForm.cipIds.length === 0 && assignForm.encadrantIds.length === 0)) {
      showMessage("Sélectionnez au moins un CIP ou un encadrant technique.");
      return;
    }
    setBeneficiaryAssignments((prev) => ({
      ...prev,
      [assignForm.beneficiaryId]: {
        cipIds: assignForm.cipIds,
        encadrantIds: assignForm.encadrantIds,
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser.nom,
      },
    }));
    registerAudit("ASSIGN_BENEFICIARY", `Bénéficiaire assigné à CIP et encadrants`, { beneficiaryId: assignForm.beneficiaryId });
    setAssignForm({ beneficiaryId: "", cipIds: [], encadrantIds: [] });
    showMessage("Bénéficiaire assigné avec succès.");
  };

  const handleSelfAssignBeneficiary = (beneficiaryId) => {
    if (!beneficiaryId || !currentUser) return;
    const isCip = currentUser.role === 'CIP';
    const isEncadrant = currentUser.role === 'Encadrant Technique';
    if (!isCip && !isEncadrant) return;

    setBeneficiaryAssignments((prev) => {
      const existing = prev[beneficiaryId] || { cipIds: [], encadrantIds: [] };
      const cipIds = isCip && !existing.cipIds.includes(currentUser.id)
        ? [...existing.cipIds, currentUser.id]
        : existing.cipIds;
      const encadrantIds = isEncadrant && !existing.encadrantIds.includes(currentUser.id)
        ? [...existing.encadrantIds, currentUser.id]
        : existing.encadrantIds;
      return {
        ...prev,
        [beneficiaryId]: {
          cipIds,
          encadrantIds,
          assignedAt: new Date().toISOString(),
          assignedBy: currentUser.nom,
        },
      };
    });
    const beneficiary = beneficiaires.find((b) => b.id === beneficiaryId);
    registerAudit('AUTO_ASSIGN_BENEFICIARY', `${currentUser.nom} s'est assigné le bénéficiaire ${beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : ''}`.trim(), { beneficiaryId });
    showMessage('Bénéficiaire ajouté à votre portefeuille.');
  };

  const createInvoice = (event) => {
    event.preventDefault();
    if (!text(invoiceForm.beneficiaryId) || !text(invoiceForm.amount) || !text(invoiceForm.invoiceDate)) {
      showMessage("Les champs obligatoires doivent être remplis.");
      return;
    }
    const invoiceId = uid("invoice");
    const beneficiary = beneficiaires.find((b) => b.id === invoiceForm.beneficiaryId);
    setInvoices((prev) => ({
      ...prev,
      [currentStructureId]: [
        ...(prev[currentStructureId] || []),
        {
          id: invoiceId,
          beneficiaryId: invoiceForm.beneficiaryId,
          beneficiaryName: beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : "",
          amount: parseFloat(invoiceForm.amount),
          description: invoiceForm.description,
          invoiceDate: invoiceForm.invoiceDate,
          createdBy: currentUser.nom,
          createdAt: new Date().toISOString(),
          status: "Brouillon",
        },
      ],
    }));
    registerAudit("CREATE_INVOICE", `Facture créée pour ${beneficiary?.prenom} ${beneficiary?.nom}`, { invoiceId });
    setInvoiceForm({ beneficiaryId: "", amount: "", description: "", invoiceDate: today() });
    showMessage("Facture créée avec succès.");
  };

  const createDelegatedAccess = (event) => {
    event.preventDefault();
    if (!text(delegatedAccessForm.fromUserId) || !text(delegatedAccessForm.toUserId) || !text(delegatedAccessForm.endDate)) {
      showMessage("Tous les champs sont obligatoires.");
      return;
    }
    const fromUser = allProfessionalOptions.find((u) => u.id === delegatedAccessForm.fromUserId);
    const toUser = allProfessionalOptions.find((u) => u.id === delegatedAccessForm.toUserId);

    if (!fromUser || !toUser) {
      showMessage("Utilisateurs introuvables.");
      return;
    }

    setDelegatedAccesses((prev) => ({
      ...prev,
      [delegatedAccessForm.fromUserId]: {
        toUserId: delegatedAccessForm.toUserId,
        toUserName: toUser.nom,
        fromUserName: fromUser.nom,
        endDate: delegatedAccessForm.endDate,
        createdAt: new Date().toISOString(),
        active: new Date(delegatedAccessForm.endDate) > new Date(),
      },
    }));
    registerAudit("DELEGATE_ACCESS", `${fromUser.nom} a délégué ses accès à ${toUser.nom} jusqu'au ${delegatedAccessForm.endDate}`);
    setDelegatedAccessForm({ fromUserId: "", toUserId: "", endDate: "" });
    showMessage("Accès délégués avec succès.");
  };

  const handleExportTrackingCsv = () => {
    exportRowsToCsv(`tableau-suivi-${currentStructure?.nom || 'pcgi87'}.csv`, TRACKING_COLUMNS, trackingRows);
    showMessage('Export CSV du tableau de suivi lancé.');
  };

  const handleExportSynthesesPdf = () => {
    const syntheses = Object.values(currentSyntheses).flat();
    if (!syntheses.length) {
      showMessage('Aucune synthèse à exporter.');
      return;
    }
    const html = syntheses.map((entry) => {
      const rows = TRACKING_COLUMNS.map((column) => `<tr><th>${column.label}</th><td>${entry[column.key] || ''}</td></tr>`).join('');
      return `<div class="card"><h2>${entry.beneficiaryName || 'Bénéficiaire'}</h2><p class="meta">Par ${entry.authorName || ''} · ${new Date(entry.createdAt).toLocaleString('fr-FR')}</p><table>${rows}<tr><th>Notes</th><td>${entry.notes || ''}</td></tr></table></div>`;
    }).join('');
    if (printHtmlReport(`Synthèses de suivi - ${currentStructure?.nom || 'PCGI 87'}`, html)) {
      showMessage('Prévisualisation PDF des synthèses ouverte.');
    }
  };

  const handleExportMeetingReportsPdf = () => {
    if (!currentMeetingReports.length) {
      showMessage('Aucun compte rendu à exporter.');
      return;
    }
    const html = currentMeetingReports.map((report) => (`<div class="card"><h2>${report.title}</h2><p class="meta">${new Date(report.meetingDate).toLocaleDateString('fr-FR')} · ${report.authorName || ''}</p><p><strong>Participants :</strong> ${report.participants || ''}</p><p><strong>Compte rendu :</strong><br/>${(report.summary || '').replace(/\n/g,'<br/>')}</p><p><strong>Décisions :</strong><br/>${(report.decisions || '').replace(/\n/g,'<br/>')}</p><p><strong>Actions à suivre :</strong><br/>${(report.nextActions || '').replace(/\n/g,'<br/>')}</p></div>`)).join('');
    if (printHtmlReport(`Comptes rendus de réunion - ${currentStructure?.nom || 'PCGI 87'}`, html)) {
      showMessage('Prévisualisation PDF des comptes rendus ouverte.');
    }
  };

  const saveAdminRecord = (event) => {
    event.preventDefault();
    if (!currentStructureId || !text(adminRecordForm.beneficiaryId)) {
      showMessage('Sélectionnez un bénéficiaire.');
      return;
    }
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: {
          ...((prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {}),
          [adminRecordForm.beneficiaryId]: {
            beneficiaryId: adminRecordForm.beneficiaryId,
            prescripteur: adminRecordForm.prescripteur,
            situationAdministrative: adminRecordForm.situationAdministrative,
            piecesManquantes: adminRecordForm.piecesManquantes,
            notes: adminRecordForm.notes,
            dossierComplet: Boolean(adminRecordForm.dossierComplet),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.nom || '',
          },
        },
        frontDesk: (prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || [],
        convocations: (prev[currentStructureId] || emptyStructureSecretariat()).convocations || [],
        workshops: (prev[currentStructureId] || emptyStructureSecretariat()).workshops || [],
        contracts: (prev[currentStructureId] || emptyStructureSecretariat()).contracts || [],
        payslips: (prev[currentStructureId] || emptyStructureSecretariat()).payslips || [],
      },
    }));
    setAdminRecordForm({ beneficiaryId: '', prescripteur: '', situationAdministrative: '', piecesManquantes: '', notes: '', dossierComplet: false });
    registerAudit('DOSSIER_ADMIN', 'Dossier administratif mis à jour.', { beneficiaryId: adminRecordForm.beneficiaryId });
    showMessage('Dossier administratif mis à jour.');
  };

  const addFrontDeskNote = (event) => {
    event.preventDefault();
    if (!text(frontDeskForm.person) || !text(frontDeskForm.subject)) {
      showMessage('Personne et objet sont obligatoires.');
      return;
    }
    const entry = { id: uid('accueil'), ...frontDeskForm, createdAt: new Date().toISOString(), authorName: currentUser?.nom || '' };
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: (prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {},
        frontDesk: [entry, ...((prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || [])],
        convocations: (prev[currentStructureId] || emptyStructureSecretariat()).convocations || [],
        workshops: (prev[currentStructureId] || emptyStructureSecretariat()).workshops || [],
        contracts: (prev[currentStructureId] || emptyStructureSecretariat()).contracts || [],
        payslips: (prev[currentStructureId] || emptyStructureSecretariat()).payslips || [],
      },
    }));
    setFrontDeskForm({ person: '', contact: '', subject: '', destination: '', urgency: 'Normale', notes: '' });
    showMessage('Note d’accueil enregistrée.');
  };

  const addConvocation = (event) => {
    event.preventDefault();
    if (!text(convocationForm.beneficiaryId) || !text(convocationForm.date) || !text(convocationForm.heure)) {
      showMessage('Bénéficiaire, date et heure sont obligatoires.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(convocationForm.beneficiaryId));
    const entry = { id: uid('convoc'), ...convocationForm, beneficiaryName: beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : '', createdAt: new Date().toISOString() };
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: (prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {},
        frontDesk: (prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || [],
        convocations: [entry, ...((prev[currentStructureId] || emptyStructureSecretariat()).convocations || [])],
        workshops: (prev[currentStructureId] || emptyStructureSecretariat()).workshops || [],
        contracts: (prev[currentStructureId] || emptyStructureSecretariat()).contracts || [],
        payslips: (prev[currentStructureId] || emptyStructureSecretariat()).payslips || [],
      },
    }));
    setConvocationForm({ beneficiaryId: '', date: '', heure: '', motif: 'RDV administratif', canal: 'Application', commentaire: '' });
    registerAudit('CONVOCATION', `Convocation enregistrée pour ${entry.beneficiaryName || 'bénéficiaire'}`, { beneficiaryId: entry.beneficiaryId });
    showMessage('Convocation enregistrée.');
  };

  const addWorkshop = (event) => {
    event.preventDefault();
    if (!text(workshopForm.title) || !text(workshopForm.date)) {
      showMessage('Titre et date sont obligatoires.');
      return;
    }
    const entry = { id: uid('atelier'), ...workshopForm, createdAt: new Date().toISOString() };
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: (prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {},
        frontDesk: (prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || [],
        convocations: (prev[currentStructureId] || emptyStructureSecretariat()).convocations || [],
        workshops: [entry, ...((prev[currentStructureId] || emptyStructureSecretariat()).workshops || [])],
        contracts: (prev[currentStructureId] || emptyStructureSecretariat()).contracts || [],
        payslips: (prev[currentStructureId] || emptyStructureSecretariat()).payslips || [],
      },
    }));
    setWorkshopForm({ title: '', date: '', heure: '', lieu: '', participants: '', notes: '' });
    registerAudit('ATELIER', `Atelier créé : ${entry.title}`, { workshopId: entry.id });
    showMessage('Atelier ajouté.');
  };

  const prefillContract = () => {
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(contractForm.beneficiaryId));
    const content = generateContractTemplate(currentStructure, beneficiary, contractForm);
    setContractForm((prev) => ({
      ...prev,
      employeeName: prev.employeeName || `${beneficiary?.prenom || ''} ${beneficiary?.nom || ''}`.trim(),
      content,
    }));
    showMessage('Contrat prérempli généré.');
  };

  const saveContract = (event) => {
    event.preventDefault();
    if (!text(contractForm.employeeName) && !text(contractForm.beneficiaryId)) {
      showMessage('Choisissez un salarié ou saisissez un nom.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(contractForm.beneficiaryId));
    const content = text(contractForm.content) || generateContractTemplate(currentStructure, beneficiary, contractForm);
    const entry = {
      id: uid('contrat'),
      beneficiaryId: contractForm.beneficiaryId || '',
      employeeName: text(contractForm.employeeName) || `${beneficiary?.prenom || ''} ${beneficiary?.nom || ''}`.trim(),
      contractType: contractForm.contractType,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate,
      weeklyHours: contractForm.weeklyHours,
      remuneration: contractForm.remuneration,
      details: contractForm.details,
      content,
      createdAt: new Date().toISOString(),
      authorName: currentUser?.nom || '',
    };
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: (prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {},
        frontDesk: (prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || [],
        convocations: (prev[currentStructureId] || emptyStructureSecretariat()).convocations || [],
        workshops: (prev[currentStructureId] || emptyStructureSecretariat()).workshops || [],
        contracts: [entry, ...((prev[currentStructureId] || emptyStructureSecretariat()).contracts || [])],
        payslips: (prev[currentStructureId] || emptyStructureSecretariat()).payslips || [],
      },
    }));
    setContractForm({ beneficiaryId: '', employeeName: '', contractType: 'CDD Insertion', startDate: '', endDate: '', weeklyHours: '26h', remuneration: '', details: '', content: '' });
    registerAudit('CONTRAT', `Contrat enregistré : ${entry.employeeName}`, { contractId: entry.id, beneficiaryId: entry.beneficiaryId });
    showMessage('Contrat enregistré.');
  };

  const printContract = (contract) => {
    const html = `<div class="card"><p class="meta">${contract.employeeName} · ${contract.contractType}</p><pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif">${contract.content || ''}</pre></div>`;
    if (printHtmlReport(`Contrat - ${contract.employeeName}`, html)) showMessage('Prévisualisation du contrat ouverte.');
  };

  const addPayslipTransmission = (event) => {
    event.preventDefault();
    if ((!text(paySlipForm.employeeName) && !text(paySlipForm.beneficiaryId)) || !text(paySlipForm.period) || !paySlipAttachment) {
      showMessage('Salarié, période et fiche de paie sont obligatoires.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === String(paySlipForm.beneficiaryId));
    const entry = {
      id: uid('paie'),
      beneficiaryId: paySlipForm.beneficiaryId || '',
      employeeName: text(paySlipForm.employeeName) || `${beneficiary?.prenom || ''} ${beneficiary?.nom || ''}`.trim(),
      period: paySlipForm.period,
      notes: paySlipForm.notes,
      attachment: paySlipAttachment,
      transmittedAt: new Date().toISOString(),
      authorName: currentUser?.nom || '',
    };
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: (prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {},
        frontDesk: (prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || [],
        convocations: (prev[currentStructureId] || emptyStructureSecretariat()).convocations || [],
        workshops: (prev[currentStructureId] || emptyStructureSecretariat()).workshops || [],
        contracts: (prev[currentStructureId] || emptyStructureSecretariat()).contracts || [],
        payslips: [entry, ...((prev[currentStructureId] || emptyStructureSecretariat()).payslips || [])],
      },
    }));
    setPaySlipForm({ beneficiaryId: '', employeeName: '', period: '', notes: '' });
    setPaySlipAttachment(null);
    registerAudit('PAIE', `Fiche de paie transmise : ${entry.employeeName} (${entry.period})`, { payslipId: entry.id, beneficiaryId: entry.beneficiaryId });
    showMessage('Fiche de paie transmise via l’application.');
  };

  const removeSecretariatItem = (section, itemId) => {
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: (prev[currentStructureId] || emptyStructureSecretariat()).beneficiaryAdmin || {},
        frontDesk: section === 'frontDesk' ? ((prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || []).filter((item) => item.id !== itemId) : ((prev[currentStructureId] || emptyStructureSecretariat()).frontDesk || []),
        convocations: section === 'convocations' ? ((prev[currentStructureId] || emptyStructureSecretariat()).convocations || []).filter((item) => item.id !== itemId) : ((prev[currentStructureId] || emptyStructureSecretariat()).convocations || []),
        workshops: section === 'workshops' ? ((prev[currentStructureId] || emptyStructureSecretariat()).workshops || []).filter((item) => item.id !== itemId) : ((prev[currentStructureId] || emptyStructureSecretariat()).workshops || []),
        contracts: section === 'contracts' ? ((prev[currentStructureId] || emptyStructureSecretariat()).contracts || []).filter((item) => item.id !== itemId) : ((prev[currentStructureId] || emptyStructureSecretariat()).contracts || []),
        payslips: section === 'payslips' ? ((prev[currentStructureId] || emptyStructureSecretariat()).payslips || []).filter((item) => item.id !== itemId) : ((prev[currentStructureId] || emptyStructureSecretariat()).payslips || []),
      },
    }));
    showMessage('Élément secrétariat supprimé.');
  };

  const exportComplianceBundle = () => {
    const selectedId = text(complianceBeneficiaryId);
    if (!selectedId) {
      showMessage('Sélectionnez un bénéficiaire à exporter.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === selectedId);
    const archived = currentArchives.find((entry) => String(entry.beneficiary?.id) === selectedId);
    const target = beneficiary || archived?.beneficiary;
    if (!target) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const bundle = {
      exportedAt: new Date().toISOString(),
      structure: { id: currentStructure?.id, nom: currentStructure?.nom, email: currentStructure?.email },
      beneficiary: target,
      adminRecord: currentAdminRecords[selectedId] || archived?.adminRecord || null,
      syntheses: currentSyntheses[selectedId] || archived?.syntheses || [],
      agenda: currentBeneficiaryAgenda.filter((entry) => String(entry.beneficiaryId) === selectedId),
      convocations: currentConvocations.filter((entry) => String(entry.beneficiaryId) === selectedId),
      contracts: currentContracts.filter((entry) => String(entry.beneficiaryId) === selectedId),
      payslips: currentPayslips.filter((entry) => String(entry.beneficiaryId) === selectedId),
      auditTrail: currentAuditLogs.filter((entry) => matchesSearch(JSON.stringify(entry.meta || {}), selectedId) || matchesSearch(entry.details, `${target.prenom || ''} ${target.nom || ''}`.trim())),
    };
    downloadFile(`dossier-${(target.prenom || '')}-${(target.nom || '')}.json`.replace(/\s+/g, '-').toLowerCase(), JSON.stringify(bundle, null, 2), 'application/json;charset=utf-8;');
    registerAudit('EXPORT_DONNEES', `Export du dossier ${target.prenom || ''} ${target.nom || ''}`.trim(), { beneficiaryId: selectedId });
    showMessage('Export du dossier bénéficiaire lancé.');
  };

  const archiveBeneficiary = () => {
    const selectedId = text(complianceBeneficiaryId);
    if (!selectedId) {
      showMessage('Sélectionnez un bénéficiaire à archiver.');
      return;
    }
    const beneficiary = beneficiaires.find((item) => String(item.id) === selectedId);
    if (!beneficiary) {
      showMessage('Bénéficiaire introuvable.');
      return;
    }
    const archiveSnapshot = {
      id: uid('archive'),
      archivedAt: new Date().toISOString(),
      archivedBy: currentUser?.nom || '',
      beneficiary,
      adminRecord: currentAdminRecords[selectedId] || null,
      syntheses: currentSyntheses[selectedId] || [],
      agenda: currentBeneficiaryAgenda.filter((entry) => String(entry.beneficiaryId) === selectedId),
      convocations: currentConvocations.filter((entry) => String(entry.beneficiaryId) === selectedId),
      contracts: currentContracts.filter((entry) => String(entry.beneficiaryId) === selectedId),
      payslips: currentPayslips.filter((entry) => String(entry.beneficiaryId) === selectedId),
    };
    setAuditState((prev) => {
      const current = prev[currentStructureId] || emptyStructureAudit();
      return {
        ...prev,
        [currentStructureId]: {
          ...current,
          logs: [
            {
              id: uid('audit'),
              createdAt: new Date().toISOString(),
              action: 'ARCHIVAGE',
              details: `Archivage du bénéficiaire ${(beneficiary.prenom || '')} ${(beneficiary.nom || '')}`.trim(),
              meta: { beneficiaryId: selectedId },
              userId: currentUser?.id || 'system',
              userName: currentUser?.nom || 'Système',
              userRole: currentUser?.role || 'Système',
            },
            ...(current.logs || []),
          ],
          archives: [archiveSnapshot, ...(current.archives || [])],
        },
      };
    });
    setBeneficiairesByStructure((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).filter((item) => String(item.id) !== selectedId),
    }));
    setSecretariatState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureSecretariat()),
        beneficiaryAdmin: Object.fromEntries(Object.entries((prev[currentStructureId]?.beneficiaryAdmin || {})).filter(([key]) => String(key) !== selectedId)),
        frontDesk: prev[currentStructureId]?.frontDesk || [],
        convocations: (prev[currentStructureId]?.convocations || []).filter((item) => String(item.beneficiaryId) !== selectedId),
        workshops: prev[currentStructureId]?.workshops || [],
        contracts: prev[currentStructureId]?.contracts || [],
        payslips: prev[currentStructureId]?.payslips || [],
      },
    }));
    setAgendaState((prev) => ({
      ...prev,
      beneficiary: {
        ...prev.beneficiary,
        [currentStructureId]: (prev.beneficiary[currentStructureId] || []).filter((item) => String(item.beneficiaryId) !== selectedId),
      },
    }));
    setComplianceBeneficiaryId('');
    showMessage('Bénéficiaire archivé.');
  };


  const fillEmployeeName = (employeeId, fallbackName = '') => {
    const employee = currentEmployees.find((item) => item.id === employeeId);
    return employee?.fullName || fallbackName;
  };

  const addRhEmployee = (event) => {
    event.preventDefault();
    if (!text(rhEmployeeForm.fullName)) {
      showMessage('Le nom du salarié est obligatoire.');
      return;
    }
    const entry = {
      id: uid('emp'),
      ...rhEmployeeForm,
      fullName: titleCase(rhEmployeeForm.fullName),
      email: text(rhEmployeeForm.email).toLowerCase(),
      linkedBeneficiaryId: text(rhEmployeeForm.beneficiaryId) || null,
      createdAt: new Date().toISOString(),
    };
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        ...emptyStructureRh(),
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: [entry, ...((prev[currentStructureId]?.employees) || [])],
        contracts: (prev[currentStructureId]?.contracts) || [],
        absences: (prev[currentStructureId]?.absences) || [],
        medicalVisits: (prev[currentStructureId]?.medicalVisits) || [],
        incidents: (prev[currentStructureId]?.incidents) || [],
        timeEntries: (prev[currentStructureId]?.timeEntries) || [],
      },
    }));
    setRhEmployeeForm(INITIAL_RH_EMPLOYEE_FORM);
    registerAudit('RH_SALARIE', `Salarié ajouté : ${entry.fullName}`, { employeeId: entry.id });
    showMessage('Salarié ajouté.');
  };

  const addRhContract = (event) => {
    event.preventDefault();
    const employeeName = fillEmployeeName(rhContractForm.employeeId, rhContractForm.employeeName);
    if (!text(employeeName) || !text(rhContractForm.startDate)) {
      showMessage('Le salarié et la date de début sont obligatoires.');
      return;
    }
    const entry = {
      id: uid('rhc'),
      ...rhContractForm,
      employeeName,
      createdAt: new Date().toISOString(),
    };
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: (prev[currentStructureId]?.employees) || [],
        contracts: [entry, ...((prev[currentStructureId]?.contracts) || [])],
        absences: (prev[currentStructureId]?.absences) || [],
        medicalVisits: (prev[currentStructureId]?.medicalVisits) || [],
        incidents: (prev[currentStructureId]?.incidents) || [],
        timeEntries: (prev[currentStructureId]?.timeEntries) || [],
      },
    }));
    setRhContractForm(INITIAL_RH_CONTRACT_FORM);
    registerAudit('RH_CONTRAT', `Contrat RH enregistré : ${employeeName}`, { contractId: entry.id, employeeId: entry.employeeId });
    showMessage('Contrat RH enregistré.');
  };

  const addRhAbsence = (event) => {
    event.preventDefault();
    const employeeName = fillEmployeeName(absenceForm.employeeId, absenceForm.employeeName);
    if (!text(employeeName) || !text(absenceForm.dateDebut) || !text(absenceForm.dateFin)) {
      showMessage('Le salarié, la date de début et la date de fin sont obligatoires.');
      return;
    }
    if (new Date(absenceForm.dateFin) < new Date(absenceForm.dateDebut)) {
      showMessage('La date de fin doit être après la date de début.');
      return;
    }
    const entry = { id: uid('abs'), ...absenceForm, employeeName, createdAt: new Date().toISOString() };
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: (prev[currentStructureId]?.employees) || [],
        contracts: (prev[currentStructureId]?.contracts) || [],
        absences: [entry, ...((prev[currentStructureId]?.absences) || [])],
        medicalVisits: (prev[currentStructureId]?.medicalVisits) || [],
        incidents: (prev[currentStructureId]?.incidents) || [],
        timeEntries: (prev[currentStructureId]?.timeEntries) || [],
      },
    }));
    setAbsenceForm(INITIAL_ABSENCE_FORM);
    registerAudit('RH_ABSENCE', `Absence enregistrée : ${employeeName} du ${absenceForm.dateDebut} au ${absenceForm.dateFin}`, { absenceId: entry.id, employeeId: entry.employeeId });
    showMessage('Période d\'absence enregistrée.');
  };

  const addRhMedicalVisit = (event) => {
    event.preventDefault();
    const employeeName = fillEmployeeName(medicalForm.employeeId, medicalForm.employeeName);
    if (!text(employeeName) || !text(medicalForm.visitDate)) {
      showMessage('Le salarié et la date de visite sont obligatoires.');
      return;
    }
    const entry = { id: uid('med'), ...medicalForm, employeeName, createdAt: new Date().toISOString() };
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: (prev[currentStructureId]?.employees) || [],
        contracts: (prev[currentStructureId]?.contracts) || [],
        absences: (prev[currentStructureId]?.absences) || [],
        medicalVisits: [entry, ...((prev[currentStructureId]?.medicalVisits) || [])],
        incidents: (prev[currentStructureId]?.incidents) || [],
        timeEntries: (prev[currentStructureId]?.timeEntries) || [],
      },
    }));
    setMedicalForm(INITIAL_MEDICAL_FORM);
    registerAudit('RH_VISITE', `Visite médicale enregistrée : ${employeeName}`, { visitId: entry.id, employeeId: entry.employeeId });
    showMessage('Visite médicale enregistrée.');
  };

  const addRhIncident = (event) => {
    event.preventDefault();
    const employeeName = fillEmployeeName(incidentForm.employeeId, incidentForm.employeeName);
    if (!text(employeeName) || !text(incidentForm.date) || !text(incidentForm.description)) {
      showMessage('Le salarié, la date et la description sont obligatoires.');
      return;
    }
    const entry = { id: uid('inc'), ...incidentForm, employeeName, createdAt: new Date().toISOString() };
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: (prev[currentStructureId]?.employees) || [],
        contracts: (prev[currentStructureId]?.contracts) || [],
        absences: (prev[currentStructureId]?.absences) || [],
        medicalVisits: (prev[currentStructureId]?.medicalVisits) || [],
        incidents: [entry, ...((prev[currentStructureId]?.incidents) || [])],
        timeEntries: (prev[currentStructureId]?.timeEntries) || [],
      },
    }));
    setIncidentForm(INITIAL_INCIDENT_FORM);
    registerAudit('RH_INCIDENT', `Incident RH enregistré : ${employeeName}`, { incidentId: entry.id, employeeId: entry.employeeId });
    showMessage('Incident RH enregistré.');
  };

  const addRhTimeEntry = (event) => {
    event.preventDefault();
    const employeeName = fillEmployeeName(timeEntryForm.employeeId, timeEntryForm.employeeName);
    if (!text(employeeName) || !text(timeEntryForm.date)) {
      showMessage('Le salarié et la date sont obligatoires.');
      return;
    }
    const entry = { id: uid('time'), ...timeEntryForm, employeeName, createdAt: new Date().toISOString() };
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: (prev[currentStructureId]?.employees) || [],
        contracts: (prev[currentStructureId]?.contracts) || [],
        absences: (prev[currentStructureId]?.absences) || [],
        medicalVisits: (prev[currentStructureId]?.medicalVisits) || [],
        incidents: (prev[currentStructureId]?.incidents) || [],
        timeEntries: [entry, ...((prev[currentStructureId]?.timeEntries) || [])],
      },
    }));
    setTimeEntryForm(INITIAL_TIME_ENTRY_FORM);
    registerAudit('RH_POINTAGE', `Pointage enregistré : ${employeeName}`, { timeEntryId: entry.id, employeeId: entry.employeeId });
    showMessage('Pointage enregistré.');
  };

  const removeRhItem = (collection, id) => {
    setRhState((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || emptyStructureRh()),
        employees: collection === 'employees' ? ((prev[currentStructureId]?.employees || []).filter((item) => item.id !== id)) : ((prev[currentStructureId]?.employees) || []),
        contracts: collection === 'contracts' ? ((prev[currentStructureId]?.contracts || []).filter((item) => item.id !== id)) : ((prev[currentStructureId]?.contracts) || []),
        absences: collection === 'absences' ? ((prev[currentStructureId]?.absences || []).filter((item) => item.id !== id)) : ((prev[currentStructureId]?.absences) || []),
        medicalVisits: collection === 'medicalVisits' ? ((prev[currentStructureId]?.medicalVisits || []).filter((item) => item.id !== id)) : ((prev[currentStructureId]?.medicalVisits) || []),
        incidents: collection === 'incidents' ? ((prev[currentStructureId]?.incidents || []).filter((item) => item.id !== id)) : ((prev[currentStructureId]?.incidents) || []),
        timeEntries: collection === 'timeEntries' ? ((prev[currentStructureId]?.timeEntries || []).filter((item) => item.id !== id)) : ((prev[currentStructureId]?.timeEntries) || []),
      },
    }));
    registerAudit('RH_SUPPRESSION', `Suppression RH dans ${collection}`, { collection, id });
    showMessage('Élément RH supprimé.');
  };

  const addActivity = (event) => {
    event.preventDefault();
    if (!text(activityForm.title)) {
      showMessage('Le titre de l\'activité est obligatoire.');
      return;
    }
    if (!text(activityForm.startDate)) {
      showMessage('La date de début est obligatoire.');
      return;
    }
    const activity = {
      id: uid('act'),
      ...activityForm,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    setActivities((prev) => ({
      ...prev,
      [currentStructureId]: [activity, ...((prev[currentStructureId]) || [])],
    }));
    setActivityForm(INITIAL_ACTIVITY_FORM);
    registerAudit('ACTIVITY_CREATED', `Activité créée : ${activityForm.title}`, { activityId: activity.id });
    showMessage('Activité enregistrée.');
  };

  const updateActivity = (activityId, updatedData) => {
    setActivities((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).map((act) =>
        act.id === activityId ? { ...act, ...updatedData } : act
      ),
    }));
    registerAudit('ACTIVITY_UPDATED', `Activité mise à jour`, { activityId });
    showMessage('Activité mise à jour.');
  };

  const removeActivity = (activityId) => {
    setActivities((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).filter((act) => act.id !== activityId),
    }));
    registerAudit('ACTIVITY_DELETED', `Activité supprimée`, { activityId });
    showMessage('Activité supprimée.');
  };

  const addActivityComment = (activityId, comment) => {
    setActivities((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).map((act) =>
        act.id === activityId
          ? {
              ...act,
              comments: [
                { id: uid('com'), text: comment, author: currentUser?.nom || 'Utilisateur', createdAt: new Date().toISOString() },
                ...(act.comments || []),
              ],
            }
          : act
      ),
    }));
    registerAudit('ACTIVITY_COMMENT', `Commentaire ajouté`, { activityId });
  };

  const assignBeneficiaryToActivity = (activityId, beneficiaryId) => {
    setActivities((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).map((act) =>
        act.id === activityId
          ? {
              ...act,
              assignedBeneficiaries: Array.from(new Set([...(act.assignedBeneficiaries || []), beneficiaryId])),
            }
          : act
      ),
    }));
    registerAudit('ACTIVITY_ASSIGNED', `Bénéficiaire assigné à l\'activité`, { activityId, beneficiaryId });
    showMessage('Bénéficiaire assigné à l\'activité.');
  };

  const removeBeneficiaryFromActivity = (activityId, beneficiaryId) => {
    setActivities((prev) => ({
      ...prev,
      [currentStructureId]: (prev[currentStructureId] || []).map((act) =>
        act.id === activityId
          ? {
              ...act,
              assignedBeneficiaries: (act.assignedBeneficiaries || []).filter((id) => id !== beneficiaryId),
            }
          : act
      ),
    }));
    registerAudit('ACTIVITY_UNASSIGNED', `Bénéficiaire retiré de l\'activité`, { activityId, beneficiaryId });
    showMessage('Bénéficiaire retiré de l\'activité.');
  };

  const exportRhCsv = (kind) => {
    if (kind === 'employees') {
      exportRowsToCsv(`rh-salaries-${currentStructureId}.csv`, [
        { key: 'fullName', label: 'Nom' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'poste', label: 'Poste' },
        { key: 'service', label: 'Service' },
        { key: 'statut', label: 'Statut' },
      ], currentEmployees);
    }
    if (kind === 'contracts') {
      exportRowsToCsv(`rh-contrats-${currentStructureId}.csv`, [
        { key: 'employeeName', label: 'Salarié' },
        { key: 'contractType', label: 'Type' },
        { key: 'startDate', label: 'Début' },
        { key: 'endDate', label: 'Fin' },
        { key: 'renewalDate', label: 'Renouvellement' },
        { key: 'weeklyHours', label: 'Durée hebdo' },
        { key: 'status', label: 'Statut' },
      ], currentRhContracts);
    }
    if (kind === 'absences') {
      exportRowsToCsv(`rh-absences-${currentStructureId}.csv`, [
        { key: 'employeeName', label: 'Salarié' },
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'reason', label: 'Motif' },
        { key: 'justified', label: 'Justifié' },
        { key: 'comments', label: 'Commentaire' },
      ], currentAbsences.map((item) => ({ ...item, justified: item.justified ? 'Oui' : 'Non' })));
    }
    registerAudit('RH_EXPORT', `Export RH ${kind}`, { kind });
    showMessage('Export RH lancé.');
  };

  const handleEmailSettingsChange = (field, value) => {
    setWorkspace((prev) => ({
      ...prev,
      [currentStructureId]: {
        ...(prev[currentStructureId] || { messages: [], meetings: [] }),
        emailSettings: {
          ...(prev[currentStructureId]?.emailSettings || INITIAL_EMAIL_SETTINGS),
          [field]: value,
        },
      },
    }));
  };

  const handleSendTestEmail = async () => {
    if (!text(emailTest)) {
      showMessage('Saisissez un email de test.');
      return;
    }
    try {
      const response = await fetch(`${text(emailSettings.serviceUrl) || INITIAL_EMAIL_SETTINGS.serviceUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: emailSettings,
          message: {
            to: emailTest,
            subject: 'Test PCGI 87',
            text: `Bonjour,\n\nCeci est un test d'envoi depuis ${currentStructure?.nom || 'PCGI 87'}.`,
          },
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Envoi impossible.');
      showMessage('Email de test envoyé.');
    } catch (error) {
      showMessage(error.message || 'Échec de l’envoi du test email.');
    }
  };

  const copyFirstAccess = async () => {
    if (!firstAccessInfo) return;
    const content = `Structure : ${firstAccessInfo.structure}\nIdentifiant : ${firstAccessInfo.email}\nMot de passe temporaire : ${firstAccessInfo.motDePasse}`;
    try {
      await navigator.clipboard.writeText(content);
      showMessage('Accès copiés.');
    } catch {
      showMessage(content);
    }
  };

  if (!currentUser) {
    return (
      <div className="app-shell login-background">
        <div className="login-simple-wrap">
          <div className="card login-simple-card">
            <div className="brand-zone">
              <h1>PCGI 87</h1>
              <p>Plateforme de coordination globale de l'insertion</p>
            </div>

            {notice ? <div className="notice">{notice}</div> : null}

            <form onSubmit={handleProfessionalLogin} className="form-grid">
              <label className="field">
                <span><Building2 size={16} /> Structure</span>
                <select value={loginForm.structureId} onChange={(e) => setLoginForm((prev) => ({ ...prev, structureId: e.target.value }))}>
                  {Object.values(structures).map((structure) => (
                    <option key={structure.id} value={structure.id}>{structure.nom}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span><Mail size={16} /> Identifiant</span>
                <input type="email" value={loginForm.email} onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="cindybinchi@gmail.com" required />
              </label>

              <label className="field">
                <span><KeyRound size={16} /> Mot de passe</span>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input type={showPassword ? "text" : "password"} value={loginForm.motDePasse} onChange={(e) => setLoginForm((prev) => ({ ...prev, motDePasse: e.target.value }))} placeholder="Votre mot de passe" required style={{flex: 1}} />
                  <button type="button" className="btn btn-light" onClick={() => setShowPassword(!showPassword)} style={{padding: '8px 12px', minWidth: 'auto'}}>
                    {showPassword ? "Masquer" : "Voir"}
                  </button>
                </div>
              </label>

              <label className="checkbox-row">
                <input type="checkbox" checked={loginForm.rememberMe} onChange={(e) => setLoginForm((prev) => ({ ...prev, rememberMe: e.target.checked }))} />
                <span>Se souvenir de moi sur ce poste</span>
              </label>

              <div className="row gap-12">
                <button type="submit" className="btn btn-primary"><Shield size={16} /> Se connecter</button>
                <button type="button" className="btn btn-secondary" onClick={() => setForgotOpen((prev) => !prev)}><RefreshCw size={16} /> Mot de passe oublié</button>
              </div>
            </form>

            {forgotOpen ? (
              <form onSubmit={handleForgotPassword} className="forgot-box form-grid">
                <label className="field">
                  <span><Building2 size={16} /> Structure</span>
                  <select value={forgotForm.structureId} onChange={(e) => setForgotForm((prev) => ({ ...prev, structureId: e.target.value }))}>
                    {Object.values(structures).map((structure) => (
                      <option key={structure.id} value={structure.id}>{structure.nom}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span><Mail size={16} /> Email</span>
                  <input type="email" value={forgotForm.email} onChange={(e) => setForgotForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email du compte" required />
                </label>
                <button type="submit" className="btn btn-light"><Send size={16} /> Générer un mot de passe temporaire</button>
              </form>
            ) : null}

            {forgotResult ? (
              <div className="first-access-box">
                <strong>Informations de réinitialisation</strong>
                <p>Structure : {forgotResult.structure}</p>
                <p>Identifiant : {forgotResult.email}</p>
                <p>Mot de passe temporaire : {forgotResult.motDePasse}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (mustChangePassword) {
    return (
      <div className="app-shell login-background">
        <div className="login-simple-wrap">
          <div className="card login-simple-card">
            <div className="brand-zone">
              <h1>Premier accès</h1>
              <p>Vous devez définir un nouveau mot de passe pour continuer.</p>
            </div>
            {notice ? <div className="notice">{notice}</div> : null}
            <form onSubmit={handleChangePassword} className="form-grid">
              <label className="field">
                <span><KeyRound size={16} /> Nouveau mot de passe</span>
                <input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))} required />
              </label>
              <label className="field">
                <span><KeyRound size={16} /> Confirmation</span>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} required />
              </label>
              <button type="submit" className="btn btn-primary"><Save size={16} /> Enregistrer le mot de passe</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
            <div>
              <h2 style={{ margin: 0 }}>PCGI 87</h2>
              <p style={{ margin: 0 }}>{currentStructure?.nom}</p>
            </div>
          </div>
          <nav className="nav-list">
            {canAccessTab('dashboard') ? <button className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('dashboard')}><LayoutDashboard size={16} /> Tableau de bord</button> : null}
            {canAccessTab('pilotage') ? <button className={activeTab === 'pilotage' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('pilotage')}><Shield size={16} /> Pilotage & conformité</button> : null}
            {canAccessTab('beneficiaires') ? <button className={activeTab === 'beneficiaires' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('beneficiaires')}><NotebookText size={16} /> Bénéficiaires</button> : null}
            {canAccessTab('suivis') ? <button className={activeTab === 'suivis' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('suivis')}><FileText size={16} /> Suivis</button> : null}
            {canAccessTab('annuaire') ? <button className={activeTab === 'annuaire' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('annuaire')}><Building2 size={16} /> Annuaire</button> : null}
            {canAccessTab('messagerie') ? <button className={activeTab === 'messagerie' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('messagerie')}><span className="nav-label"><MessageSquare size={16} /> Messagerie</span>{totalUnreadMessages ? <span className="nav-badge">{totalUnreadMessages}</span> : null}</button> : null}
            {canAccessTab('agendas') ? <button className={activeTab === 'agendas' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('agendas')}><span className="nav-label"><CalendarDays size={16} /> Agendas</span>{agendaReminderCount ? <span className="nav-badge warn">{agendaReminderCount}</span> : null}</button> : null}
            {canAccessTab('activites') ? <button className={activeTab === 'activites' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('activites')}><NotebookText size={16} /> Activités</button> : null}
            {canAccessTab('secretariat') ? <button className={activeTab === 'secretariat' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('secretariat')}><NotebookText size={16} /> Secrétariat</button> : null}
            {canAccessTab('rh') ? <button className={activeTab === 'rh' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('rh')}><NotebookText size={16} /> RH</button> : null}
            {canAccessTab('utilisateurs') ? <button className={activeTab === 'utilisateurs' ? 'nav-item active' : 'nav-item'} onClick={() => openMainTab('utilisateurs')}><Users size={16} /> Utilisateurs</button> : null}
            {canAccessTab('structure') ? <button className={activeTab === 'structure' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('structure')}><Mail size={16} /> Ma structure</button> : null}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="identity-card">
            <strong>{currentUser.nom}</strong>
            <span>{currentUser.role}</span>
            <small>{currentUser.email}</small>
          </div>
          <button className="btn btn-secondary full" onClick={handleLogout}><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      <main className="content">
        {notice ? <div className="notice">{notice}</div> : null}
        {currentUser ? (
          <div className="utility-bar">
            <div className="sync-chip"><span className="live-dot" /> Rafraîchissement auto toutes les 5 s · Dernière synchro {new Date(lastSyncAt).toLocaleTimeString('fr-FR')} · Accès {currentUser.role}</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn btn-light" type="button" onClick={() => syncLiveData(true)}><RefreshCw size={16} /> Synchroniser</button>
              <button className="btn btn-secondary" type="button" onClick={handleLogout}><LogOut size={16} /> Se déconnecter</button>
            </div>
          </div>
        ) : null}


        {activeTab === 'pilotage' ? (
          <section className="stack">
            <div className="page-head">
              <div>
                <h1>Pilotage & conformité</h1>
                <p>Vue coordination, qualité des dossiers et conformité pour {currentStructure?.nom}.</p>
              </div>
            </div>
            <div className="subtabs-wrap">
              <button className={pilotageTab === 'overview' ? 'subtab active' : 'subtab'} onClick={() => setPilotageTab('overview')}>Pilotage</button>
              <button className={pilotageTab === 'compliance' ? 'subtab active' : 'subtab'} onClick={() => setPilotageTab('compliance')}>Conformité</button>
            </div>

            {pilotageTab === 'overview' ? (
              <>
                <div className="stats-grid">
                  <div className="card stat-card"><span>Bénéficiaires actifs</span><strong>{beneficiaires.length}</strong><small>{currentArchives.length} archivés</small></div>
                  <div className="card stat-card"><span>Dossiers incomplets</span><strong>{incompleteAdminCount}</strong><small>administratif</small></div>
                  <div className="card stat-card"><span>Synthèses à actualiser</span><strong>{synthesesToUpdate.length}</strong><small>plus de 30 jours</small></div>
                  <div className="card stat-card"><span>Convocations à venir</span><strong>{upcomingConvocations.length}</strong><small>14 prochains jours</small></div>
                  <div className="card stat-card"><span>Contrats à échéance</span><strong>{contractsExpiringSoon.length}</strong><small>30 prochains jours</small></div>
                  <div className="card stat-card"><span>Indice conformité</span><strong>{complianceScore}%</strong><small>pilotage interne</small></div>
                </div>
                <div className="two-columns tracking-layout">
                  <div className="card">
                    <div className="section-inline"><h3>Points de vigilance</h3><span className="badge warn-badge">{complianceAlerts.length}</span></div>
                    <div className="list">
                      {complianceAlerts.length ? complianceAlerts.map((item) => (
                        <div key={item.id} className="list-row">
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.detail}</p>
                          </div>
                          <span className="badge warn-badge">Action</span>
                        </div>
                      )) : <p className="muted">Aucun point de vigilance majeur détecté.</p>}
                    </div>
                  </div>
                  <div className="card">
                    <div className="section-inline"><h3>Décisions rapides</h3><span className="badge">Coordination</span></div>
                    <div className="list compact-list">
                      {contractsExpiringSoon.slice(0, 6).map((contract) => (
                        <div key={contract.id} className="list-row">
                          <div>
                            <strong>{contract.employeeName}</strong>
                            <p>{contract.contractType} · fin le {contract.endDate || 'non renseignée'}</p>
                          </div>
                          <span className="badge danger-badge">Échéance</span>
                        </div>
                      ))}
                      {!contractsExpiringSoon.length ? <p className="muted">Aucun contrat en fin prochaine.</p> : null}
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="section-inline"><h3>Archivage & suivi de structure</h3><span className="badge">Traçabilité</span></div>
                  <div className="mini-grid">
                    <div className="mini-kpi"><strong>{currentArchives.length}</strong><span>Bénéficiaires archivés</span></div>
                    <div className="mini-kpi"><strong>{currentAuditLogs.length}</strong><span>Événements tracés</span></div>
                    <div className="mini-kpi"><strong>{currentContracts.length}</strong><span>Contrats enregistrés</span></div>
                    <div className="mini-kpi"><strong>{currentPayslips.length}</strong><span>Paies transmises</span></div>
                  </div>
                </div>
              </>
            ) : null}

            {pilotageTab === 'compliance' ? (
              <>
                <div className="two-columns tracking-layout">
                  <div className="card">
                    <div className="section-inline"><h3>Dossier bénéficiaire</h3><span className="badge">RGPD / export</span></div>
                    <div className="form-grid compact-form">
                      <select value={complianceBeneficiaryId} onChange={(e) => setComplianceBeneficiaryId(e.target.value)}>
                        <option value="">Choisir un bénéficiaire</option>
                        {beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}
                        {currentArchives.map((archive) => <option key={archive.id} value={archive.beneficiary.id}>{archive.beneficiary.prenom} {archive.beneficiary.nom} (archivé)</option>)}
                      </select>
                      <div className="row gap-12">
                        <button type="button" className="btn btn-light" onClick={exportComplianceBundle}><FileText size={16} /> Exporter le dossier</button>
                        <button type="button" className="btn btn-secondary" onClick={archiveBeneficiary}>Archiver</button>
                      </div>
                    </div>
                    <p className="muted mt-12">L’export produit un JSON complet. L’archivage retire le bénéficiaire de la liste active tout en conservant une trace locale.</p>
                    <div className="row gap-12 mt-16">
                      <button type="button" className="btn btn-light" onClick={exportFullBackup}><Save size={16} /> Sauvegarde complète</button>
                      <button type="button" className="btn btn-light" onClick={() => backupImportRef.current?.click()}><RefreshCw size={16} /> Restaurer une sauvegarde</button>
                      <button type="button" className="btn btn-light" onClick={exportAuditCsvFile}><Table2 size={16} /> Export audit CSV</button>
                      <input ref={backupImportRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBackup} />
                    </div>
                  </div>
                  <div className="card">
                    <div className="section-inline"><h3>Checklist conformité</h3><span className="badge">Interne</span></div>
                    <ul className="checklist">
                      <li>Limiter les données aux besoins d’accompagnement et de gestion.</li>
                      <li>Tracer les actions sensibles et conserver un historique de structure.</li>
                      <li>Archiver les dossiers clos avant suppression définitive.</li>
                      <li>Mettre à jour les synthèses et dossiers administratifs régulièrement.</li>
                      <li>Exporter le dossier complet en cas de demande interne.</li>
                    </ul>
                  </div>
                </div>
                <div className="card">
                  <div className="section-inline"><h3>Registre d’activité</h3><span className="badge">{currentAuditLogs.length}</span></div>
                  <div className="filter-bar">
                    <label className="search-inline"><Search size={15} /><input value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Rechercher dans le journal" /></label>
                    <select value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}>
                      <option value="all">Toutes les actions</option>
                      <option value="CONNEXION">Connexions</option>
                      <option value="BENEFICIAIRE_AJOUTE">Bénéficiaires</option>
                      <option value="SYNTHESE">Synthèses</option>
                      <option value="DOSSIER_ADMIN">Dossiers admin</option>
                      <option value="CONTRAT">Contrats</option>
                      <option value="PAIE">Paie</option>
                      <option value="ARCHIVAGE">Archivages</option>
                      <option value="EXPORT_DONNEES">Exports</option>
                    </select>
                  </div>
                  <div className="audit-list">
                    {filteredAuditLogs.length ? filteredAuditLogs.slice(0, 120).map((entry) => (
                      <div key={entry.id} className="audit-row">
                        <div>
                          <strong>{entry.action}</strong>
                          <p>{entry.details || 'Sans détail'}</p>
                        </div>
                        <div className="audit-meta">
                          <span>{entry.userName}</span>
                          <small>{new Date(entry.createdAt).toLocaleString('fr-FR')}</small>
                        </div>
                      </div>
                    )) : <p className="muted">Aucune trace pour ces filtres.</p>}
                  </div>
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'dashboard' ? (
          <section className="stack">
            <div className="page-head">
              <div>
                <h1>Tableau de bord</h1>
                <p>Vue dédiée à {currentStructure?.nom}</p>
              </div>
            </div>
            {startupPanelOpen && startupHighlights.length ? (
              <div className="card startup-card">
                <div className="section-inline">
                  <div>
                    <h3>À surveiller au démarrage</h3>
                    <p className="muted">Messages non lus et rappels proches pour votre structure.</p>
                  </div>
                  <button className="btn btn-light" type="button" onClick={() => setStartupPanelOpen(false)}><RefreshCw size={16} /> Masquer</button>
                </div>
                <div className="list">
                  {startupHighlights.map((item) => (
                    <div key={item.id} className="list-row">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                      <span className="badge warn-badge">Info</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="stats-grid">
              <div className="card stat-card"><span>Utilisateurs</span><strong>{stats.utilisateurs}</strong></div>
              <div className="card stat-card"><span>Bénéficiaires</span><strong>{stats.beneficiaires}</strong></div>
              <div className="card stat-card"><span>Alertes</span><strong>{stats.alertes}</strong></div>
              <div className="card stat-card"><span>Messages structure</span><strong>{stats.messages}</strong></div>
              <div className="card stat-card"><span>Événements planifiés</span><strong>{stats.agenda}</strong></div>
              <div className="card stat-card"><span>Non lus</span><strong>{totalUnreadMessages}</strong></div>
            </div>
            <div className="card">
              <div className="section-inline">
                <h3>Rappels à venir</h3>
                {agendaReminderCount ? <span className="badge warn-badge">{agendaReminderCount}</span> : null}
              </div>
              <div className="list">
                {reminderItems.length ? reminderItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.title || item.beneficiaryName || 'Événement'}</strong>
                      <p>{item.scope} · {new Date(item.startAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <span className={item.reminderType === 'En retard' ? 'badge danger-badge' : 'badge warn-badge'}>{item.reminderType}</span>
                  </div>
                )) : <p className="muted">Aucun rappel dans les 3 prochains jours.</p>}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'beneficiaires' ? (
          <section className="stack">
            <div className="page-head"><h1>Bénéficiaires</h1></div>
            {(currentUser?.role === 'Coordinateur' || currentUser?.role === 'Secrétaire' || currentUser?.role === 'RH') ? (
              <div className="two-columns">
                <div className="card">
                  <div className="section-inline">
                    <h3>Ajouter un bénéficiaire</h3>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowImportModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      📥 Importer Excel/CSV
                    </button>
                  </div>
                  <form onSubmit={handleAddBeneficiary} className="form-grid">
                    <input value={beneficiaryForm.nom} onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, nom: e.target.value }))} placeholder="Nom" />
                    <input value={beneficiaryForm.prenom} onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, prenom: e.target.value }))} placeholder="Prénom" />
                    <input value={beneficiaryForm.email} onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                    <input value={beneficiaryForm.telephone} onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, telephone: e.target.value }))} placeholder="Téléphone" />
                    <select value={beneficiaryForm.statut} onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, statut: e.target.value }))}>
                      <option>En cours</option>
                      <option>Urgence</option>
                      <option>Sortie</option>
                    </select>
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Ajouter</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Liste</h3>
                  <div className="list">
                    {beneficiaires.length ? beneficiaires.map((item) => (
                      <div key={item.id} className="list-row">
                        <div>
                          <strong>{item.prenom} {item.nom}</strong>
                          <p>{item.email || 'Sans email'} · {item.telephone || 'Sans téléphone'}</p>
                        </div>
                        <span className="badge">{item.statut}</span>
                      </div>
                    )) : <p className="muted">Aucun bénéficiaire pour le moment.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="two-columns">
                <div className="card">
                  <h3>Bénéficiaires disponibles</h3>
                  <p className="muted" style={{ marginBottom: 12 }}>
                    Choisissez un bénéficiaire non assigné pour l'ajouter à votre portefeuille de suivi.
                  </p>
                  <div className="list">
                    {unassignedBeneficiaires.length ? unassignedBeneficiaires.map((item) => (
                      <div key={item.id} className="list-row">
                        <div>
                          <strong>{item.prenom} {item.nom}</strong>
                          <p>{item.email || 'Sans email'} · {item.telephone || 'Sans téléphone'}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                          onClick={() => handleSelfAssignBeneficiary(item.id)}
                        >
                          <Plus size={14} /> Choisir
                        </button>
                      </div>
                    )) : <p className="muted">Aucun bénéficiaire disponible pour le moment.</p>}
                  </div>
                </div>
                <div className="card">
                  <h3>Mon portefeuille</h3>
                  <div className="list">
                    {beneficiaires.filter((b) => {
                      const a = beneficiaryAssignments[b.id];
                      if (!a) return false;
                      return (a.cipIds || []).includes(currentUser?.id) || (a.encadrantIds || []).includes(currentUser?.id);
                    }).length ? beneficiaires.filter((b) => {
                      const a = beneficiaryAssignments[b.id];
                      if (!a) return false;
                      return (a.cipIds || []).includes(currentUser?.id) || (a.encadrantIds || []).includes(currentUser?.id);
                    }).map((item) => (
                      <div key={item.id} className="list-row">
                        <div>
                          <strong>{item.prenom} {item.nom}</strong>
                          <p>{item.email || 'Sans email'} · {item.telephone || 'Sans téléphone'}</p>
                        </div>
                        <span className="badge">{item.statut}</span>
                      </div>
                    )) : <p className="muted">Vous n'avez pas encore choisi de bénéficiaire.</p>}
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'suivis' ? (
          <section className="stack">
            <div className="page-head"><h1>Suivis</h1><p>Synthèses de suivi, tableau de suivi et comptes rendus de réunion.</p></div>
            <div className="subtabs-wrap">
              {hasPermission('ecrire_syntheses') ? <button className={trackingTab === 'synthese' ? 'subtab active' : 'subtab'} onClick={() => setTrackingTab('synthese')}>Synthèses</button> : null}
              <button className={trackingTab === 'tableau' ? 'subtab active' : 'subtab'} onClick={() => setTrackingTab('tableau')}>Tableau de suivi</button>
              <button className={trackingTab === 'reunions' ? 'subtab active' : 'subtab'} onClick={() => setTrackingTab('reunions')}>Comptes rendus</button>
              <button className={trackingTab === 'evaluations' ? 'subtab active' : 'subtab'} onClick={() => setTrackingTab('evaluations')}>Évaluations</button>
            </div>

            {trackingTab === 'synthese' && hasPermission('ecrire_syntheses') ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <div className="section-inline"><div className="section-title-stack"><h3>Rédiger une synthèse de suivi</h3><span className="badge">Saisie guidée</span></div><div style={{display: 'flex', gap: '8px'}}><button className="btn btn-light" type="button" onClick={handleExportSynthesesPdf}><FileText size={16} /> Export PDF synthèses</button><button className="btn btn-light" type="button" onClick={exportBeneficiariesExcel}><Table2 size={16} /> Export Excel</button></div></div>
                  <div className="subtabs-wrap compact">
                    <span className="subtab active static">Identité & entrée</span>
                    <span className="subtab static">Projet & outils</span>
                    <span className="subtab static">Actions & sorties</span>
                  </div>
                  <form onSubmit={handleAddSynthesis} className="form-grid compact-form grouped-form">
                    <div className="group-card">
                      <h4>Identité & situation</h4>
                      <select value={synthesisForm.beneficiaryId} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}>
                        <option value="">Bénéficiaire</option>
                        {beneficiaires.map((item) => (
                          <option key={item.id} value={item.id}>{item.nom} {item.prenom}</option>
                        ))}
                      </select>
                      <input value={synthesisForm.sexe} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, sexe: e.target.value }))} placeholder="Sexe" />
                      <input value={synthesisForm.prescripteur} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, prescripteur: e.target.value }))} placeholder="Prescripteur" />
                      <input value={synthesisForm.age} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, age: e.target.value }))} placeholder="Age" />
                      <input value={synthesisForm.reconnaissance} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, reconnaissance: e.target.value }))} placeholder="RQTH (Reconnaissance de Qualité de Travailleur Handicapé)" />
                      <input value={synthesisForm.situation} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, situation: e.target.value }))} placeholder="Situation" />
                      <input value={synthesisForm.enfants} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, enfants: e.target.value }))} placeholder="Enfants" />
                      <input value={synthesisForm.ressources} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, ressources: e.target.value }))} placeholder="Ressources" />
                      <input value={synthesisForm.mobilite} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, mobilite: e.target.value }))} placeholder="Mobilité" />
                      <input value={synthesisForm.qualification} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, qualification: e.target.value }))} placeholder="Qualification" />
                      <input type="date" value={synthesisForm.dateEntree} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, dateEntree: e.target.value }))} />
                    </div>

                    <div className="group-card">
                      <h4>Projet & outils</h4>
                      <textarea value={synthesisForm.outilsMobilises} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, outilsMobilises: e.target.value }))} placeholder="Outils mobilisés" rows="2" />
                      <textarea value={synthesisForm.projetProfessionnel} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, projetProfessionnel: e.target.value }))} placeholder="Projet professionnel" rows="2" />
                      <textarea value={synthesisForm.infoCollectiveInterne} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, infoCollectiveInterne: e.target.value }))} placeholder="Info collective interne" rows="2" />
                      <textarea value={synthesisForm.infoCollectiveExterne} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, infoCollectiveExterne: e.target.value }))} placeholder="Info collective externe" rows="2" />
                      <textarea value={synthesisForm.ateliersInterneExterne} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, ateliersInterneExterne: e.target.value }))} placeholder="Ateliers interne/externe" rows="2" />
                      <textarea value={synthesisForm.formationsExterieur} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, formationsExterieur: e.target.value }))} placeholder="Formations extérieur" rows="2" />
                      <textarea value={synthesisForm.entretiensExterieur} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, entretiensExterieur: e.target.value }))} placeholder="Entretiens extérieur" rows="2" />
                    </div>

                    <div className="group-card wide">
                      <h4>Actions, emploi & synthèse</h4>
                      <div className="two-columns fluid-two-columns">
                        <input value={synthesisForm.sorties} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, sorties: e.target.value }))} placeholder="Sorties" />
                        <input value={synthesisForm.pmsmp} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, pmsmp: e.target.value }))} placeholder="PMSMP" />
                        <input value={synthesisForm.cdd} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, cdd: e.target.value }))} placeholder="CDD" />
                        <input value={synthesisForm.interim} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, interim: e.target.value }))} placeholder="Intérim" />
                        <input value={synthesisForm.miseADisposition} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, miseADisposition: e.target.value }))} placeholder="Mise à disposition" />
                      </div>
                      <textarea value={synthesisForm.demarchesEmploi} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, demarchesEmploi: e.target.value }))} placeholder="Démarches en lien avec l'emploi" rows="2" />
                      <textarea value={synthesisForm.demarchesFreins} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, demarchesFreins: e.target.value }))} placeholder="Démarches freins périphériques sociaux" rows="2" />
                      <textarea value={synthesisForm.notes} onChange={(e) => setSynthesisForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Synthèse / notes de suivi" rows="5" />
                      <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer la synthèse</button>
                    </div>
                  </form>
                </div>

                <div className="card">
                  <h3>Dernières synthèses</h3>
                  <div className="chat-list tracking-report-list">
                    {beneficiaires.length ? beneficiaires.map((beneficiary) => {
                      const latest = latestSynthesisFor(trackingState, currentStructureId, beneficiary.id);
                      return (
                        <div key={beneficiary.id} className="message-card meeting-report-card">
                          <div className="message-meta">
                            <strong>{beneficiary.nom} {beneficiary.prenom}</strong>
                            <span>{latest?.createdAt ? new Date(latest.createdAt).toLocaleString('fr-FR') : 'Aucune synthèse'}</span>
                          </div>
                          <p><strong>Projet :</strong> {latest?.projetProfessionnel || 'Non renseigné'}</p>
                          <p><strong>Outils :</strong> {latest?.outilsMobilises || 'Non renseigné'}</p>
                          <p><strong>Notes :</strong> {latest?.notes || 'Aucune note'}</p>
                        </div>
                      );
                    }) : <p className="muted">Aucun bénéficiaire à suivre.</p>}
                  </div>
                </div>
              </div>
            ) : null}

            {trackingTab === 'tableau' ? (
              <div className="card tracking-table-card">
                <div className="section-inline">
                  <div>
                    <h3>Tableau de suivi</h3>
                    <p className="muted">Lecture rapide des dernières informations de suivi.</p>
                  </div>
                  <input className="search-input" value={trackingSearch} onChange={(e) => setTrackingSearch(e.target.value)} placeholder="Filtrer le tableau" />
                </div>
                <div className="tracking-table-wrap">
                  <table className="tracking-table">
                    <thead>
                      <tr>
                        {TRACKING_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {trackingRows.length ? trackingRows.map((row) => (
                        <tr key={row.beneficiaryId}>
                          {TRACKING_COLUMNS.map((column) => <td key={column.key}>{row[column.key] || '—'}</td>)}
                        </tr>
                      )) : (
                        <tr><td colSpan={TRACKING_COLUMNS.length} className="muted">Aucune donnée de suivi.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {trackingTab === 'reunions' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Compte rendu de réunion</h3>
                  <form onSubmit={handleAddMeetingReport} className="form-grid compact-form">
                    <input value={meetingReportForm.title} onChange={(e) => setMeetingReportForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Objet de la réunion" />
                    <input type="datetime-local" value={meetingReportForm.meetingDate} onChange={(e) => setMeetingReportForm((prev) => ({ ...prev, meetingDate: e.target.value }))} />
                    <input value={meetingReportForm.participants} onChange={(e) => setMeetingReportForm((prev) => ({ ...prev, participants: e.target.value }))} placeholder="Participants" />
                    <textarea value={meetingReportForm.summary} onChange={(e) => setMeetingReportForm((prev) => ({ ...prev, summary: e.target.value }))} placeholder="Compte rendu" rows="4" />
                    <textarea value={meetingReportForm.decisions} onChange={(e) => setMeetingReportForm((prev) => ({ ...prev, decisions: e.target.value }))} placeholder="Décisions" rows="3" />
                    <textarea value={meetingReportForm.nextActions} onChange={(e) => setMeetingReportForm((prev) => ({ ...prev, nextActions: e.target.value }))} placeholder="Actions à suivre" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Enregistrer le compte rendu</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Historique des réunions</h3>
                  <div className="chat-list tracking-report-list">
                    {currentMeetingReports.length ? currentMeetingReports.map((report) => (
                      <div key={report.id} className="message-card meeting-report-card">
                        <div className="message-meta">
                          <strong>{report.title}</strong>
                          <span>{new Date(report.meetingDate).toLocaleString('fr-FR')}</span>
                        </div>
                        {report.participants ? <p><strong>Participants :</strong> {report.participants}</p> : null}
                        {report.summary ? <p><strong>Compte rendu :</strong> {report.summary}</p> : null}
                        {report.decisions ? <p><strong>Décisions :</strong> {report.decisions}</p> : null}
                        {report.nextActions ? <p><strong>Actions :</strong> {report.nextActions}</p> : null}
                      </div>
                    )) : <p className="muted">Aucun compte rendu enregistré.</p>}
                  </div>
                </div>
              </div>
            ) : null}

            {trackingTab === 'evaluations' ? (
              <div className="stack">
                <div className="card">
                  <div className="section-inline">
                    <div>
                      <h3>Ajouter une compétence personnalisée</h3>
                      <p className="muted">Ajoutez des compétences personnalisées à votre référentiel.</p>
                    </div>
                  </div>
                  {currentUser?.role !== 'CIP' && (
                    <div className="subtabs-wrap compact" style={{marginBottom: '16px'}}>
                      <span className={evaluationTab === 'technique' ? 'subtab active static' : 'subtab static'} onClick={() => { setEvaluationTab('technique'); setEvaluationForm((prev) => ({ ...prev, type: 'technique', skill: '' })); }}>Technique</span>
                      <span className={evaluationTab === 'savoir_etre' ? 'subtab active static' : 'subtab static'} onClick={() => { setEvaluationTab('savoir_etre'); setEvaluationForm((prev) => ({ ...prev, type: 'savoir_etre', skill: '' })); }}>Savoir-être</span>
                    </div>
                  )}
                  {currentUser?.role === 'CIP' && (
                    <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '8px', color: '#4f46e5', fontWeight: '600'}}>
                      Évaluation : Savoir-être uniquement
                    </div>
                  )}
                  <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                    <input value={newSkillInput} onChange={(e) => setNewSkillInput(e.target.value)} placeholder="Nom de la compétence" style={{flex: 1}} />
                    <button className="btn btn-primary" onClick={addCustomSkill}><Plus size={16} /> Ajouter</button>
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {(evaluationTab === 'technique' ? [...DEFAULT_SKILLS.technique, ...(customSkills.technique || [])] : [...DEFAULT_SKILLS.savoir_etre, ...(customSkills.savoir_etre || [])]).map((skill) => (
                      <span key={skill} className="badge" style={{backgroundColor: '#f0f5ff', color: '#4f46e5'}}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3>Évaluations par bénéficiaire</h3>
                  <div style={{overflowX: 'auto'}}>
                    <table className="tracking-table" style={{fontSize: '13px'}}>
                      <thead>
                        <tr>
                          <th>Bénéficiaire</th>
                          <th>Compétence</th>
                          <th>Type</th>
                          <th>Statut</th>
                          <th>Commentaire</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beneficiaires.length ? beneficiaires.map((beneficiary) => {
                          const beneficiaryEvals = evaluations[beneficiary.id] || [];
                          return beneficiaryEvals.length > 0 ? beneficiaryEvals.map((evaItem) => (
                            <tr key={evaItem.id}>
                              <td><strong>{beneficiary.nom} {beneficiary.prenom}</strong></td>
                              <td>{evaItem.skill}</td>
                              <td>{evaItem.type === 'technique' ? 'Technique' : 'Savoir-être'}</td>
                              <td>
                                <select onChange={(e) => updateEvaluation(beneficiary.id, evaItem.id, { status: e.target.value })} value={evaItem.status} style={{padding: '4px', fontSize: '12px', backgroundColor: evaItem.status === 'acquis' ? '#dcfce7' : evaItem.status === 'en_cours' ? '#fef3c7' : '#fee2e2'}}>
                                  <option value="non_acquis">Non acquis</option>
                                  <option value="en_cours">En cours</option>
                                  <option value="acquis">Acquis</option>
                                </select>
                              </td>
                              <td style={{fontSize: '12px', maxWidth: '200px'}}>{evaItem.comment || '—'}</td>
                              <td>
                                <button className="btn btn-light" style={{padding: '4px 8px', fontSize: '11px'}} onClick={() => removeEvaluation(beneficiary.id, evaItem.id)}><Trash2 size={12} /></button>
                              </td>
                            </tr>
                          )) : null;
                        }) : <tr><td colSpan={6} className="muted">Aucune évaluation enregistrée.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3>Ajouter une évaluation</h3>
                  <form onSubmit={handleAddEvaluation} className="form-grid compact-form">
                    <select value={evaluationForm.beneficiaryId} onChange={(e) => setEvaluationForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}>
                      <option value="">Bénéficiaire</option>
                      {beneficiaires.map((item) => (
                        <option key={item.id} value={item.id}>{item.nom} {item.prenom}</option>
                      ))}
                    </select>
                    <div className="subtabs-wrap compact">
                      <span className={evaluationTab === 'technique' ? 'subtab active static' : 'subtab static'} onClick={() => { setEvaluationTab('technique'); setEvaluationForm((prev) => ({ ...prev, type: 'technique', skill: '' })); }}>Technique</span>
                      <span className={evaluationTab === 'savoir_etre' ? 'subtab active static' : 'subtab static'} onClick={() => { setEvaluationTab('savoir_etre'); setEvaluationForm((prev) => ({ ...prev, type: 'savoir_etre', skill: '' })); }}>Savoir-être</span>
                    </div>
                    <select value={evaluationForm.skill} onChange={(e) => setEvaluationForm((prev) => ({ ...prev, skill: e.target.value }))}>
                      <option value="">Compétence/Savoir-être</option>
                      {(evaluationTab === 'technique' ? [...DEFAULT_SKILLS.technique, ...(customSkills.technique || [])] : [...DEFAULT_SKILLS.savoir_etre, ...(customSkills.savoir_etre || [])]).map((skill) => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                    <select value={evaluationForm.status} onChange={(e) => setEvaluationForm((prev) => ({ ...prev, status: e.target.value }))}>
                      <option value="non_acquis">Non acquis</option>
                      <option value="en_cours">En cours d'acquisition</option>
                      <option value="acquis">Acquis</option>
                    </select>
                    <textarea value={evaluationForm.comment} onChange={(e) => setEvaluationForm((prev) => ({ ...prev, comment: e.target.value }))} placeholder="Commentaires" rows="2" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Enregistrer l'évaluation</button>
                  </form>
                </div>

                {(currentUser?.role === 'Encadrant Technique' || currentUser?.role === 'Coordinateur') && (
                  <div className="card">
                    <h3>📄 Importer une évaluation papier (PDF)</h3>
                    <p className="muted" style={{ marginBottom: 12 }}>
                      Choisissez un bénéficiaire puis chargez un ou plusieurs PDF scannés de vos évaluations papier.
                    </p>
                    <div className="form-grid compact-form" style={{ marginBottom: 16 }}>
                      <select
                        value={evalPdfBeneficiaryId}
                        onChange={(e) => setEvalPdfBeneficiaryId(e.target.value)}
                      >
                        <option value="">Sélectionner un bénéficiaire</option>
                        {beneficiaires.map((item) => (
                          <option key={item.id} value={item.id}>{item.nom} {item.prenom}</option>
                        ))}
                      </select>
                      <label
                        className="file-field"
                        style={{ opacity: evalPdfBeneficiaryId ? 1 : 0.5, pointerEvents: evalPdfBeneficiaryId ? 'auto' : 'none' }}
                      >
                        <Paperclip size={16} />
                        {evalPdfUploading ? 'Import en cours…' : 'Choisir un ou plusieurs PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          disabled={!evalPdfBeneficiaryId || evalPdfUploading}
                          onChange={(e) => {
                            handleUploadEvaluationPdf(e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    {evalPdfBeneficiaryId ? (
                      <div className="list">
                        {evalPdfList.length ? evalPdfList.map((pdf) => (
                          <div key={pdf.id} className="list-row">
                            <div>
                              <strong>{pdf.title || pdf.fileName}</strong>
                              <p>
                                {pdf.authorName ? `Importé par ${pdf.authorName} · ` : ''}
                                {pdf.uploadedAt ? new Date(pdf.uploadedAt).toLocaleString('fr-FR') : ''}
                                {pdf.sizeBytes ? ` · ${(pdf.sizeBytes / 1024 / 1024).toFixed(1)} Mo` : ''}
                              </p>
                            </div>
                            <div className="row-actions">
                              <a
                                href={pdf.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                <FileText size={15} /> Ouvrir
                              </a>
                              <button
                                className="btn btn-light"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                onClick={() => handleDeleteEvaluationPdf(pdf)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )) : <p className="muted">Aucun document importé pour ce bénéficiaire.</p>}
                      </div>
                    ) : (
                      <p className="muted">Sélectionnez un bénéficiaire pour voir ses documents.</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'annuaire' ? (
          <section className="stack">
            <div className="page-head">
              <div>
                <h1>Annuaire</h1>
                <p>Ajoute, modifie ou supprime librement les contacts utiles à la structure.</p>
              </div>
              <a className="btn btn-light" href={ANNUAIRE_LINK} target="_blank" rel="noreferrer"><Building2 size={16} /> Ouvrir la page PCGI 87</a>
            </div>
            <div className="card annuaire-banner">
              <strong>Lien utile</strong>
              <a href={ANNUAIRE_LINK} target="_blank" rel="noreferrer">{ANNUAIRE_LINK}</a>
            </div>
            <div className="two-columns tracking-layout">
              <div className="card">
                <h3>{directoryForm.id ? 'Modifier un contact' : 'Ajouter un contact'}</h3>
                <form onSubmit={handleSaveDirectoryEntry} className="form-grid compact-form">
                  <input value={directoryForm.grandDomaine} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, grandDomaine: e.target.value }))} placeholder="Grand domaine" />
                  <input value={directoryForm.categorie} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, categorie: e.target.value }))} placeholder="Catégorie" />
                  <input value={directoryForm.nom} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, nom: e.target.value }))} placeholder="Nom du contact / structure" />
                  <input value={directoryForm.desc} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, desc: e.target.value }))} placeholder="Description" />
                  <input value={directoryForm.tel} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, tel: e.target.value }))} placeholder="Téléphone" />
                  <input value={directoryForm.email} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                  <input value={directoryForm.siteWeb} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, siteWeb: e.target.value }))} placeholder="Site web" />
                  <input value={directoryForm.adresse} onChange={(e) => setDirectoryForm((prev) => ({ ...prev, adresse: e.target.value }))} placeholder="Adresse" />
                  <div className="row-actions">
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> {directoryForm.id ? 'Enregistrer' : 'Ajouter'}</button>
                    {directoryForm.id ? <button className="btn btn-light" type="button" onClick={() => setDirectoryForm(EMPTY_DIRECTORY_FORM)}>Annuler</button> : null}
                  </div>
                </form>
              </div>
              <div className="card">
                <div className="section-inline">
                  <h3>Contacts de l’annuaire</h3>
                  <input className="search-input" value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} placeholder="Rechercher un contact" />
                </div>
                <div className="list annuaire-list">
                  {filteredAnnuaire.length ? filteredAnnuaire.map((entry) => (
                    <div key={entry.id} className="list-row align-start annuaire-row">
                      <div>
                        <strong>{entry.nom}</strong>
                        <p>{entry.grandDomaine} · {entry.categorie}</p>
                        {entry.desc ? <small>{entry.desc}</small> : null}
                        <div className="contact-meta">
                          {entry.tel ? <span>{entry.tel}</span> : null}
                          {entry.email ? <span>{entry.email}</span> : null}
                          {entry.adresse ? <span>{entry.adresse}</span> : null}
                          {entry.siteWeb ? <a href={entry.siteWeb} target="_blank" rel="noreferrer">Site web</a> : null}
                        </div>
                      </div>
                      <div className="row-actions">
                        <button className="btn btn-light" type="button" onClick={() => handleEditDirectoryEntry(entry)}><Save size={16} /> Modifier</button>
                        <button className="btn btn-danger" type="button" onClick={() => handleDeleteDirectoryEntry(entry.id)}><Trash2 size={16} /> Supprimer</button>
                      </div>
                    </div>
                  )) : <p className="muted">Aucun contact trouvé.</p>}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'messagerie' ? (
          <section className="stack">
            <div className="page-head"><h1>Messagerie</h1><p>Chat interne, inter-structures et bénéficiaire/référent.</p></div>
            <div className="subtabs-wrap">
              <button className={messagingTab === 'channel' ? 'subtab active' : 'subtab'} onClick={() => setMessagingTab('channel')}>Canal structure</button>
              <button className={messagingTab === 'direct' ? 'subtab active' : 'subtab'} onClick={() => setMessagingTab('direct')}>Messages pros</button>
              <button className={messagingTab === 'beneficiary' ? 'subtab active' : 'subtab'} onClick={() => setMessagingTab('beneficiary')}>Bénéficiaire / référent</button>
            </div>
            {messagingTab === 'channel' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <div className="section-inline"><h3>Canal de la structure</h3><span className="badge">Tous les professionnels</span></div>
                  <div className="filter-bar"><label className="search-inline"><Search size={15} /><input value={chatFilters.channelSearch} onChange={(e) => setChatFilters((prev) => ({ ...prev, channelSearch: e.target.value }))} placeholder="Filtrer le canal" /></label></div>
                  <form onSubmit={sendChannelMessage} className="form-grid compact-form">
                    <textarea value={channelMessage} onChange={(e) => setChannelMessage(e.target.value)} placeholder="Écrire un message au canal" rows="4" />
                    <div className="section-inline"><label className="file-field"><Paperclip size={16} /><span>Ajouter une pièce jointe</span><input type="file" onChange={(e) => handleAttachmentPick(e, setChannelAttachment)} /></label>{channelAttachment ? <div className="attachment-pill"><span>{channelAttachment.name}</span><button type="button" className="btn btn-light" onClick={() => setChannelAttachment(null)}>Retirer</button></div> : null}</div>
                    <button className="btn btn-primary" type="submit"><Send size={16} /> Envoyer</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Historique du canal</h3>
                  <div className="chat-list">{filteredChannelMessages.length ? filteredChannelMessages.map((message) => (
                    <div key={message.id} className="chat-bubble">
                      <strong>{message.authorName}</strong>
                      <p>{message.content}</p>
                      {message.attachment ? <a className="attachment-link" href={message.attachment.dataUrl} download={message.attachment.name}>📎 {message.attachment.name}</a> : null}
                      <small>{new Date(message.createdAt).toLocaleString('fr-FR')}</small>
                    </div>
                  )) : <p className="muted">Aucun message dans le canal.</p>}</div>
                </div>
              </div>
            ) : null}
            {messagingTab === 'direct' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <div className="section-inline"><h3>Nouveau message professionnel</h3>{unreadDirectCount ? <span className="badge warn-badge">{unreadDirectCount} non lus</span> : null}</div>
                  <div className="filter-bar"><label className="search-inline"><Search size={15} /><input value={chatFilters.directSearch} onChange={(e) => setChatFilters((prev) => ({ ...prev, directSearch: e.target.value }))} placeholder="Filtrer les conversations" /></label><label className="checkbox-row"><input type="checkbox" checked={chatFilters.unreadOnly} onChange={(e) => setChatFilters((prev) => ({ ...prev, unreadOnly: e.target.checked }))} /><span>Non lus uniquement</span></label></div>
                  <form onSubmit={sendDirectMessage} className="form-grid compact-form">
                    <select value={directForm.structureId} onChange={(e) => setDirectForm((prev) => ({ ...prev, structureId: e.target.value, userId: '' }))}>{allStructures.map((structure) => <option key={structure.id} value={structure.id}>{structure.nom}</option>)}</select>
                    <select value={directForm.userId} onChange={(e) => setDirectForm((prev) => ({ ...prev, userId: e.target.value }))}><option value="">Choisir un professionnel</option>{allProfessionalOptions.filter((item) => item.structureId === directForm.structureId && item.id !== currentUser?.id).map((user) => <option key={user.id} value={user.id}>{user.nom} · {user.structureName}</option>)}</select>
                    <textarea value={directForm.message} onChange={(e) => setDirectForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Votre message" rows="4" />
                    <div className="section-inline"><label className="file-field"><Paperclip size={16} /><span>Ajouter une pièce jointe</span><input type="file" onChange={(e) => handleAttachmentPick(e, setDirectAttachment)} /></label>{directAttachment ? <div className="attachment-pill"><span>{directAttachment.name}</span><button type="button" className="btn btn-light" onClick={() => setDirectAttachment(null)}>Retirer</button></div> : null}</div>
                    <button className="btn btn-primary" type="submit"><Send size={16} /> Envoyer</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Conversations professionnelles</h3>
                  <div className="chat-list">{filteredDirectConversations.length ? filteredDirectConversations.map((conv) => (
                    <div key={conv.key} className="chat-thread">
                      <div className="section-inline"><strong>{conv.title}</strong>{conv.unreadCount ? <span className="badge warn-badge">{conv.unreadCount}</span> : null}</div>
                      <div className="chat-list">{conv.messages.map((message) => (
                        <div key={message.id} className="chat-bubble compact">
                          <strong>{message.authorName}</strong>
                          <p>{message.content}</p>
                          {message.attachment ? <a className="attachment-link" href={message.attachment.dataUrl} download={message.attachment.name}>📎 {message.attachment.name}</a> : null}
                          <small>{new Date(message.createdAt).toLocaleString('fr-FR')}</small>
                        </div>
                      ))}</div>
                      {conv.unreadCount ? <button className="btn btn-light" type="button" onClick={() => markConversationRead(conv.key, 'direct')}>Marquer lu</button> : null}
                    </div>
                  )) : <p className="muted">Aucune conversation professionnelle.</p>}</div>
                </div>
              </div>
            ) : null}
            {messagingTab === 'beneficiary' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <div className="section-inline"><h3>Écrire au référent / bénéficiaire</h3>{unreadBeneficiaryCount ? <span className="badge warn-badge">{unreadBeneficiaryCount} non lus</span> : null}</div>
                  <div className="filter-bar"><label className="search-inline"><Search size={15} /><input value={chatFilters.beneficiarySearch} onChange={(e) => setChatFilters((prev) => ({ ...prev, beneficiarySearch: e.target.value }))} placeholder="Filtrer les fils bénéficiaires" /></label></div>
                  <form onSubmit={sendBeneficiaryMessage} className="form-grid compact-form">
                    <select value={beneficiaryChatForm.beneficiaryId} onChange={(e) => setBeneficiaryChatForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}><option value="">Choisir un bénéficiaire</option>{beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select>
                    <textarea value={beneficiaryChatForm.message} onChange={(e) => setBeneficiaryChatForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Votre message" rows="4" />
                    <div className="section-inline"><label className="file-field"><Paperclip size={16} /><span>Ajouter une pièce jointe</span><input type="file" onChange={(e) => handleAttachmentPick(e, setBeneficiaryAttachment)} /></label>{beneficiaryAttachment ? <div className="attachment-pill"><span>{beneficiaryAttachment.name}</span><button type="button" className="btn btn-light" onClick={() => setBeneficiaryAttachment(null)}>Retirer</button></div> : null}</div>
                    <button className="btn btn-primary" type="submit"><Send size={16} /> Envoyer</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Fils bénéficiaire / référent</h3>
                  <div className="chat-list">{filteredBeneficiaryConversations.length ? filteredBeneficiaryConversations.map((conv) => (
                    <div key={conv.key} className="chat-thread">
                      <div className="section-inline"><strong>{conv.title}</strong>{conv.unreadCount ? <span className="badge warn-badge">{conv.unreadCount}</span> : null}</div>
                      <div className="chat-list">{conv.messages.map((message) => (
                        <div key={message.id} className="chat-bubble compact">
                          <strong>{message.authorName}</strong>
                          <p>{message.content}</p>
                          {message.attachment ? <a className="attachment-link" href={message.attachment.dataUrl} download={message.attachment.name}>📎 {message.attachment.name}</a> : null}
                          <small>{new Date(message.createdAt).toLocaleString('fr-FR')}</small>
                        </div>
                      ))}</div>
                      {conv.unreadCount ? <button className="btn btn-light" type="button" onClick={() => markConversationRead(conv.key, 'beneficiary')}>Marquer lu</button> : null}
                    </div>
                  )) : <p className="muted">Aucun fil bénéficiaire / référent.</p>}</div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'agendas' ? (
          <section className="stack">
            <div className="page-head"><h1>Agendas</h1><p>Personnel, bénéficiaires et structure.</p></div>
            <div className="subtabs-wrap">
              <button className={agendaTab === 'reminders' ? 'subtab active' : 'subtab'} onClick={() => setAgendaTab('reminders')}>Rappels</button>
              <button className={agendaTab === 'personal' ? 'subtab active' : 'subtab'} onClick={() => setAgendaTab('personal')}>Personnel</button>
              <button className={agendaTab === 'beneficiary' ? 'subtab active' : 'subtab'} onClick={() => setAgendaTab('beneficiary')}>Bénéficiaires</button>
              <button className={agendaTab === 'structure' ? 'subtab active' : 'subtab'} onClick={() => setAgendaTab('structure')}>Structure</button>
            </div>
            <div className="card">
              <div className="filter-bar">
                <label className="search-inline"><Search size={15} /><input value={agendaFilters.search} onChange={(e) => setAgendaFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Filtrer les agendas" /></label>
                <label className="checkbox-row"><input type="checkbox" checked={agendaFilters.upcomingOnly} onChange={(e) => setAgendaFilters((prev) => ({ ...prev, upcomingOnly: e.target.checked }))} /><span>7 prochains jours</span></label>
              </div>
            </div>

            {agendaTab === 'reminders' ? (
              <div className="card">
                <h3>Rappels à venir</h3>
                <div className="list">{reminderItems.length ? reminderItems.map((item) => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.title || item.beneficiaryName || 'Événement'}</strong>
                      <p>{item.scope} · {new Date(item.startAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <span className={item.reminderType === 'En retard' ? 'badge danger-badge' : 'badge warn-badge'}>{item.reminderType}</span>
                  </div>
                )) : <p className="muted">Aucun rappel proche.</p>}</div>
              </div>
            ) : null}

            {agendaTab === 'personal' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Ajouter à l’agenda personnel</h3>
                  <form onSubmit={addPersonalAgendaItem} className="form-grid compact-form">
                    <input value={personalAgendaForm.title} onChange={(e) => setPersonalAgendaForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titre du rendez-vous / tâche" />
                    <input type="datetime-local" value={personalAgendaForm.startAt} onChange={(e) => setPersonalAgendaForm((prev) => ({ ...prev, startAt: e.target.value }))} />
                    <textarea value={personalAgendaForm.notes} onChange={(e) => setPersonalAgendaForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Ajouter</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Événements personnels</h3>
                  <div className="chat-list">{filterAgendaItems(currentPersonalAgenda).length ? filterAgendaItems(currentPersonalAgenda).map((item) => (
                    <div key={item.id} className="agenda-item">
                      <div><strong>{item.title}</strong><p>{new Date(item.startAt).toLocaleString('fr-FR')}</p>{item.notes ? <small>{item.notes}</small> : null}</div>
                      <button className="btn btn-danger" type="button" onClick={() => removeAgendaItem('personal', item.id)}><Trash2 size={16} /></button>
                    </div>
                  )) : <p className="muted">Aucun événement personnel.</p>}</div>
                </div>
              </div>
            ) : null}

            {agendaTab === 'beneficiary' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Ajouter un RDV bénéficiaire</h3>
                  <form onSubmit={addBeneficiaryAgendaItem} className="form-grid compact-form">
                    <select value={beneficiaryAgendaForm.beneficiaryId} onChange={(e) => setBeneficiaryAgendaForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}><option value="">Choisir un bénéficiaire</option>{beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select>
                    <select value={beneficiaryAgendaForm.type} onChange={(e) => setBeneficiaryAgendaForm((prev) => ({ ...prev, type: e.target.value }))}><option value="rdv_referent">RDV avec le référent</option><option value="atelier_collectif">Atelier collectif</option><option value="rdv_administratif">RDV administratif</option></select>
                    <input type="datetime-local" value={beneficiaryAgendaForm.startAt} onChange={(e) => setBeneficiaryAgendaForm((prev) => ({ ...prev, startAt: e.target.value }))} />
                    <textarea value={beneficiaryAgendaForm.notes} onChange={(e) => setBeneficiaryAgendaForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Ajouter</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Agenda bénéficiaires</h3>
                  <div className="chat-list">{filterAgendaItems(currentBeneficiaryAgenda).length ? filterAgendaItems(currentBeneficiaryAgenda).map((item) => (
                    <div key={item.id} className="agenda-item">
                      <div><strong>{item.beneficiaryName}</strong><p>{agendaLabel(item.type)} · {new Date(item.startAt).toLocaleString('fr-FR')}</p>{item.notes ? <small>{item.notes}</small> : null}</div>
                      <button className="btn btn-danger" type="button" onClick={() => removeAgendaItem('beneficiary', item.id)}><Trash2 size={16} /></button>
                    </div>
                  )) : <p className="muted">Aucun rendez-vous bénéficiaire.</p>}</div>
                </div>
              </div>
            ) : null}

            {agendaTab === 'structure' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Ajouter un événement structure</h3>
                  <form onSubmit={addStructureAgendaItem} className="form-grid compact-form">
                    <select value={structureAgendaForm.type} onChange={(e) => setStructureAgendaForm((prev) => ({ ...prev, type: e.target.value }))}><option value="reunion">Réunion</option><option value="atelier_structure">Atelier collectif</option><option value="rappel">Rappel structure</option></select>
                    <input value={structureAgendaForm.title} onChange={(e) => setStructureAgendaForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titre" />
                    <input type="datetime-local" value={structureAgendaForm.startAt} onChange={(e) => setStructureAgendaForm((prev) => ({ ...prev, startAt: e.target.value }))} />
                    <textarea value={structureAgendaForm.notes} onChange={(e) => setStructureAgendaForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Ajouter</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Agenda structure</h3>
                  <div className="chat-list">{filterAgendaItems(currentStructureAgenda).length ? filterAgendaItems(currentStructureAgenda).map((item) => (
                    <div key={item.id} className="agenda-item">
                      <div><strong>{item.title}</strong><p>{agendaLabel(item.type)} · {new Date(item.startAt).toLocaleString('fr-FR')}</p>{item.notes ? <small>{item.notes}</small> : null}</div>
                      <button className="btn btn-danger" type="button" onClick={() => removeAgendaItem('structure', item.id)}><Trash2 size={16} /></button>
                    </div>
                  )) : <p className="muted">Aucun événement structure.</p>}</div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'activites' ? (
          <section className="stack">
            <div className="page-head"><h1>Activités & Chantiers</h1><p>Gérez les activités et assignez les bénéficiaires.</p></div>
            <div className="subtabs-wrap">
              <button className={activitiesTab === 'list' ? 'subtab active' : 'subtab'} onClick={() => setActivitiesTab('list')}>Activités</button>
              <button className={activitiesTab === 'create' ? 'subtab active' : 'subtab'} onClick={() => setActivitiesTab('create')}>Créer une activité</button>
            </div>

            {activitiesTab === 'create' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Créer une nouvelle activité</h3>
                  <form onSubmit={addActivity} className="form-grid">
                    <div className="field"><span>Titre de l'activité</span><input value={activityForm.title} onChange={(e) => setActivityForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ex: Chantier de nettoyage" required /></div>
                    <div className="field"><span>Description</span><textarea value={activityForm.description} onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Détails de l'activité" rows="3" /></div>
                    <div className="field"><span>Lieu</span><input value={activityForm.location} onChange={(e) => setActivityForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Localisation du chantier" /></div>
                    <div className="field"><span>Date de début</span><input type="date" value={activityForm.startDate} onChange={(e) => setActivityForm((prev) => ({ ...prev, startDate: e.target.value }))} required /></div>
                    <div className="field"><span>Date de fin</span><input type="date" value={activityForm.endDate} onChange={(e) => setActivityForm((prev) => ({ ...prev, endDate: e.target.value }))} /></div>
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Créer l'activité</button>
                  </form>
                </div>
                <div className="card">
                  <h3>⚠️ Vérifier les agendas</h3>
                  <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Avant d'assigner un bénéficiaire, consultez ses RDV pour éviter les chevauchements.</p>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="list">
                      {beneficiaires.length ? beneficiaires.map((ben) => {
                        const benAgendas = (agendaState.beneficiary?.[currentStructureId]?.[ben.id] || []).filter((ev) => {
                          if (!activityForm.startDate) return true;
                          const eventDate = new Date(ev.startAt).toLocaleDateString('fr-FR');
                          const startDate = new Date(activityForm.startDate).toLocaleDateString('fr-FR');
                          const endDate = activityForm.endDate ? new Date(activityForm.endDate).toLocaleDateString('fr-FR') : startDate;
                          return eventDate >= startDate && eventDate <= endDate;
                        });
                        return (
                          <div key={ben.id} style={{ marginBottom: '12px', padding: '10px', background: '#f7f9fc', borderRadius: '8px' }}>
                            <strong style={{ fontSize: '0.95rem' }}>{ben.prenom} {ben.nom}</strong>
                            {benAgendas.length ? (
                              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #dde5f1' }}>
                                {benAgendas.map((ev) => (
                                  <p key={ev.id} style={{ margin: '4px 0', fontSize: '0.85rem', color: '#e74c3c' }}>
                                    📅 {new Date(ev.startAt).toLocaleString('fr-FR')} - {ev.beneficiaryName || 'Activité'}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#27ae60' }}>✓ Libre</p>
                            )}
                          </div>
                        );
                      }) : <p className="muted">Aucun bénéficiaire</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activitiesTab === 'list' ? (
              <div className="card">
                <h3>Activités en cours</h3>
                {(activities[currentStructureId] || []).length ? (
                  <div className="list">
                    {(activities[currentStructureId] || []).map((activity) => (
                      <div key={activity.id} className="card" style={{ marginBottom: '16px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <strong style={{ fontSize: '1.1rem' }}>{activity.title}</strong>
                            {activity.location && <p style={{ margin: '4px 0', color: '#64748b' }}>📍 {activity.location}</p>}
                            {activity.description && <p style={{ margin: '4px 0', color: '#64748b' }}>{activity.description}</p>}
                            <p style={{ margin: '6px 0 0', color: '#888', fontSize: '0.9rem' }}>
                              {new Date(activity.startDate).toLocaleDateString('fr-FR')}
                              {activity.endDate && ` au ${new Date(activity.endDate).toLocaleDateString('fr-FR')}`}
                            </p>
                          </div>
                          <button className="btn btn-danger" onClick={() => removeActivity(activity.id)} style={{ padding: '8px 12px', minWidth: 'auto' }}><Trash2 size={16} /></button>
                        </div>

                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dde5f1' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>Bénéficiaires assignés ({activity.assignedBeneficiaries?.length || 0})</h4>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            {activity.assignedBeneficiaries?.length ? (
                              activity.assignedBeneficiaries.map((benId) => {
                                const ben = beneficiaires.find((b) => b.id === benId);
                                return ben ? (
                                  <div key={benId} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {ben.prenom} {ben.nom}
                                    <button type="button" onClick={() => removeBeneficiaryFromActivity(activity.id, benId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'inherit' }}>×</button>
                                  </div>
                                ) : null;
                              })
                            ) : (
                              <p className="muted" style={{ margin: 0 }}>Aucun bénéficiaire assigné</p>
                            )}
                          </div>
                          <select onChange={(e) => { if (e.target.value) assignBeneficiaryToActivity(activity.id, e.target.value); e.target.value = ''; }} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #dde5f1' }}>
                            <option value="">+ Ajouter un bénéficiaire</option>
                            {beneficiaires.filter((b) => !activity.assignedBeneficiaries?.includes(b.id)).map((ben) => (
                              <option key={ben.id} value={ben.id}>{ben.prenom} {ben.nom}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dde5f1' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>Commentaires ({activity.comments?.length || 0})</h4>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '8px' }}>
                            {activity.comments?.length ? (
                              activity.comments.map((comment) => (
                                <div key={comment.id} style={{ padding: '8px', background: '#f7f9fc', borderRadius: '8px', marginBottom: '6px', fontSize: '0.9rem' }}>
                                  <strong>{comment.author}</strong> · {new Date(comment.createdAt).toLocaleString('fr-FR')}
                                  <p style={{ margin: '4px 0 0' }}>{comment.text}</p>
                                </div>
                              ))
                            ) : (
                              <p className="muted" style={{ margin: 0 }}>Aucun commentaire</p>
                            )}
                          </div>
                          <form onSubmit={(e) => { e.preventDefault(); const input = e.target.commentInput; if (input.value.trim()) { addActivityComment(activity.id, input.value); input.value = ''; } }} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" name="commentInput" placeholder="Ajouter un commentaire..." style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #dde5f1' }} />
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', minWidth: 'auto' }}><Send size={16} /></button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Aucune activité créée.</p>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'utilisateurs' ? (
          <section className="stack">
            <div className="page-head"><h1>Utilisateurs</h1></div>
            <div className="two-columns">
              <div className="card">
                <h3>Ajouter un utilisateur</h3>
                <form onSubmit={handleAddUser} className="form-grid">
                  <input value={newUserForm.nom} onChange={(e) => setNewUserForm((prev) => ({ ...prev, nom: e.target.value }))} placeholder="Nom" />
                  <input value={newUserForm.email} onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                  <select value={newUserForm.role} onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}>
                    <option>Coordinateur</option>
                    <option>CIP</option>
                    <option>Secrétaire</option>
                    <option>Encadrant Technique</option>
                  </select>
                  <input type="password" value={newUserForm.motDePasse} onChange={(e) => setNewUserForm((prev) => ({ ...prev, motDePasse: e.target.value }))} placeholder="Mot de passe initial" />
                  <button className="btn btn-primary" type="submit"><UserPlus size={16} /> Ajouter</button>
                </form>
              </div>

              {canCreateStructure ? (
                <div className="card accent-card">
                  <h3>Ajouter une structure</h3>
                  <form onSubmit={handleAddStructure} className="form-grid">
                    <input value={newStructureForm.nom} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, nom: e.target.value }))} placeholder="Nom de la structure" />
                    <input value={newStructureForm.type} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, type: e.target.value }))} placeholder="Type" />
                    <input value={newStructureForm.ville} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, ville: e.target.value }))} placeholder="Ville" />
                    <input value={newStructureForm.telephone} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, telephone: e.target.value }))} placeholder="Téléphone" />
                    <input value={newStructureForm.email} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email structure" />
                    <input value={newStructureForm.coordinatorName} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, coordinatorName: e.target.value }))} placeholder="Nom du coordinateur" />
                    <input value={newStructureForm.coordinatorEmail} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, coordinatorEmail: e.target.value }))} placeholder="Email du coordinateur" />
                    <input type="password" value={newStructureForm.coordinatorPassword} onChange={(e) => setNewStructureForm((prev) => ({ ...prev, coordinatorPassword: e.target.value }))} placeholder="Mot de passe initial (optionnel)" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Créer la structure</button>
                  </form>
                </div>
              ) : null}
            </div>

            <div className="card">
              <h3>Équipe de la structure</h3>
              <div className="list">
                {users.map((user) => (
                  <div key={user.id} className="list-row">
                    <div>
                      <strong>{user.nom}</strong>
                      <p>{user.email} · {user.role}</p>
                    </div>
                    {user.id !== currentUser.id ? <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)}><Trash2 size={16} /> Supprimer</button> : <span className="badge">Connecté</span>}
                  </div>
                ))}
              </div>
            </div>

            {firstAccessInfo ? (
              <div className="card first-access-box">
                <h3>Informations de première connexion</h3>
                <p>Structure : {firstAccessInfo.structure}</p>
                <p>Identifiant : {firstAccessInfo.email}</p>
                <p>Mot de passe temporaire : {firstAccessInfo.motDePasse}</p>
                <button className="btn btn-light" onClick={copyFirstAccess}><Save size={16} /> Copier les accès</button>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'secretariat' ? (
          <section className="stack">
            <div className="page-head"><h1>Secrétariat</h1><p>Accueil administratif, dossiers, convocations, ateliers, contrats et fiches de paie.</p></div>
            <div className="subtabs-wrap">
              <button className={secretariatTab === 'accueil' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('accueil')}>Accueil</button>
              <button className={secretariatTab === 'beneficiaires' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('beneficiaires')}>Bénéficiaires</button>
              <button className={secretariatTab === 'dossiers' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('dossiers')}>Dossiers administratifs</button>
              <button className={secretariatTab === 'convocations' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('convocations')}>Convocations</button>
              <button className={secretariatTab === 'ateliers' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('ateliers')}>Ateliers</button>
              <button className={secretariatTab === 'contrats' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('contrats')}>Contrats</button>
              <button className={secretariatTab === 'paies' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('paies')}>Fiches de paie</button>
              <button className={secretariatTab === 'documents_salaries' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('documents_salaries')}>📄 Documents salarié</button>
              <button className={secretariatTab === 'factures' ? 'subtab active' : 'subtab'} onClick={() => setSecretariatTab('factures')}>Factures</button>
            </div>

            {secretariatTab === 'accueil' ? (
              <div className="two-columns">
                <div className="card">
                  <div className="stats-grid secretary-stats">
                    <div className="stat-card card"><span>Dossiers complets</span><strong>{Object.values(currentAdminRecords).filter((item) => item?.dossierComplet).length}</strong></div>
                    <div className="stat-card card"><span>Dossiers incomplets</span><strong>{Object.values(currentAdminRecords).filter((item) => item && !item.dossierComplet).length}</strong></div>
                    <div className="stat-card card"><span>Convocations</span><strong>{currentConvocations.length}</strong></div>
                    <div className="stat-card card"><span>Fiches de paie</span><strong>{currentPayslips.length}</strong></div>
                  </div>
                </div>
                <div className="card">
                  <h3>Accueil / standard</h3>
                  <form onSubmit={addFrontDeskNote} className="form-grid compact-form">
                    <input value={frontDeskForm.person} onChange={(e) => setFrontDeskForm((prev) => ({ ...prev, person: e.target.value }))} placeholder="Personne / visiteur" />
                    <input value={frontDeskForm.contact} onChange={(e) => setFrontDeskForm((prev) => ({ ...prev, contact: e.target.value }))} placeholder="Téléphone / email" />
                    <input value={frontDeskForm.subject} onChange={(e) => setFrontDeskForm((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Objet" />
                    <input value={frontDeskForm.destination} onChange={(e) => setFrontDeskForm((prev) => ({ ...prev, destination: e.target.value }))} placeholder="Destinataire" />
                    <select value={frontDeskForm.urgency} onChange={(e) => setFrontDeskForm((prev) => ({ ...prev, urgency: e.target.value }))}><option>Normale</option><option>Urgente</option></select>
                    <textarea value={frontDeskForm.notes} onChange={(e) => setFrontDeskForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Message à transmettre" rows="3" />
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer</button>
                  </form>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'accueil' ? (
              <div className="card">
                <h3>Historique accueil</h3>
                <div className="list">{currentFrontDesk.length ? currentFrontDesk.map((item) => (
                  <div key={item.id} className="list-row">
                    <div><strong>{item.person}</strong><p>{item.subject} · {item.destination || 'Sans destinataire'} · {new Date(item.createdAt).toLocaleString('fr-FR')}</p><small>{item.notes}</small></div>
                    <span className={item.urgency === 'Urgente' ? 'badge danger-badge' : 'badge'}>{item.urgency}</span>
                  </div>
                )) : <p className="muted">Aucun message accueil.</p>}</div>
              </div>
            ) : null}

            {secretariatTab === 'dossiers' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Dossier administratif</h3>
                  <form onSubmit={saveAdminRecord} className="form-grid compact-form">
                    <select value={adminRecordForm.beneficiaryId} onChange={(e) => setAdminRecordForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}><option value="">Choisir un bénéficiaire</option>{beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select>
                    <input value={adminRecordForm.prescripteur} onChange={(e) => setAdminRecordForm((prev) => ({ ...prev, prescripteur: e.target.value }))} placeholder="Prescripteur" />
                    <input value={adminRecordForm.situationAdministrative} onChange={(e) => setAdminRecordForm((prev) => ({ ...prev, situationAdministrative: e.target.value }))} placeholder="Situation administrative" />
                    <textarea value={adminRecordForm.piecesManquantes} onChange={(e) => setAdminRecordForm((prev) => ({ ...prev, piecesManquantes: e.target.value }))} placeholder="Pièces manquantes" rows="3" />
                    <textarea value={adminRecordForm.notes} onChange={(e) => setAdminRecordForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes administratives" rows="3" />
                    <label className="checkbox-row"><input type="checkbox" checked={adminRecordForm.dossierComplet} onChange={(e) => setAdminRecordForm((prev) => ({ ...prev, dossierComplet: e.target.checked }))} /><span>Dossier complet</span></label>
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer le dossier</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Suivi des dossiers</h3>
                  <div className="list">{beneficiaires.length ? beneficiaires.map((item) => { const record = currentAdminRecords[item.id]; return (
                    <div key={item.id} className="list-row">
                      <div><strong>{item.prenom} {item.nom}</strong><p>{record?.prescripteur || 'Sans prescripteur'} · {record?.situationAdministrative || 'Situation non renseignée'}</p><small>{record?.piecesManquantes || 'Aucune pièce manquante indiquée'}</small></div>
                      <span className={record?.dossierComplet ? 'badge success-badge' : 'badge warn-badge'}>{record?.dossierComplet ? 'Complet' : 'Incomplet'}</span>
                    </div>
                  ); }) : <p className="muted">Aucun bénéficiaire.</p>}</div>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'convocations' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Créer une convocation</h3>
                  <form onSubmit={addConvocation} className="form-grid compact-form">
                    <select value={convocationForm.beneficiaryId} onChange={(e) => setConvocationForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}><option value="">Bénéficiaire</option>{beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select>
                    <input type="date" value={convocationForm.date} onChange={(e) => setConvocationForm((prev) => ({ ...prev, date: e.target.value }))} />
                    <input type="time" value={convocationForm.heure} onChange={(e) => setConvocationForm((prev) => ({ ...prev, heure: e.target.value }))} />
                    <input value={convocationForm.motif} onChange={(e) => setConvocationForm((prev) => ({ ...prev, motif: e.target.value }))} placeholder="Motif" />
                    <select value={convocationForm.canal} onChange={(e) => setConvocationForm((prev) => ({ ...prev, canal: e.target.value }))}><option>Application</option><option>Email</option><option>Téléphone</option><option>Courrier</option></select>
                    <textarea value={convocationForm.commentaire} onChange={(e) => setConvocationForm((prev) => ({ ...prev, commentaire: e.target.value }))} placeholder="Commentaire" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Enregistrer la convocation</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Convocations enregistrées</h3>
                  <div className="list">{currentConvocations.length ? currentConvocations.map((item) => (
                    <div key={item.id} className="list-row">
                      <div><strong>{item.beneficiaryName}</strong><p>{item.motif} · {item.date} {item.heure} · {item.canal}</p><small>{item.commentaire}</small></div>
                      <button className="btn btn-danger" type="button" onClick={() => removeSecretariatItem('convocations', item.id)}><Trash2 size={16} /></button>
                    </div>
                  )) : <p className="muted">Aucune convocation.</p>}</div>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'ateliers' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Préparer un atelier collectif</h3>
                  <form onSubmit={addWorkshop} className="form-grid compact-form">
                    <input value={workshopForm.title} onChange={(e) => setWorkshopForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titre de l'atelier" />
                    <input type="date" value={workshopForm.date} onChange={(e) => setWorkshopForm((prev) => ({ ...prev, date: e.target.value }))} />
                    <input type="time" value={workshopForm.heure} onChange={(e) => setWorkshopForm((prev) => ({ ...prev, heure: e.target.value }))} />
                    <input value={workshopForm.lieu} onChange={(e) => setWorkshopForm((prev) => ({ ...prev, lieu: e.target.value }))} placeholder="Lieu" />
                    <input value={workshopForm.participants} onChange={(e) => setWorkshopForm((prev) => ({ ...prev, participants: e.target.value }))} placeholder="Participants" />
                    <textarea value={workshopForm.notes} onChange={(e) => setWorkshopForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Préparation / consignes" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Ajouter l'atelier</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Ateliers collectifs</h3>
                  <div className="list">{currentWorkshops.length ? currentWorkshops.map((item) => (
                    <div key={item.id} className="list-row">
                      <div><strong>{item.title}</strong><p>{item.date} {item.heure} · {item.lieu || 'Sans lieu'}</p><small>{item.participants || 'Participants non renseignés'}</small></div>
                      <button className="btn btn-danger" type="button" onClick={() => removeSecretariatItem('workshops', item.id)}><Trash2 size={16} /></button>
                    </div>
                  )) : <p className="muted">Aucun atelier.</p>}</div>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'contrats' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <div className="section-inline"><h3>Contrat prérempli modifiable</h3><button className="btn btn-light" type="button" onClick={prefillContract}><FileText size={16} /> Préremplir</button></div>
                  <form onSubmit={saveContract} className="form-grid compact-form">
                    <select value={contractForm.beneficiaryId} onChange={(e) => setContractForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}><option value="">Bénéficiaire / salarié</option>{beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select>
                    <input value={contractForm.employeeName} onChange={(e) => setContractForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <input value={contractForm.contractType} onChange={(e) => setContractForm((prev) => ({ ...prev, contractType: e.target.value }))} placeholder="Type de contrat" />
                    <input type="date" value={contractForm.startDate} onChange={(e) => setContractForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                    <input type="date" value={contractForm.endDate} onChange={(e) => setContractForm((prev) => ({ ...prev, endDate: e.target.value }))} />
                    <input value={contractForm.weeklyHours} onChange={(e) => setContractForm((prev) => ({ ...prev, weeklyHours: e.target.value }))} placeholder="Durée hebdo" />
                    <input value={contractForm.remuneration} onChange={(e) => setContractForm((prev) => ({ ...prev, remuneration: e.target.value }))} placeholder="Rémunération" />
                    <textarea value={contractForm.details} onChange={(e) => setContractForm((prev) => ({ ...prev, details: e.target.value }))} placeholder="Clauses / détails" rows="3" />
                    <textarea value={contractForm.content} onChange={(e) => setContractForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Contenu du contrat" rows="10" />
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer le contrat</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Contrats enregistrés</h3>
                  <div className="list">{currentContracts.length ? currentContracts.map((item) => (
                    <div key={item.id} className="list-row align-start">
                      <div><strong>{item.employeeName}</strong><p>{item.contractType} · {item.startDate || 'sans début'} → {item.endDate || 'sans fin'}</p><small>{item.weeklyHours || ''} {item.remuneration ? `· ${item.remuneration}` : ''}</small></div>
                      <div className="row-actions"><button className="btn btn-light" type="button" onClick={() => printContract(item)}><FileText size={16} /> Ouvrir</button><button className="btn btn-danger" type="button" onClick={() => removeSecretariatItem('contracts', item.id)}><Trash2 size={16} /></button></div>
                    </div>
                  )) : <p className="muted">Aucun contrat enregistré.</p>}</div>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'paies' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Transmettre une fiche de paie</h3>
                  <form onSubmit={addPayslipTransmission} className="form-grid compact-form">
                    <select value={paySlipForm.beneficiaryId} onChange={(e) => setPaySlipForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}><option value="">Bénéficiaire / salarié</option>{beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}</select>
                    <input value={paySlipForm.employeeName} onChange={(e) => setPaySlipForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <input value={paySlipForm.period} onChange={(e) => setPaySlipForm((prev) => ({ ...prev, period: e.target.value }))} placeholder="Période (ex: Mars 2026)" />
                    <textarea value={paySlipForm.notes} onChange={(e) => setPaySlipForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Commentaire de transmission" rows="3" />
                    <div className="section-inline"><label className="file-field"><Paperclip size={16} /><span>Joindre la fiche de paie</span><input type="file" onChange={(e) => handleAttachmentPick(e, setPaySlipAttachment)} /></label>{paySlipAttachment ? <div className="attachment-pill"><span>{paySlipAttachment.name}</span><button type="button" className="btn btn-light" onClick={() => setPaySlipAttachment(null)}>Retirer</button></div> : null}</div>
                    <button className="btn btn-primary" type="submit"><Send size={16} /> Transmettre via l'application</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Fiches de paie transmises</h3>
                  <div className="list">{currentPayslips.length ? currentPayslips.map((item) => (
                    <div key={item.id} className="list-row align-start">
                      <div><strong>{item.employeeName}</strong><p>{item.period} · transmis le {new Date(item.transmittedAt).toLocaleString('fr-FR')}</p><small>{item.notes || 'Sans commentaire'}</small>{item.attachment ? <div><a className="attachment-link" href={item.attachment.dataUrl} download={item.attachment.name}>📎 {item.attachment.name}</a></div> : null}</div>
                      <div className="row-actions"><span className="badge success-badge">Transmis</span><button className="btn btn-danger" type="button" onClick={() => removeSecretariatItem('payslips', item.id)}><Trash2 size={16} /></button></div>
                    </div>
                  )) : <p className="muted">Aucune fiche de paie transmise.</p>}</div>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'beneficiaires' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Ajouter & assigner des bénéficiaires</h3>
                  <form onSubmit={assignBeneficiaryToCipEncadrant} className="form-grid compact-form">
                    <select value={assignForm.beneficiaryId} onChange={(e) => setAssignForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}>
                      <option value="">Sélectionner un bénéficiaire</option>
                      {beneficiaires.map((item) => (
                        <option key={item.id} value={item.id}>{item.nom} {item.prenom}</option>
                      ))}
                    </select>
                    <div>
                      <label style={{fontSize: "13px", color: "#64748b", marginBottom: "6px", display: "block"}}>CIP assignés</label>
                      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "8px", border: "1px solid #e0e7ff", borderRadius: "8px"}}>
                        {allProfessionalOptions.filter((u) => u.role === "CIP").map((cip) => (
                          <label key={cip.id} style={{display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"}}>
                            <input type="checkbox" checked={assignForm.cipIds.includes(cip.id)} onChange={(e) => setAssignForm((prev) => ({ ...prev, cipIds: e.target.checked ? [...prev.cipIds, cip.id] : prev.cipIds.filter((id) => id !== cip.id) }))} />
                            <span style={{fontSize: "12px"}}>{cip.nom}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{fontSize: "13px", color: "#64748b", marginBottom: "6px", display: "block"}}>Encadrants techniques assignés</label>
                      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "8px", border: "1px solid #e0e7ff", borderRadius: "8px"}}>
                        {allProfessionalOptions.filter((u) => u.role === "Encadrant Technique").map((encadrant) => (
                          <label key={encadrant.id} style={{display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"}}>
                            <input type="checkbox" checked={assignForm.encadrantIds.includes(encadrant.id)} onChange={(e) => setAssignForm((prev) => ({ ...prev, encadrantIds: e.target.checked ? [...prev.encadrantIds, encadrant.id] : prev.encadrantIds.filter((id) => id !== encadrant.id) }))} />
                            <span style={{fontSize: "12px"}}>{encadrant.nom}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Assigner le bénéficiaire</button>
                  </form>
                </div>

                <div className="card">
                  <h3>Assignations</h3>
                  <div className="list">
                    {beneficiaires.length ? beneficiaires.map((beneficiary) => {
                      const assignment = beneficiaryAssignments[beneficiary.id];
                      return (
                        <div key={beneficiary.id} className="list-row">
                          <div>
                            <strong>{beneficiary.nom} {beneficiary.prenom}</strong>
                            {assignment ? (
                              <>
                                <p><strong>CIP :</strong> {assignment.cipIds.map((id) => allProfessionalOptions.find((u) => u.id === id)?.nom).filter(Boolean).join(", ") || "Aucun"}</p>
                                <p><strong>Encadrants :</strong> {assignment.encadrantIds.map((id) => allProfessionalOptions.find((u) => u.id === id)?.nom).filter(Boolean).join(", ") || "Aucun"}</p>
                                <small className="muted">Assigné par {assignment.assignedBy}</small>
                              </>
                            ) : (
                              <p className="muted">Non assigné</p>
                            )}
                          </div>
                          <button className="btn btn-light" style={{padding: "8px 12px", fontSize: "12px"}} onClick={() => generateInvitationLink(beneficiary.id)}>🔗 Lien</button>
                        </div>
                      );
                    }) : <p className="muted">Aucun bénéficiaire.</p>}
                  </div>
                </div>
              </div>
            ) : null}

            {secretariatTab === 'documents_salaries' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>📄 Importer des documents salarié</h3>
                  <p className="muted" style={{ marginBottom: 12 }}>
                    Choisissez un bénéficiaire puis chargez un ou plusieurs documents PDF ou Word
                    (contrats CDDI, pièces d'identité, justificatifs, etc.).
                  </p>
                  <div className="form-grid compact-form" style={{ marginBottom: 16 }}>
                    <select
                      value={salarieDocBeneficiaryId}
                      onChange={(e) => setSalarieDocBeneficiaryId(e.target.value)}
                    >
                      <option value="">Sélectionner un bénéficiaire</option>
                      {beneficiaires.map((item) => (
                        <option key={item.id} value={item.id}>{item.nom} {item.prenom}</option>
                      ))}
                    </select>
                    <select
                      value={salarieDocCategory}
                      onChange={(e) => setSalarieDocCategory(e.target.value)}
                    >
                      <option value="contrat">Contrat</option>
                      <option value="identite">Pièce d'identité</option>
                      <option value="justificatif">Justificatif</option>
                      <option value="cv">CV</option>
                      <option value="diplome">Diplôme / attestation</option>
                      <option value="autre">Autre</option>
                    </select>
                    <label
                      className="file-field"
                      style={{ opacity: salarieDocBeneficiaryId ? 1 : 0.5, pointerEvents: salarieDocBeneficiaryId ? 'auto' : 'none' }}
                    >
                      <Paperclip size={16} />
                      {salarieDocUploading ? 'Import en cours…' : 'Choisir un ou plusieurs fichiers (PDF, Word)'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        multiple
                        disabled={!salarieDocBeneficiaryId || salarieDocUploading}
                        onChange={(e) => {
                          handleUploadSalarieDocument(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="card">
                  <h3>Documents du bénéficiaire</h3>
                  {salarieDocBeneficiaryId ? (
                    <div className="list">
                      {salarieDocList.length ? salarieDocList.map((docItem) => (
                        <div key={docItem.id} className="list-row">
                          <div>
                            <strong>{docItem.title || docItem.fileName}</strong>
                            <p>
                              <span className="badge" style={{ marginRight: 6 }}>{docItem.category || 'autre'}</span>
                              {docItem.authorName ? `Importé par ${docItem.authorName} · ` : ''}
                              {docItem.uploadedAt ? new Date(docItem.uploadedAt).toLocaleString('fr-FR') : ''}
                              {docItem.sizeBytes ? ` · ${(docItem.sizeBytes / 1024 / 1024).toFixed(1)} Mo` : ''}
                            </p>
                          </div>
                          <div className="row-actions">
                            <a
                              href={docItem.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-link"
                            >
                              <FileText size={15} /> Ouvrir
                            </a>
                            <button
                              className="btn btn-light"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => handleDeleteSalarieDocument(docItem)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )) : <p className="muted">Aucun document importé pour ce bénéficiaire.</p>}
                    </div>
                  ) : (
                    <p className="muted">Sélectionnez un bénéficiaire pour voir ses documents.</p>
                  )}
                </div>
              </div>
            ) : null}

            {secretariatTab === 'factures' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Créer une facture</h3>
                  <form onSubmit={createInvoice} className="form-grid compact-form">
                    <select value={invoiceForm.beneficiaryId} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}>
                      <option value="">Sélectionner un bénéficiaire</option>
                      {beneficiaires.map((item) => (
                        <option key={item.id} value={item.id}>{item.nom} {item.prenom}</option>
                      ))}
                    </select>
                    <input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Montant (€)" step="0.01" />
                    <input type="date" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} />
                    <textarea value={invoiceForm.description} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description de la facture" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Créer la facture</button>
                  </form>
                </div>

                <div className="card">
                  <h3>Factures</h3>
                  <div className="tracking-table-wrap">
                    <table className="tracking-table" style={{fontSize: "13px"}}>
                      <thead>
                        <tr>
                          <th>Bénéficiaire</th>
                          <th>Montant</th>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoices[currentStructureId] || []).length ? (invoices[currentStructureId] || []).map((invoice) => (
                          <tr key={invoice.id}>
                            <td>{invoice.beneficiaryName}</td>
                            <td><strong>{invoice.amount.toFixed(2)} €</strong></td>
                            <td>{new Date(invoice.invoiceDate).toLocaleDateString("fr-FR")}</td>
                            <td style={{fontSize: "12px", maxWidth: "200px"}}>{invoice.description || "—"}</td>
                            <td><span className="badge">{invoice.status}</span></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="muted">Aucune facture créée.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}


        {activeTab === 'rh' ? (
          <section className="stack">
            <div className="page-head"><h1>RH</h1><p>Contrats, absences, salariés, visites médicales, incidents et pointage.</p></div>
            <div className="subtabs-wrap">
              <button className={rhTab === 'employees' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('employees')}>Salariés</button>
              <button className={rhTab === 'contracts' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('contracts')}>Contrats</button>
              <button className={rhTab === 'absences' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('absences')}>Absences</button>
              <button className={rhTab === 'medical' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('medical')}>Visites médicales</button>
              <button className={rhTab === 'incidents' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('incidents')}>Incidents</button>
              <button className={rhTab === 'timesheet' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('timesheet')}>Pointage</button>
              <button className={rhTab === 'deadlines' ? 'subtab active' : 'subtab'} onClick={() => setRhTab('deadlines')}>Échéances & exports</button>
            </div>

            {rhTab === 'employees' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Ajouter un salarié</h3>
                  <form onSubmit={addRhEmployee} className="form-grid compact-form">
                    <select value={rhEmployeeForm.beneficiaryId} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, beneficiaryId: e.target.value }))}>
                      <option value="">Lier à un bénéficiaire (optionnel)</option>
                      {beneficiaires.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}
                    </select>
                    <input value={rhEmployeeForm.fullName} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="Nom complet" />
                    <input value={rhEmployeeForm.email} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                    <input value={rhEmployeeForm.phone} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Téléphone" />
                    <input value={rhEmployeeForm.poste} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, poste: e.target.value }))} placeholder="Poste" />
                    <input value={rhEmployeeForm.service} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, service: e.target.value }))} placeholder="Service" />
                    <select value={rhEmployeeForm.statut} onChange={(e) => setRhEmployeeForm((prev) => ({ ...prev, statut: e.target.value }))}>
                      <option value="Actif">Actif</option><option value="Sorti">Sorti</option><option value="Suspendu">Suspendu</option>
                    </select>
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Ajouter le salarié</button>
                  </form>
                </div>
                <div className="card">
                  <div className="section-inline"><h3>Salariés</h3><button className="btn btn-light" type="button" onClick={() => exportRhCsv('employees')}><Table2 size={16} /> Export CSV</button></div>
                  <div className="list">{currentEmployees.length ? currentEmployees.map((item) => (
                    <div key={item.id} className="list-row align-start">
                      <div><strong>{item.fullName}</strong><p>{item.poste || 'Sans poste'} · {item.service || 'Sans service'}</p><small>{item.email || 'Sans email'} {item.phone ? `· ${item.phone}` : ''}</small></div>
                      <div className="row-actions"><span className="badge">{item.statut}</span><button className="btn btn-danger" type="button" onClick={() => removeRhItem('employees', item.id)}><Trash2 size={16} /></button></div>
                    </div>
                  )) : <p className="muted">Aucun salarié RH enregistré.</p>}</div>
                </div>
              </div>
            ) : null}

            {rhTab === 'contracts' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Contrat RH</h3>
                  <form onSubmit={addRhContract} className="form-grid compact-form">
                    <select value={rhContractForm.employeeId} onChange={(e) => setRhContractForm((prev) => ({ ...prev, employeeId: e.target.value }))}>
                      <option value="">Salarié</option>
                      {currentEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                    </select>
                    <input value={rhContractForm.employeeName} onChange={(e) => setRhContractForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <input value={rhContractForm.contractType} onChange={(e) => setRhContractForm((prev) => ({ ...prev, contractType: e.target.value }))} placeholder="Type de contrat" />
                    <input type="date" value={rhContractForm.startDate} onChange={(e) => setRhContractForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                    <input type="date" value={rhContractForm.endDate} onChange={(e) => setRhContractForm((prev) => ({ ...prev, endDate: e.target.value }))} />
                    <input type="date" value={rhContractForm.renewalDate} onChange={(e) => setRhContractForm((prev) => ({ ...prev, renewalDate: e.target.value }))} />
                    <input value={rhContractForm.weeklyHours} onChange={(e) => setRhContractForm((prev) => ({ ...prev, weeklyHours: e.target.value }))} placeholder="Durée hebdo" />
                    <select value={rhContractForm.status} onChange={(e) => setRhContractForm((prev) => ({ ...prev, status: e.target.value }))}><option value="Actif">Actif</option><option value="À renouveler">À renouveler</option><option value="Clos">Clos</option></select>
                    <textarea value={rhContractForm.notes} onChange={(e) => setRhContractForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes RH" rows="3" />
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer le contrat</button>
                  </form>
                </div>
                <div className="card">
                  <div className="section-inline"><h3>Contrats RH</h3><button className="btn btn-light" type="button" onClick={() => exportRhCsv('contracts')}><Table2 size={16} /> Export CSV</button></div>
                  <div className="list">{currentRhContracts.length ? currentRhContracts.map((item) => (
                    <div key={item.id} className="list-row align-start">
                      <div><strong>{item.employeeName}</strong><p>{item.contractType} · {item.startDate || '—'} → {item.endDate || '—'}</p><small>Renouvellement : {item.renewalDate || 'non défini'} · {item.weeklyHours || ''}</small></div>
                      <div className="row-actions"><span className={contractsToRenew.some((entry) => entry.id === item.id) ? 'badge warn-badge' : 'badge'}>{item.status}</span><button className="btn btn-danger" type="button" onClick={() => removeRhItem('contracts', item.id)}><Trash2 size={16} /></button></div>
                    </div>
                  )) : <p className="muted">Aucun contrat RH.</p>}</div>
                </div>
              </div>
            ) : null}

            {rhTab === 'absences' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Absence / retard / congé</h3>
                  <form onSubmit={addRhAbsence} className="form-grid compact-form">
                    <select value={absenceForm.employeeId} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, employeeId: e.target.value }))}><option value="">Salarié</option>{currentEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
                    <input value={absenceForm.employeeName} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                      <input type="date" value={absenceForm.dateDebut} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, dateDebut: e.target.value }))} placeholder="Du" />
                      <input type="date" value={absenceForm.dateFin} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, dateFin: e.target.value }))} placeholder="Au" />
                    </div>
                    <select value={absenceForm.type} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, type: e.target.value }))}><option value="Absence">Absence</option><option value="Retard">Retard</option><option value="Congé">Congé</option><option value="Maladie">Maladie</option></select>
                    <input value={absenceForm.reason} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Motif" />
                    <label className="checkbox-row"><input type="checkbox" checked={Boolean(absenceForm.justified)} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, justified: e.target.checked }))} /><span>Justificatif reçu</span></label>
                    <textarea value={absenceForm.comments} onChange={(e) => setAbsenceForm((prev) => ({ ...prev, comments: e.target.value }))} placeholder="Commentaire" rows="3" />
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Enregistrer</button>
                  </form>
                </div>
                <div className="card">
                  <div className="section-inline"><h3>Absences récentes</h3><button className="btn btn-light" type="button" onClick={() => exportRhCsv('absences')}><Table2 size={16} /> Export CSV</button></div>
                  <div className="list">{currentAbsences.length ? currentAbsences.map((item) => (
                    <div key={item.id} className="list-row align-start"><div><strong>{item.employeeName}</strong><p>{item.type} · du {new Date(item.dateDebut).toLocaleDateString("fr-FR")} au {new Date(item.dateFin).toLocaleDateString("fr-FR")}</p><small>{item.reason || 'Sans motif'} · {item.justified ? 'Justifié' : 'Non justifié'}</small></div><div className="row-actions"><button className="btn btn-danger" type="button" onClick={() => removeRhItem('absences', item.id)}><Trash2 size={16} /></button></div></div>
                  )) : <p className="muted">Aucune absence enregistrée.</p>}</div>
                </div>
              </div>
            ) : null}

            {rhTab === 'medical' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Visite médicale</h3>
                  <form onSubmit={addRhMedicalVisit} className="form-grid compact-form">
                    <select value={medicalForm.employeeId} onChange={(e) => setMedicalForm((prev) => ({ ...prev, employeeId: e.target.value }))}><option value="">Salarié</option>{currentEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
                    <input value={medicalForm.employeeName} onChange={(e) => setMedicalForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <input type="date" value={medicalForm.visitDate} onChange={(e) => setMedicalForm((prev) => ({ ...prev, visitDate: e.target.value }))} />
                    <input value={medicalForm.visitType} onChange={(e) => setMedicalForm((prev) => ({ ...prev, visitType: e.target.value }))} placeholder="Type de visite" />
                    <input type="date" value={medicalForm.nextVisitDate} onChange={(e) => setMedicalForm((prev) => ({ ...prev, nextVisitDate: e.target.value }))} />
                    <select value={medicalForm.status} onChange={(e) => setMedicalForm((prev) => ({ ...prev, status: e.target.value }))}><option value="À planifier">À planifier</option><option value="Prévue">Prévue</option><option value="Réalisée">Réalisée</option></select>
                    <textarea value={medicalForm.notes} onChange={(e) => setMedicalForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Observations" rows="3" />
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer la visite</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Suivi des visites</h3>
                  <div className="list">{currentMedicalVisits.length ? currentMedicalVisits.map((item) => (
                    <div key={item.id} className="list-row align-start"><div><strong>{item.employeeName}</strong><p>{item.visitType} · {item.visitDate}</p><small>Prochaine visite : {item.nextVisitDate || 'non définie'} · {item.status}</small></div><div className="row-actions"><button className="btn btn-danger" type="button" onClick={() => removeRhItem('medicalVisits', item.id)}><Trash2 size={16} /></button></div></div>
                  )) : <p className="muted">Aucune visite médicale enregistrée.</p>}</div>
                </div>
              </div>
            ) : null}

            {rhTab === 'incidents' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Incident / avertissement</h3>
                  <form onSubmit={addRhIncident} className="form-grid compact-form">
                    <select value={incidentForm.employeeId} onChange={(e) => setIncidentForm((prev) => ({ ...prev, employeeId: e.target.value }))}><option value="">Salarié</option>{currentEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
                    <input value={incidentForm.employeeName} onChange={(e) => setIncidentForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <input type="date" value={incidentForm.date} onChange={(e) => setIncidentForm((prev) => ({ ...prev, date: e.target.value }))} />
                    <select value={incidentForm.severity} onChange={(e) => setIncidentForm((prev) => ({ ...prev, severity: e.target.value }))}><option value="Information">Information</option><option value="Mineur">Mineur</option><option value="Majeur">Majeur</option></select>
                    <input value={incidentForm.category} onChange={(e) => setIncidentForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Catégorie" />
                    <textarea value={incidentForm.description} onChange={(e) => setIncidentForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" rows="3" />
                    <textarea value={incidentForm.followUp} onChange={(e) => setIncidentForm((prev) => ({ ...prev, followUp: e.target.value }))} placeholder="Suite donnée" rows="3" />
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer l'incident</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Incidents & avertissements</h3>
                  <div className="list">{currentIncidents.length ? currentIncidents.map((item) => (
                    <div key={item.id} className="list-row align-start"><div><strong>{item.employeeName}</strong><p>{item.category} · {item.date}</p><small>{item.severity} · {item.description}</small></div><div className="row-actions"><button className="btn btn-danger" type="button" onClick={() => removeRhItem('incidents', item.id)}><Trash2 size={16} /></button></div></div>
                  )) : <p className="muted">Aucun incident RH.</p>}</div>
                </div>
              </div>
            ) : null}

            {rhTab === 'timesheet' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <h3>Pointage</h3>
                  <form onSubmit={addRhTimeEntry} className="form-grid compact-form">
                    <select value={timeEntryForm.employeeId} onChange={(e) => setTimeEntryForm((prev) => ({ ...prev, employeeId: e.target.value }))}><option value="">Salarié</option>{currentEmployees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
                    <input value={timeEntryForm.employeeName} onChange={(e) => setTimeEntryForm((prev) => ({ ...prev, employeeName: e.target.value }))} placeholder="Nom du salarié" />
                    <input type="date" value={timeEntryForm.date} onChange={(e) => setTimeEntryForm((prev) => ({ ...prev, date: e.target.value }))} />
                    <input value={timeEntryForm.hours} onChange={(e) => setTimeEntryForm((prev) => ({ ...prev, hours: e.target.value }))} placeholder="Heures" />
                    <select value={timeEntryForm.status} onChange={(e) => setTimeEntryForm((prev) => ({ ...prev, status: e.target.value }))}><option value="Présent">Présent</option><option value="Absent">Absent</option><option value="Télétravail">Télétravail</option><option value="Formation">Formation</option></select>
                    <textarea value={timeEntryForm.notes} onChange={(e) => setTimeEntryForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows="3" />
                    <button className="btn btn-primary" type="submit"><Save size={16} /> Enregistrer le pointage</button>
                  </form>
                </div>
                <div className="card">
                  <h3>Pointages récents</h3>
                  <div className="list">{currentTimeEntries.length ? currentTimeEntries.map((item) => (
                    <div key={item.id} className="list-row align-start"><div><strong>{item.employeeName}</strong><p>{item.date} · {item.hours} h</p><small>{item.status}</small></div><div className="row-actions"><button className="btn btn-danger" type="button" onClick={() => removeRhItem('timeEntries', item.id)}><Trash2 size={16} /></button></div></div>
                  )) : <p className="muted">Aucun pointage enregistré.</p>}</div>
                </div>
              </div>
            ) : null}

            {rhTab === 'deadlines' ? (
              <div className="two-columns tracking-layout">
                <div className="card">
                  <div className="section-inline"><h3>Échéances RH</h3><span className="badge warn-badge">{rhAlerts.length}</span></div>
                  <div className="list">{rhAlerts.length ? rhAlerts.map((alert) => (
                    <div key={alert.id} className="list-row"><div><strong>{alert.kind}</strong><p>{alert.label}</p></div><span className="badge warn-badge">À traiter</span></div>
                  )) : <p className="muted">Aucune alerte RH.</p>}</div>
                </div>
                <div className="card">
                  <h3>Exports RH</h3>
                  <div className="stack-actions">
                    <button className="btn btn-light" type="button" onClick={() => exportRhCsv('employees')}><Table2 size={16} /> Export salariés</button>
                    <button className="btn btn-light" type="button" onClick={() => exportRhCsv('contracts')}><Table2 size={16} /> Export contrats</button>
                    <button className="btn btn-light" type="button" onClick={() => exportRhCsv('absences')}><Table2 size={16} /> Export absences</button>
                  </div>
                  <p className="muted mt-12">Pense à vérifier les renouvellements, les absences non justifiées et les visites médicales à planifier.</p>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'structure' ? (
          <section className="stack">
            <div className="page-head"><h1>Ma structure</h1></div>
            <div className="card">
              <h3>Informations</h3>
              <p><strong>Nom :</strong> {currentStructure?.nom}</p>
              <p><strong>Type :</strong> {currentStructure?.type}</p>
              <p><strong>Email :</strong> {currentStructure?.email || 'Non renseigné'}</p>
            </div>
            <div className="two-columns">
              <div className="card">
                <h3>Déléguer mes accès</h3>
                <p className="muted">En cas de vacances, arrêt maladie ou congé : déléguer temporairement vos accès à un collègue.</p>
                <form onSubmit={createDelegatedAccess} className="form-grid compact-form">
                  <select value={delegatedAccessForm.fromUserId} onChange={(e) => setDelegatedAccessForm((prev) => ({ ...prev, fromUserId: e.target.value }))}>
                    <option value="">Votre nom (accès à déléguer)</option>
                    {allProfessionalOptions.map((user) => (
                      <option key={user.id} value={user.id}>{user.nom} ({user.role})</option>
                    ))}
                  </select>
                  <select value={delegatedAccessForm.toUserId} onChange={(e) => setDelegatedAccessForm((prev) => ({ ...prev, toUserId: e.target.value }))}>
                    <option value="">Déléguer à</option>
                    {allProfessionalOptions.map((user) => (
                      <option key={user.id} value={user.id}>{user.nom} ({user.role})</option>
                    ))}
                  </select>
                  <input type="date" value={delegatedAccessForm.endDate} onChange={(e) => setDelegatedAccessForm((prev) => ({ ...prev, endDate: e.target.value }))} placeholder="Jusqu'à (date)" />
                  <button className="btn btn-primary" type="submit"><Plus size={16} /> Déléguer</button>
                </form>
              </div>

              <div className="card">
                <h3>Accès actuellement délégués</h3>
                <div className="list">
                  {Object.values(delegatedAccesses || {}).filter((d) => d.active).length ? (
                    Object.entries(delegatedAccesses || {}).map(([fromId, delegation]) => (
                      delegation.active && (
                        <div key={fromId} className="list-row">
                          <div>
                            <strong>{delegation.fromUserName}</strong>
                            <p>→ {delegation.toUserName}</p>
                            <small className="muted">Jusqu'au {new Date(delegation.endDate).toLocaleDateString("fr-FR")}</small>
                          </div>
                          <span className="badge success-badge">Actif</span>
                        </div>
                      )
                    ))
                  ) : (
                    <p className="muted">Aucun accès délégué actuellement.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {showImportModal && (
        <ImportBeneficiaires
          currentStructureId={currentStructureId}
          onImportComplete={handleImportBeneficiaries}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}

export default App;
