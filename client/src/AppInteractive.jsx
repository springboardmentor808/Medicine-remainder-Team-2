import { createContext, useContext, useEffect, useState, useMemo, lazy, Suspense } from 'react';
import OcrReviewPanel from './OcrReviewPanel';
import { mockPatients } from './mock/caregiverMock.js';
const AdherencePanel = lazy(() => import('./components/ui/AdherencePanel.jsx'));
const RefillPanel = lazy(() => import('./components/ui/RefillPanel.jsx'));
const History = lazy(() => import('./pages/patient/History.jsx'));
const PatientAnalyticsDashboard = lazy(() => import('./components/patient/PatientAnalyticsDashboard.jsx'));
const CaregiverMonitoringDashboard = lazy(() => import('./components/caregiver/CaregiverMonitoringDashboard.jsx'));
import { CalendarHeatmap } from './components/ui/CalendarHeatmap.jsx';

const API = 'http://localhost:4000/api';
async function api(path, options = {}) {
  const form = options.body instanceof FormData;
  const response = await fetch(API + path, { credentials: 'include', ...options, headers: { ...(form ? {} : { 'Content-Type': 'application/json' }), ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Please try again.');
  return data;
}

const translations = {
  en: {
    brand: "pill",
    sync: "sync",
    space: "Your care space",
    how_use: "How will you use PillSync?",
    role_sub: "Choose a space to continue to a calmer medicine routine.",
    patient_login: "Patient Login",
    patient_desc: "Manage medicines and daily rhythm",
    caregiver_login: "Caregiver Login",
    caregiver_desc: "Care for your connected people",
    
    auth_back: "← Choose another space",
    auth_patient_title: "Your daily rhythm",
    auth_caregiver_title: "Your care circle",
    auth_main_headline: "Care that keeps pace with you.",
    auth_subheadline: "Simple medicine routines for patients and the people who look out for them.",
    signup_role_prefix: "Join as a ",
    login_role_prefix: " login",
    create_space: "Create your care space",
    welcome_back: "Welcome back",
    signup_sub: "Keep your routine close and clear.",
    login_sub: "Use your email or phone number.",
    
    label_name: "Full name",
    label_phone: "Phone number",
    label_email: "Email address",
    label_login: "Email or phone number",
    label_password: "Password",
    btn_signup: "Create account",
    btn_login: "Enter dashboard",
    already_reg: "Already registered?",
    new_pillsync: "New to PillSync?",
    signin: "Sign in",
    create_acct: "Create an account",
    
    nav_overview: "Overview",
    nav_medicines: "My medicines",
    nav_scan: "Scan prescription",
    nav_history: "History & reports",
    nav_patients: "Patients",
    nav_alerts: "Alerts & reports",
    nav_settings: "Settings",
    nav_signout: "Sign out",
    
    header_title: "PillSync care space",
    good_morning: "Good morning, ",
    calm_view: "A calm view of your medicine rhythm today.",
    cabinet_title: "Medicine cabinet",
    today_meds: "Today's medicines",
    metric_progress: "Today's progress",
    metric_adherence: "Adherence",
    metric_streak: "Current streak",
    unit_doses: "doses",
    unit_week: "this week",
    unit_days: "days",
    unit_active: "active",
    
    btn_scan: "Scan prescription",
    btn_add: "+ Add medicine",
    
    taken: "Taken ✓",
    missed: "Missed",
    snooze: "Snooze",
    
    no_meds: "No medicines added yet",
    start_here: "Start here",
    
    ocr_panel_title: "Local Ollama OCR",
    ocr_review: "Review prescription",
    ocr_disclaimer: "Your image stays on this computer and is reviewed before saving.",
    ocr_label: "Prescription image",
    ocr_reading: "Reading with local Ollama. This can take a moment...",
    ocr_read_btn: "Read image",
    ocr_loaded: "OCR Results Loaded",
    ocr_loaded_sub: "Please review and edit the fields below if any information is missing or incorrect.",
    ocr_med_name: "Medicine name",
    ocr_dosage: "Dosage / Strength",
    ocr_freq: "Frequency (from OCR)",
    ocr_time: "Confirmed reminder time",
    ocr_slot: "Part of day",
    ocr_confirm_btn: "Confirm and add",
    ocr_save_notice: "Confirming saves the medicine and triggers caregiver updates.",
    
    add_modal_title: "New routine",
    add_modal_header: "Add a medicine",
    add_modal_search: "Search medicine...",
    add_modal_dose: "Dose",
    add_modal_time: "Reminder time",
    add_modal_slot: "Part of day",
    add_modal_save: "Save medicine",
    slot_morning: "Morning",
    slot_afternoon: "Afternoon",
    slot_night: "Night",
    
    detail_title: "Medicine details",
    detail_dosage: "Dosage & Timing",
    detail_comp: "Composition",
    detail_mfg: "Manufacturer",
    detail_uses: "Uses / Treatment",
    detail_side_effects: "Potential Side Effects",
    detail_close: "Close details",
    
    cg_everyone: "Everyone, at a glance.",
    cg_sub: "A steady view of the people you care for.",
    cg_banner_title: "Care circle",
    cg_banner_patients: " connected patients",
    cg_banner_patient: " connected patient",
    cg_banner_desc: "View-only monitoring for your linked patients.",
    cg_link_title: "Link a patient",
    cg_link_sub: "Ask the patient for their PS code.",
    cg_connect: "Connect",
    cg_alert_title: "Alerts & reports.",
    cg_alert_sub: "Recent updates from your linked patients.",
    cg_alert_empty: "No alerts yet. Your care circle is quiet.",
    cg_settings_level: "Access level: ",
    cg_settings_view: "View only"
  },
  hi: {
    brand: "पिल",
    sync: "सिंक",
    space: "आपका देखभाल क्षेत्र",
    how_use: "आप पिलसिंक का उपयोग कैसे करेंगे?",
    role_sub: "दवा की दिनचर्या को शांत और आसान बनाने के लिए आगे बढ़ें।",
    patient_login: "मरीज लॉगिन",
    patient_desc: "अपनी दवाएं और दैनिक दिनचर्या संभालें",
    caregiver_login: "केयरगिवर लॉगिन",
    caregiver_desc: "अपने जुड़े हुए लोगों की देखभाल करें",
    
    auth_back: "← दूसरा विकल्प चुनें",
    auth_patient_title: "आपका दैनिक चक्र",
    auth_caregiver_title: "आपका देखभाल चक्र",
    auth_main_headline: "देखभाल जो आपकी गति से चले।",
    auth_subheadline: "मरीजों और उनकी देखभाल करने वालों के लिए आसान दवा प्रबंधन प्रणाली।",
    signup_role_prefix: "बनाएं ",
    login_role_prefix: " लॉगिन",
    create_space: "अपना देखभाल क्षेत्र बनाएं",
    welcome_back: "आपका स्वागत है",
    signup_sub: "अपनी दिनचर्या को करीब और स्पष्ट रखें।",
    login_sub: "अपना ईमेल या फोन नंबर उपयोग करें।",
    
    label_name: "पूरा नाम",
    label_phone: "फोन नंबर",
    label_email: "ईमेल पता",
    label_login: "ईमेल या फोन नंबर",
    label_password: "पासवर्ड",
    btn_signup: "खाता बनाएं",
    btn_login: "डैशबोर्ड में प्रवेश करें",
    already_reg: "पहले से पंजीकृत हैं?",
    new_pillsync: "पिलसिंक पर नए हैं?",
    signin: "लॉगिन करें",
    create_acct: "नया खाता बनाएं",
    
    nav_overview: "विवरण",
    nav_medicines: "मेरी दवाएं",
    nav_scan: "पर्चा स्कैन करें",
    nav_history: "इतिहास और रिपोर्ट",
    nav_patients: "मरीज",
    nav_alerts: "अलर्ट और रिपोर्ट",
    nav_settings: "सेटिंग्स",
    nav_signout: "साइन आउट",
    
    header_title: "पिलसिंक देखभाल क्षेत्र",
    good_morning: "सुप्रभात, ",
    calm_view: "आज आपकी दवा दिनचर्या का एक स्पष्ट दृश्य।",
    cabinet_title: "दवा की अलमारी",
    today_meds: "आज की दवाएं",
    metric_progress: "आज की प्रगति",
    metric_adherence: "अनुपालन",
    metric_streak: "दैनिक क्रम",
    unit_doses: "दवाएं",
    unit_week: "इस सप्ताह",
    unit_days: "दिन",
    unit_active: "सक्रिय",
    
    btn_scan: "पर्चा स्कैन करें",
    btn_add: "+ दवा जोड़ें",
    
    taken: "ली गई ✓",
    missed: "छूट गई",
    snooze: "सूंज (स्थगित)",
    
    no_meds: "अभी तक कोई दवा नहीं जोड़ी गई है",
    start_here: "यहाँ से शुरू करें",
    
    ocr_panel_title: "लोकल ओल्लामा ओसीआर",
    ocr_review: "पर्चे की समीक्षा",
    ocr_disclaimer: "आपकी छवि इसी कंप्यूटर पर रहती है और सहेजने से पहले समीक्षा की जाती है।",
    ocr_label: "पर्चे की तस्वीर",
    ocr_reading: "लोकल ओल्लामा से पढ़ रहा है। इसमें कुछ समय लग सकता है...",
    ocr_read_btn: "तस्वीर पढ़ें",
    ocr_loaded: "ओसीआर परिणाम लोड हुआ",
    ocr_loaded_sub: "यदि कोई जानकारी गायब या गलत है तो कृपया नीचे दिए गए फ़ील्ड की समीक्षा करें और बदलें।",
    ocr_med_name: "दवा का नाम",
    ocr_dosage: "खुराक / शक्ति",
    ocr_freq: "आवृत्ति (ओसीआर से)",
    ocr_time: "पुष्टि किया गया समय",
    ocr_slot: "दिन का भाग",
    ocr_confirm_btn: "पुष्टि करें और जोड़ें",
    ocr_save_notice: "पुष्टि करने से दवा सहेज ली जाती है और केयरगिवर को जानकारी मिलती है।",
    
    add_modal_title: "नई दिनचर्या",
    add_modal_header: "दवा जोड़ें",
    add_modal_search: "दवा खोजें...",
    add_modal_dose: "खुराक",
    add_modal_time: "रिमाइंडर समय",
    add_modal_slot: "दिन का भाग",
    add_modal_save: "दवा सहेजें",
    slot_morning: "सुबह",
    slot_afternoon: "दोपहर",
    slot_night: "रात",
    
    detail_title: "दवा का विवरण",
    detail_dosage: "खुराक और समय",
    detail_comp: "संयोजन (कम्पोजीशन)",
    detail_mfg: "निर्माता",
    detail_uses: "उपयोग / उपचार",
    detail_side_effects: "संभावित दुष्प्रभाव",
    detail_close: "विवरण बंद करें",
    
    cg_everyone: "सभी मरीज, एक नज़र में।",
    cg_sub: "आपके देखभाल के लोगों का एक स्थिर दृश्य।",
    cg_banner_title: "देखभाल चक्र",
    cg_banner_patients: " जुड़े हुए मरीज",
    cg_banner_patient: " जुड़ा हुआ मरीज",
    cg_banner_desc: "आपके जुड़े हुए मरीजों की केवल-देखने वाली निगरानी।",
    cg_link_title: "मरीज को जोड़ें",
    cg_link_sub: "मरीज से उनका PS कोड मांगें।",
    cg_connect: "जोड़ें",
    cg_alert_title: "अलर्ट और रिपोर्ट।",
    cg_alert_sub: "आपके जुड़े मरीजों से हालिया अपडेट।",
    cg_alert_empty: "अभी तक कोई अलर्ट नहीं है। आपका देखभाल क्षेत्र शांत है।",
    cg_settings_level: "पहुंच स्तर: ",
    cg_settings_view: "केवल देखने के लिए"
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localStorage.getItem('locale') || 'en');
  const setLocale = (lang) => {
    localStorage.setItem('locale', lang);
    setLocaleState(lang);
  };
  const t = (key) => {
    return translations[locale]?.[key] || translations['en']?.[key] || key;
  };
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function LocaleSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="locale-switcher" style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
      <button 
        type="button" 
        onClick={() => setLocale('en')} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: locale === 'en' ? '#2c7a59' : '#7a837d', 
          fontWeight: locale === 'en' ? '700' : '400', 
          cursor: 'pointer',
          padding: '2px 6px'
        }}
      >
        EN
      </button>
      <span style={{ color: '#e2e8e1' }}>|</span>
      <button 
        type="button" 
        onClick={() => setLocale('hi')} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: locale === 'hi' ? '#2c7a59' : '#7a837d', 
          fontWeight: locale === 'hi' ? '700' : '400', 
          cursor: 'pointer',
          padding: '2px 6px'
        }}
      >
        हिंदी
      </button>
    </div>
  );
}

function RoleChooser({ onChoose }) {
  const { t } = useLanguage();
  return (
    <main className="role-landing">
      <div className="role-brand" style={{ display: 'flex', justifyContent: 'space-between', width: '88vw', alignItems: 'center' }}>
        <div><span className="brand-mark">+</span> {t('brand')}<span>{t('sync')}</span></div>
        <LocaleSwitcher />
      </div>
      <section className="role-card">
        <p className="eyebrow">{t('space')}</p>
        <h1>{t('how_use')}</h1>
        <p className="muted">{t('role_sub')}</p>
        <div className="role-options">
          <button type="button" onClick={() => onChoose('patient')}>
            <span className="role-icon">♡</span>
            <span><strong>{t('patient_login')}</strong><small>{t('patient_desc')}</small></span>
            <b>→</b>
          </button>
          <button type="button" onClick={() => onChoose('caregiver')}>
            <span className="role-icon">♧</span>
            <span><strong>{t('caregiver_login')}</strong><small>{t('caregiver_desc')}</small></span>
            <b>→</b>
          </button>
        </div>
      </section>
    </main>
  );
}

function Auth({ role, back, done }) {
  const { t } = useLanguage();
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', login: '', password: '', role });
  
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  
  async function submit(event) {
    event.preventDefault();
    try {
      const result = await api(`/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      done(result);
    } catch (caught) {
      setError(caught.message);
    }
  }
  
  return (
    <main className="auth-shell">
      <div className="auth-art">
        <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span className="brand-mark">+</span> {t('brand')}<span>{t('sync')}</span></div>
        </div>
        <div className="art-copy">
          <p className="eyebrow">{role === 'patient' ? t('auth_patient_title') : t('auth_caregiver_title')}</p>
          <h1>Care that keeps<br /><em>pace with you.</em></h1>
          <p>{t('auth_subheadline')}</p>
        </div>
      </div>
      <section className="auth-panel" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '7vw' }}>
          <LocaleSwitcher />
        </div>
        
        <div className="auth-form">
          <button className="back-button" onClick={back} style={{ display: 'block', marginBottom: '20px' }}>{t('auth_back')}</button>
          <p className="eyebrow">{signup ? `${t('signup_role_prefix')}${role === 'patient' ? t('patient_login') : t('caregiver_login')}` : `${role === 'patient' ? t('patient_login') : t('caregiver_login')}`}</p>
          <h2>{signup ? t('create_space') : t('welcome_back')}</h2>
          <p className="muted">{signup ? t('signup_sub') : t('login_sub')}</p>
          
          <form onSubmit={submit}>
            {signup && (
              <>
                <label>{t('label_name')}<input required value={form.name} onChange={set('name')} /></label>
                <label>{t('label_phone')}<input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></label>
                <label>{t('label_email')}<input required type="email" value={form.email} onChange={set('email')} /></label>
              </>
            )}
            {!signup && <label>{t('label_login')}<input required value={form.login} onChange={set('login')} /></label>}
            <label>{t('label_password')}<input required minLength="8" type="password" value={form.password} onChange={set('password')} /></label>
            
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button" type="submit">{signup ? t('btn_signup') : t('btn_login')} <span>→</span></button>
          </form>
          
          <p className="switch-copy">
            {signup ? t('already_reg') : t('new_pillsync')}{' '}
            <button onClick={() => { setSignup(!signup); setError(''); }}>{signup ? t('signin') : t('create_acct')}</button>
          </p>
        </div>
      </section>
    </main>
  );
}

function Sidebar({ user, active, setActive, logout }) {
  const { t } = useLanguage();
  const items = user.role === 'patient' 
    ? [['overview', t('nav_overview')], ['medicines', t('nav_medicines')], ['scan', t('nav_scan')], ['analytics', 'Analytics & Charts'], ['refill', 'Refill'], ['history', t('nav_history')]] 
    : [['overview', t('nav_overview')], ['patients', t('nav_patients')], ['monitoring', 'Control Center'], ['alerts', t('nav_alerts')]];
    
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">+</span> {t('brand')}<span>{t('sync')}</span></div>
      <div className="profile-mini">
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold">{user.name.charAt(0).toUpperCase()}</div>
        <div><strong>{user.name}</strong><small>{user.role === 'patient' ? t('patient_login') : t('caregiver_login')}</small></div>
      </div>
      <nav>
        {items.map(([id, label]) => (
          <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
            <span className="nav-icon">{id === 'overview' ? '⌂' : id === 'scan' ? '▣' : id === 'analytics' ? '📈' : id === 'monitoring' ? '🛡' : id === 'alerts' ? '!' : id === 'history' ? '▥' : '◉'}</span>
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button onClick={() => setActive('settings')} className={active === 'settings' ? 'bg-green-50 text-green-800 border-r-4 border-green-600 w-full text-left px-3 py-2 rounded-lg flex items-center gap-2' : 'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-600 hover:bg-slate-50'}><span className="nav-icon">⚙</span>{t('nav_settings')}</button>
        <button className="logout" onClick={logout}>{t('nav_signout')}</button>
      </div>
    </aside>
  );
}

function Header({ title, intro, action }) {
  const { t } = useLanguage();
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{t('header_title')}</p>
        <h1>{title}</h1>
        <p className="muted">{intro}</p>
      </div>
      <div className="header-action" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <LocaleSwitcher />
        {action}
      </div>
    </header>
  );
}

function AddMedicine({ close, saved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', dose: '', schedule: '08:00 AM', slot: 'morning', composition: '', uses: '', sideEffects: '', imageUrl: '', manufacturer: '', formType: 'oral', quantityPerDose: '', specialInstructions: '', initialQuantity: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');

  async function handleNameChange(val) {
    setForm(prev => ({ ...prev, name: val }));
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await api(`/patient/medicines/search?q=${encodeURIComponent(val)}`);
      setSuggestions(data);
    } catch {
      // Ignore query errors during typing
    }
  }

  function selectSuggestion(med) {
    setForm(prev => ({
      ...prev,
      name: med.name,
      composition: med.composition || '',
      uses: med.uses || '',
      sideEffects: med.sideEffects || '',
      imageUrl: med.imageUrl || '',
      manufacturer: med.manufacturer || ''
    }));
    setSuggestions([]);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      await api('/patient/medicines', { method: 'POST', body: JSON.stringify(form) });
      saved();
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="close" type="button" onClick={close}>×</button>
        <p className="eyebrow">{t('add_modal_title')}</p>
        <h3>{t('add_modal_header')}</h3>
        
        <label>{t('ocr_med_name')}
          <div style={{ position: 'relative' }}>
            <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder={t('add_modal_search')} />
            {suggestions.length > 0 && (
              <ul className="suggestions-list" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #e2e8e1',
                borderRadius: '7px',
                margin: '4px 0 0',
                padding: 0,
                listStyle: 'none',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(30,45,36,0.08)',
                maxHeight: '180px',
                overflowY: 'auto'
              }}>
                {suggestions.map((med, index) => (
                  <li key={index} onClick={() => selectSuggestion(med)} style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #e2e8e1' : 'none',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#edf7f0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <strong>{med.name}</strong>
                    {med.manufacturer && <span style={{ color: '#7a837d', fontSize: '11px', display: 'block' }}>{med.manufacturer}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>

        {form.composition && (
          <div style={{
            backgroundColor: '#edf7f0',
            borderRadius: '7px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#2c7a59',
            textAlign: 'left',
            marginTop: '-6px',
            lineHeight: '1.4'
          }}>
            <strong>{t('detail_comp')}:</strong> {form.composition}<br />
            {form.manufacturer && <><strong>{t('detail_mfg')}:</strong> {form.manufacturer}<br /></>}
            {form.uses && <><strong>{t('detail_uses')}:</strong> {form.uses}<br /></>}
            {form.sideEffects && <><strong>{t('detail_side_effects')}:</strong> {form.sideEffects}</>}
          </div>
        )}

        <label>{t('add_modal_dose')}
          <input required value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="e.g. 1 tablet, 500mg" />
        </label>
        <label>Form type
          <select value={form.formType} onChange={(e) => setForm({ ...form, formType: e.target.value })}>
            <option value="oral">Oral</option>
            <option value="topical">Topical</option>
            <option value="liquid">Liquid</option>
            <option value="injection">Injection</option>
          </select>
        </label>
        <label>Quantity per dose (e.g. "1 tablet" or "Thin layer")
          <input required value={form.quantityPerDose} onChange={(e) => setForm({ ...form, quantityPerDose: e.target.value })} placeholder='e.g. "Thin layer" or "5ml"' />
        </label>
        <label>Special instructions
          <input value={form.specialInstructions} onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })} placeholder="e.g. Apply to affected skin area only" />
        </label>
        <label>Condition / Disease Category
          <select value={form.conditionTag || 'Other'} onChange={(e) => setForm({ ...form, conditionTag: e.target.value })}>
            <option value="Blood Pressure">Blood Pressure</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Thyroid">Thyroid</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Vitamins">Vitamins</option>
            <option value="Heart Medications">Heart Medications</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Initial Quantity (total pills in pack)
          <input type="number" min="0" value={form.initialQuantity} onChange={(e) => setForm({ ...form, initialQuantity: e.target.value })} placeholder="e.g. 30 (used for AI refill prediction)" />
        </label>
        <label>{t('add_modal_time')}
          <input required value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
        </label>
        <label>{t('add_modal_slot')}
          <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
            <option value="morning">{t('slot_morning')}</option>
            <option value="afternoon">{t('slot_afternoon')}</option>
            <option value="night">{t('slot_night')}</option>
          </select>
        </label>
        
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button">{t('add_modal_save')} <span>→</span></button>
      </form>
    </div>
  );
}

function EditMedicine({ medicine, close, saved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: medicine.name || '',
    dose: medicine.dose || '',
    schedule: medicine.schedule || '08:00 AM',
    slot: medicine.slot || 'morning',
    conditionTag: medicine.conditionTag || 'Other',
    formType: medicine.formType || 'oral',
    quantityPerDose: medicine.quantityPerDose || '',
    initialQuantity: medicine.initialQuantity != null ? medicine.initialQuantity : '',
    specialInstructions: medicine.specialInstructions || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/patient/medicines/${medicine._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          initialQuantity: form.initialQuantity === '' ? undefined : Number(form.initialQuantity),
        }),
      });
      saved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="close" type="button" onClick={close}>×</button>
        <p className="eyebrow">Modify routine</p>
        <h3>Edit medicine</h3>

        <label>Medicine name
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>Condition / Disease Category
          <select value={form.conditionTag} onChange={e => setForm({ ...form, conditionTag: e.target.value })}>
            <option value="Blood Pressure">Blood Pressure</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Thyroid">Thyroid</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Vitamins">Vitamins</option>
            <option value="Heart Medications">Heart Medications</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Dose
          <input required value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} />
        </label>
        <label>Form type
          <select value={form.formType} onChange={e => setForm({ ...form, formType: e.target.value })}>
            <option value="oral">Oral</option>
            <option value="topical">Topical</option>
            <option value="liquid">Liquid</option>
            <option value="injection">Injection</option>
          </select>
        </label>
        <label>Quantity per dose
          <input value={form.quantityPerDose} onChange={e => setForm({ ...form, quantityPerDose: e.target.value })} />
        </label>
        <label>Current stock / initial quantity (pills)
          <input type="number" min="0" value={form.initialQuantity} onChange={e => setForm({ ...form, initialQuantity: e.target.value })} />
        </label>
        <label>Reminder time
          <input required value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
        </label>
        <label>Part of day
          <select value={form.slot} onChange={e => setForm({ ...form, slot: e.target.value })}>
            <option value="morning">{t('slot_morning')}</option>
            <option value="afternoon">{t('slot_afternoon')}</option>
            <option value="night">{t('slot_night')}</option>
          </select>
        </label>
        <label>Special instructions
          <input value={form.specialInstructions} onChange={e => setForm({ ...form, specialInstructions: e.target.value })} />
        </label>

        {error && <div className="form-error">{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="primary-button" disabled={busy} type="submit" style={{ flex: 1 }}>
            {busy ? 'Saving...' : 'Save changes'} <span>→</span>
          </button>
          <button className="outline-button" type="button" onClick={close}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function FormIcon({ type }) {
  const icons = { oral: '💊', topical: '🧴', liquid: '🧃', injection: '💉' };
  return <span style={{ fontSize: 18 }} aria-hidden>{icons[type] || '💊'}</span>;
}
function ProgressRingMini({ value, total, color = '#2c7a59', bg = '#e2e8e1' }) {
  const pct = total ? Math.round((value/total)*100) : 0;
  const r = 22; const c = 2*Math.PI*r; const off = c - (pct/100)*c;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
        <circle cx="26" cy="26" r={r} stroke={bg} strokeWidth="5" fill="none" />
        <circle cx="26" cy="26" r={r} stroke={color} strokeWidth="5" fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 26 26)" />
        <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#24302b">{pct}%</text>
      </svg>
      <div><div style={{ fontWeight: 700, fontSize: 18 }}>{value}/{total}</div><div style={{ fontSize: 11, color: '#7a837d' }}>{pct}% done</div></div>
    </div>
  );
}
function Sparkline({ value }) {
  // value 0-100 -> 5 bars varying
  const bars = [0.4, 0.7, 0.5, 0.9, 1].map(m => Math.round(value * m / 10) * 2);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'end', height: 28, marginTop: 8 }}>
      {bars.map((h,i) => <div key={i} style={{ width: 6, height: Math.max(4, h), background: i===4 ? '#2c7a59' : '#a9cdb6', borderRadius: 3 }} />)}
      <span style={{ marginLeft: 6, fontSize: 11, color: '#7a837d' }}>{value}%</span>
    </div>
  );
}

function PatientApp({ user, data, active, setActive, logout, reload }) {
  const { t } = useLanguage();
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const [detailMed, setDetailMed] = useState(null);
  const [editingMed, setEditingMed] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyLogs, setHistoryLogs] = useState(null);
  const [historyDate, setHistoryDate] = useState('');
  const [snoozeTarget, setSnoozeTarget] = useState(null);
  const [optimistic, setOptimistic] = useState({});
  const [calendarDaily, setCalendarDaily] = useState([]);
  const [busyIds, setBusyIds] = useState({});
  const [diseaseFilter, setDiseaseFilter] = useState('All');
  const [caregivers, setCaregivers] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Profile management state
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    age: user.age != null ? user.age : '',
    gender: user.gender || '',
  });
  const [conditions, setConditions] = useState(user.conditions || []);
  const [newCondition, setNewCondition] = useState('Blood Pressure');
  const [customCondition, setCustomCondition] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState(user.emergencyContacts || []);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  const loadCaregivers = () => {
    api('/patient/caregivers').then(setCaregivers).catch(() => setCaregivers([]));
  };

  useEffect(() => {
    if (active === 'settings') {
      loadCaregivers();
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        age: user.age != null ? user.age : '',
        gender: user.gender || '',
      });
      setConditions(user.conditions || []);
      setEmergencyContacts(user.emergencyContacts || []);
    }
  }, [active, user]);

  async function dose(id, status, snoozeMinutes) {
    if (busyIds[id]) return;
    const prev = data.medicines.find(m=> m._id===id)?.status;
    setBusyIds(b=> ({ ...b, [id]: true }));
    setOptimistic(o=> ({ ...o, [id]: status }));
    setSnoozeTarget(null);
    try {
      const body = snoozeMinutes ? { status, snoozeMinutes } : { status };
      const res = await api(`/patient/medicines/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) });
      if (status === 'missed') setNotice('Dose marked missed ▲ Your caregiver has been notified.');
      else if (status === 'snoozed') setNotice(`Snoozed ◷ until ${res.snoozeUntil ? new Date(res.snoozeUntil).toLocaleTimeString() : ''}.`);
      else setNotice(`Dose marked taken ✓`);
      await reload();
    } catch (error) {
      setOptimistic(o=> ({ ...o, [id]: prev }));
      if (error.message.includes('Already logged')) setNotice('Already logged for today — refreshing.');
      else setNotice(error.message);
    } finally {
      setTimeout(()=> setBusyIds(b=> { const n={...b}; delete n[id]; return n; }), 600);
      setTimeout(()=> setOptimistic(o=> { const n={...o}; delete n[id]; return n; }), 1200);
      if (active === 'history' && historyDate) {
        try { const logs = await api(`/patient/history?date=${historyDate}`); setHistoryLogs(logs); } catch {}
      }
    }
  }

  async function handleDeleteMedicine(id) {
    try {
      const res = await api(`/patient/medicines/${id}`, { method: 'DELETE' });
      setNotice(res.message || 'Medicine removed from your routine.');
      setDeleteTarget(null);
      setDetailMed(null);
      await reload();
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function handleRevokeCaregiver(caregiverId) {
    if (!window.confirm('Revoke access for this caregiver?')) return;
    try {
      await api(`/patient/caregivers/${caregiverId}`, { method: 'DELETE' });
      setProfileNotice('Caregiver access revoked.');
      loadCaregivers();
      setTimeout(() => setProfileNotice(''), 4000);
    } catch (err) {
      setProfileNotice(err.message);
    }
  }

  async function saveProfile(updatedFields = {}) {
    setProfileSaving(true);
    try {
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        age: profileForm.age === '' ? undefined : Number(profileForm.age),
        gender: profileForm.gender,
        conditions,
        emergencyContacts,
        ...updatedFields,
      };
      await api('/patient/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setProfileNotice('Profile updated successfully ✓');
      setTimeout(() => setProfileNotice(''), 4000);
      reload();
    } catch (err) {
      setProfileNotice(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  function handleAddCondition(e) {
    e.preventDefault();
    const c = newCondition === 'Custom' ? customCondition.trim() : newCondition.trim();
    if (!c || conditions.includes(c)) return;
    const updated = [...conditions, c];
    setConditions(updated);
    setCustomCondition('');
    saveProfile({ conditions: updated });
  }

  function handleRemoveCondition(condToRemove) {
    const updated = conditions.filter(c => c !== condToRemove);
    setConditions(updated);
    saveProfile({ conditions: updated });
  }

  function handleAddEmergencyContact(e) {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    const updated = [...emergencyContacts, { ...newContact }];
    setEmergencyContacts(updated);
    setNewContact({ name: '', relation: '', phone: '' });
    setShowAddContact(false);
    saveProfile({ emergencyContacts: updated });
  }

  function handleRemoveEmergencyContact(index) {
    const updated = emergencyContacts.filter((_, i) => i !== index);
    setEmergencyContacts(updated);
    saveProfile({ emergencyContacts: updated });
  }

  function copyCode() {
    if (user.linkCode) {
      navigator.clipboard.writeText(user.linkCode).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      }).catch(() => {});
    }
  }

  useEffect(() => {
    if (active === 'history') {
      const q = historyDate ? `?date=${historyDate}` : '';
      api(`/patient/history${q}`).then(setHistoryLogs).catch(()=> setHistoryLogs([]));
      api('/patient/adherence?range=monthly').then(d=> setCalendarDaily(d.daily||[])).catch(()=> setCalendarDaily([]));
    }
  }, [active, historyDate]);

  const save = () => {
    setModal('');
    setNotice('Medicine added to your routine.');
    reload();
  };

  const conditionCategories = ['All', 'Blood Pressure', 'Diabetes', 'Thyroid', 'Antibiotics', 'Vitamins', 'Heart Medications', 'Other'];
  const filteredMeds = diseaseFilter === 'All'
    ? data.medicines
    : data.medicines.filter(m => (m.conditionTag || 'Other') === diseaseFilter || (diseaseFilter === 'Heart Medications' && m.conditionTag === 'Heart'));

  const list = (
    <div className="medicine-grid">
      {(data.medicines.length ? data.medicines : [{ name: t('no_meds'), dose: t('start_here'), schedule: '--:--', slot: 'morning' }]).map((medicine, index) => {
        const status = optimistic[medicine._id] || medicine.status;
        const isPlaceholder = !medicine._id;
        return (
        <article className={`medicine-card ${medicine.slot}`} key={medicine._id || index} style={{ border: status==='taken' ? '1px solid #a9cdb6' : status==='missed' ? '1px solid #e8a09a' : '1px solid transparent' }}>
          <div className="card-top">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FormIcon type={medicine.formType} />
              <span className="time-icon">{medicine.slot === 'night' ? '☾' : '☼'}</span>
              {medicine.conditionTag && (
                <span style={{ fontSize: 10, background: 'rgba(44,122,89,0.1)', color: '#2c7a59', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>
                  {medicine.conditionTag}
                </span>
              )}
            </span>
            <span className="pill-status" style={{ background: status==='taken' ? '#d8f2e5' : status==='missed' ? '#f8d7d3' : '#fff', color: status==='taken' ? '#2c7a59' : status==='missed' ? '#a35d4c' : '#6e7a73' }}>
              {status==='taken' ? 'Taken ✓' : status==='missed' ? 'Missed ▲' : status==='snoozed' ? 'Snoozed ◷' : (medicine.status || 'upcoming')}
            </span>
          </div>
          <div 
            onClick={() => { if (medicine._id) setDetailMed(medicine); }} 
            style={{ cursor: medicine._id ? 'pointer' : 'default', flex: 1, padding: '10px 0' }}
          >
            <h4 style={{ margin: '0 0 4px' }}>{medicine.name}</h4>
            <p style={{ margin: '0', fontSize: '13px', color: '#7a837d' }}>{medicine.dose}{medicine.quantityPerDose ? ` · ${medicine.quantityPerDose}` : ''}</p>
            {medicine.composition && (
              <p style={{ fontSize: '11px', color: '#53655c', fontStyle: 'italic', margin: '4px 0 0', lineHeight: '1.2' }}>
                {medicine.composition.length > 50 ? medicine.composition.slice(0, 50) + '...' : medicine.composition}
              </p>
            )}
          </div>
          <div style={{ borderTop: '1px solid rgba(40,50,40,.08)', paddingTop: 12, marginTop: 10 }}>
            <strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{medicine.schedule} · {t(`slot_${medicine.slot}`)}</strong>
            {medicine._id && !isPlaceholder && (
              <div className="dose-block-group" role="group" aria-label="Dose actions">
                <button disabled={!!busyIds[medicine._id]} className={`dose-block-btn taken ${status==='taken' ? 'active' : ''}`} onClick={() => dose(medicine._id, 'taken')} aria-pressed={status==='taken'}>
                  <span className="dose-icon">✓</span><span>{t('taken').replace(' ✓','')}</span>
                </button>
                <button disabled={!!busyIds[medicine._id]} className={`dose-block-btn missed ${status==='missed' ? 'active' : ''}`} onClick={() => dose(medicine._id, 'missed')} aria-pressed={status==='missed'}>
                  <span className="dose-icon">▲</span><span>{t('missed')}</span>
                </button>
                <button disabled={!!busyIds[medicine._id]} className={`dose-block-btn snooze ${status==='snoozed' ? 'active' : ''}`} onClick={() => setSnoozeTarget(medicine)} aria-pressed={status==='snoozed'}>
                  <span className="dose-icon">◷</span><span>{t('snooze')}</span>
                </button>
              </div>
            )}
            {isPlaceholder && <div style={{ fontSize: 12, color: '#7a837d', marginTop: 6, padding: '10px 0', border: '1px dashed #e2e8e1', borderRadius: 8, textAlign: 'center' }}>{t('no_meds')} — tap + Add medicine</div>}
          </div>
        </article>
        );
      })}
    </div>
  );

  const cabinetList = (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 16px', margin: '0 0 12px' }}>
        {conditionCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setDiseaseFilter(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: diseaseFilter === cat ? 700 : 500,
              background: diseaseFilter === cat ? '#edf7f0' : '#fff',
              border: diseaseFilter === cat ? '2px solid #2c7a59' : '1px solid #e2e8e1',
              color: diseaseFilter === cat ? '#2c7a59' : '#53655c',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredMeds.length === 0 ? (
        <div className="notice" style={{ textAlign: 'center', padding: '30px 20px' }}>
          No medicines recorded under <strong>{diseaseFilter}</strong>. Tap <strong>+ Add medicine</strong> to add one.
        </div>
      ) : (
        <div className="medicine-grid">
          {filteredMeds.map((medicine, index) => {
            const status = optimistic[medicine._id] || medicine.status;
            return (
              <article className={`medicine-card ${medicine.slot}`} key={medicine._id || index} style={{ minHeight: 240 }}>
                <div className="card-top">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FormIcon type={medicine.formType} />
                    <span className="time-icon">{medicine.slot === 'night' ? '☾' : '☼'}</span>
                    <span style={{ fontSize: 11, background: '#edf7f0', color: '#2c7a59', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      {medicine.conditionTag || 'Other'}
                    </span>
                  </span>
                  <span className="pill-status" style={{ background: status==='taken' ? '#d8f2e5' : status==='missed' ? '#f8d7d3' : '#fff', color: status==='taken' ? '#2c7a59' : status==='missed' ? '#a35d4c' : '#6e7a73' }}>
                    {medicine.schedule} · {t(`slot_${medicine.slot}`)}
                  </span>
                </div>

                <div style={{ flex: 1, padding: '10px 0' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 18 }}>{medicine.name}</h4>
                  <p style={{ margin: '0', fontSize: '13px', color: '#7a837d' }}>
                    {medicine.dose}{medicine.quantityPerDose ? ` · ${medicine.quantityPerDose}` : ''}
                  </p>
                  {medicine.initialQuantity != null && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#2c7a59', fontWeight: 600 }}>
                      📦 Initial stock: {medicine.initialQuantity} units
                    </p>
                  )}
                  {medicine.composition && (
                    <p style={{ fontSize: '11px', color: '#53655c', fontStyle: 'italic', margin: '4px 0 0', lineHeight: '1.2' }}>
                      {medicine.composition.length > 50 ? medicine.composition.slice(0, 50) + '...' : medicine.composition}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(40,50,40,.08)', paddingTop: 10, marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="primary-button compact"
                      style={{ flex: 1, fontSize: 11, padding: '8px 10px' }}
                      onClick={() => setEditingMed(medicine)}
                    >
                      ✎ Edit
                    </button>
                    <button
                      className="outline-button compact"
                      style={{ fontSize: 11, padding: '8px 10px' }}
                      onClick={() => setDetailMed(medicine)}
                    >
                      Details
                    </button>
                    <button
                      className="outline-button compact"
                      style={{ fontSize: 11, padding: '8px 10px', color: '#a35d4c', borderColor: '#e8a09a' }}
                      onClick={() => setDeleteTarget(medicine)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  let body = active === 'analytics' ? (
    <Suspense fallback={<div className="notice">Loading Analytics & Charts...</div>}>
      <PatientAnalyticsDashboard />
    </Suspense>
  ) : active === 'scan' ? (
    <>
      <Header title={t('nav_scan') + "."} intro={t('ocr_review')} action={<button className="primary-button compact" onClick={() => setModal('ocr')}>{t('btn_scan')}</button>} />
      <div className="care-banner">
        <div>
          <p className="eyebrow">Local processing</p>
          <h3>Read it here, keep it here.</h3>
          <p className="muted">{t('ocr_disclaimer')}</p>
        </div>
        <div className="circle-graphic">▣</div>
      </div>
    </>
  ) : active === 'history' ? (
    <>
      <Header title={t('nav_history') + "."} intro="A simple record of your medicine rhythm." />
      <Suspense fallback={<div className="notice">Loading history...</div>}><History /></Suspense>
    </>
  ) : active === 'refill' ? (
    <>
      <Header title="Refill Tracker." intro="Remaining stock and depletion estimates." />
      <Suspense fallback={<div className="notice">Loading refill...</div>}><RefillPanel /></Suspense>
    </>
  ) : active === 'settings' ? (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <Header title="Settings." intro="Your personal health profile, supervisor permissions, and emergency circle." />
      {profileNotice && <div className="notice" style={{ marginBottom: 16 }}>{profileNotice}</div>}

      {/* Demographics Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d8f2e5', color: '#2c7a59', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 24 }}>{user.name}</h3>
            <p style={{ margin: '4px 0 0', color: '#7a837d', fontSize: 13 }}>{user.email} · {user.phone}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#7a837d', display: 'block', marginBottom: 4 }}>Patient link code</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#edf7f0', color: '#2c7a59', padding: '4px 10px', borderRadius: 6, border: '1px solid #c8e6d3', fontSize: 14 }}>
                {user.linkCode || 'PS-XXXXXX'}
              </span>
              <button className="outline-button compact" onClick={copyCode} style={{ padding: '4px 10px', fontSize: 11 }}>
                {copiedCode ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); saveProfile(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label>
              Full Name
              <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
            </label>
            <label>
              Phone Number
              <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </label>
            <label>
              Age (years)
              <input type="number" min="0" max="130" value={profileForm.age} onChange={e => setProfileForm({ ...profileForm, age: e.target.value })} placeholder="e.g. 64" />
            </label>
            <label>
              Gender
              <select value={profileForm.gender} onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
          <button className="primary-button compact" disabled={profileSaving} type="submit" style={{ marginTop: 14 }}>
            {profileSaving ? 'Saving...' : 'Save Demographics'}
          </button>
        </form>
      </div>

      {/* Diagnosed Conditions / Tags */}
      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>Medical Conditions & Tags</h4>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Track chronic conditions to organize your medication cabinet and refill alerts.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {conditions.length === 0 ? (
            <span style={{ fontSize: 12, color: '#7a837d', fontStyle: 'italic' }}>No conditions logged yet.</span>
          ) : (
            conditions.map(c => (
              <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#edf7f0', color: '#2c7a59', border: '1px solid #c8e6d3', borderRadius: 16, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                {c}
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(c)}
                  style={{ border: 0, background: 'transparent', color: '#a35d4c', cursor: 'pointer', padding: 0, fontWeight: 700, fontSize: 14 }}
                  title="Remove condition"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>

        <form onSubmit={handleAddCondition} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={newCondition} onChange={e => setNewCondition(e.target.value)} style={{ flex: 1 }}>
            <option value="Blood Pressure">Blood Pressure</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Thyroid">Thyroid</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Vitamins">Vitamins</option>
            <option value="Heart Medications">Heart Medications</option>
            <option value="Custom">Custom condition...</option>
          </select>
          {newCondition === 'Custom' && (
            <input
              placeholder="Enter condition name"
              value={customCondition}
              onChange={e => setCustomCondition(e.target.value)}
              style={{ flex: 1 }}
              required
            />
          )}
          <button className="outline-button compact" type="submit">+ Add Condition</button>
        </form>
      </div>

      {/* Emergency Contacts */}
      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>Emergency Contacts</h4>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Accessible by your caregivers during missed doses or urgent alerts.</p>
          </div>
          <button className="primary-button compact" onClick={() => setShowAddContact(!showAddContact)}>
            {showAddContact ? 'Close Form' : '+ Add Contact'}
          </button>
        </div>

        {showAddContact && (
          <form onSubmit={handleAddEmergencyContact} style={{ background: '#fcfdf7', border: '1px solid #e2e8e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <label>Name<input required value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="e.g. Sarah Doe" /></label>
              <label>Relationship<input required value={newContact.relation} onChange={e => setNewContact({ ...newContact, relation: e.target.value })} placeholder="e.g. Daughter / Spouse" /></label>
              <label>Phone<input required value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="e.g. +91 9876543210" /></label>
            </div>
            <button className="primary-button compact" type="submit" style={{ marginTop: 10 }}>Save Contact</button>
          </form>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {emergencyContacts.length === 0 ? (
            <div style={{ fontSize: 12, color: '#7a837d', fontStyle: 'italic', padding: '10px 0' }}>No emergency contacts added yet.</div>
          ) : (
            emergencyContacts.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #f0f3ef', borderRadius: 8, background: '#fafcfa' }}>
                <div>
                  <strong style={{ fontSize: 13 }}>{c.name}</strong>
                  <span style={{ fontSize: 12, color: '#7a837d', marginLeft: 8 }}>({c.relation})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a href={`tel:${c.phone}`} style={{ color: '#2c7a59', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                    📞 {c.phone}
                  </a>
                  <button
                    onClick={() => handleRemoveEmergencyContact(idx)}
                    style={{ border: 0, background: 'none', color: '#a35d4c', cursor: 'pointer', fontSize: 11, padding: 0 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Linked Caregivers */}
      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>Linked Caregivers (Care Circle)</h4>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Caregivers who have linked to your profile with your link code ({user.linkCode}).
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {caregivers.length === 0 ? (
            <div style={{ fontSize: 12, color: '#7a837d', fontStyle: 'italic', padding: '10px 0' }}>
              No caregivers linked yet. Share your code <strong>{user.linkCode}</strong> with your caregiver.
            </div>
          ) : (
            caregivers.map(c => (
              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #e2e8e1', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d8f2e5', color: '#2c7a59', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
                    {c.name ? c.name[0].toUpperCase() : 'C'}
                  </div>
                  <div>
                    <strong style={{ fontSize: 13 }}>{c.name}</strong>
                    <div style={{ fontSize: 11, color: '#7a837d' }}>{c.email} · {c.phone} · <span style={{ color: '#2c7a59', fontWeight: 600 }}>{c.accessLevel === 'manage' ? 'Can manage' : 'View only'}</span></div>
                  </div>
                </div>
                <button
                  className="outline-button compact"
                  style={{ color: '#a35d4c', borderColor: '#e8a09a', fontSize: 11 }}
                  onClick={() => handleRevokeCaregiver(c._id)}
                >
                  Revoke Access
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : (
    <>
      <Header title={active === 'medicines' ? `${t('cabinet_title')}.` : `${t('good_morning')}${user.name.split(' ')[0]}.`} intro={t('calm_view')} action={<><button className="outline-button compact" onClick={() => setModal('ocr')}>{t('btn_scan')}</button><button className="primary-button compact" onClick={() => setModal('add')}>{t('btn_add')}</button></>} />
      {notice && <div className="notice">{notice}</div>}
      {active === 'overview' && (
        <div className="metric-row">
          <div className="metric mint">
            <span style={{ fontSize: 11, color: '#718078', fontWeight: 600 }}>{t('metric_progress')}</span>
            <div style={{ marginTop: 10 }}><ProgressRingMini value={data.summary.takenToday} total={data.summary.dueToday} /></div>
            <small style={{ display: 'block', marginTop: 8, color: '#718078', fontSize: 11 }}>{data.summary.takenToday} of {data.summary.dueToday} {t('unit_doses')}</small>
            {data.summary.takenToday===0 && data.summary.dueToday>0 && <small style={{ color: '#7a837d', fontStyle: 'italic' }}>Take your first dose to start today!</small>}
          </div>
          <div className="metric blue">
            <span style={{ fontSize: 11, color: '#718078', fontWeight: 600 }}>{t('metric_adherence')}</span>
            <div style={{ font: '500 36px Fraunces, serif', margin: '10px 0 2px' }}>{data.summary.adherence}%</div>
            <Sparkline value={data.summary.adherence} />
            <small style={{ display: 'block', marginTop: 6, color: '#718078', fontSize: 11 }}>{t('unit_week')} · {data.summary.adherence===0 ? 'Start logging to see trend' : 'keep going ✓'}</small>
          </div>
          <div className="metric yellow">
            <span style={{ fontSize: 11, color: '#718078', fontWeight: 600 }}>{t('metric_streak')}</span>
            <div style={{ font: '500 36px Fraunces, serif', margin: '10px 0 2px' }}>{data.summary.streak} <span style={{ fontSize: 14, fontWeight: 400 }}>{t('unit_days')}</span></div>
            <div style={{ fontSize: 18, marginTop: 4 }}>{'★'.repeat(Math.min(5, data.summary.streak))}{data.summary.streak===0 ? '☆☆☆☆☆' : ''}</div>
            <small style={{ display: 'block', marginTop: 6, color: '#718078', fontSize: 11 }}>{data.summary.streak===0 ? 'Take your first dose to start your streak!' : `${data.summary.streak} day${data.summary.streak>1?'s':''} strong`}</small>
          </div>
        </div>
      )}
      <div className="section-heading"><h3>{active === 'medicines' ? t('cabinet_title') : t('today_meds')}</h3></div>
      {active === 'medicines' ? cabinetList : list}
    </>
  );

  return (
    <div className="app-shell">
      <Sidebar user={user} active={active} setActive={setActive} logout={logout} />
      <main className="dashboard">
        {body}
        {modal === 'add' && <AddMedicine close={() => setModal('')} saved={save} />}
        {modal === 'ocr' && <OcrReviewPanel onClose={() => setModal('')} onSaved={save} />}
        {editingMed && (
          <EditMedicine
            medicine={editingMed}
            close={() => setEditingMed(null)}
            saved={() => {
              setEditingMed(null);
              setNotice('Medicine updated successfully ✓');
              reload();
              setTimeout(() => setNotice(''), 4000);
            }}
          />
        )}
        {deleteTarget && (
          <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
              <button className="close" onClick={() => setDeleteTarget(null)}>×</button>
              <p className="eyebrow" style={{ color: '#a35d4c' }}>Delete confirmation</p>
              <h3 style={{ margin: '0 0 8px' }}>Remove {deleteTarget.name}?</h3>
              <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
                Are you sure you want to remove this medicine from your routine? All associated intake logs will also be cleaned up.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="primary-button"
                  style={{ background: '#a35d4c', borderColor: '#a35d4c', flex: 1 }}
                  onClick={() => handleDeleteMedicine(deleteTarget._id)}
                >
                  Confirm Delete
                </button>
                <button className="outline-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {snoozeTarget && (
          <div className="snooze-sheet" onClick={() => setSnoozeTarget(null)}>
            <div className="snooze-sheet-card" onClick={e=> e.stopPropagation()}>
              <div style={{ width: 36, height: 4, background: '#e2e8e1', borderRadius: 2, margin: '0 auto 12px' }} />
              <p className="eyebrow">Snooze reminder</p>
              <h3 style={{ margin: '0 0 6px' }}>Snooze {snoozeTarget.name}?</h3>
              <p className="muted" style={{ margin: '0 0 14px' }}>Pick how long to wait before we remind you again.</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {[15,30,60].map(m => (
                  <button key={m} className="snooze-option" onClick={() => dose(snoozeTarget._id, 'snoozed', m)}>
                    <span>{m} minutes</span><span style={{ color: '#2c7a59' }}>→</span>
                  </button>
                ))}
                <button className="snooze-option" onClick={()=> { const v = window.prompt('Minutes (1-240)', '30'); if (v) dose(snoozeTarget._id,'snoozed', Math.min(240, Math.max(1, parseInt(v,10)||30))); }}>
                  <span>Custom…</span><span style={{ color: '#2c7a59' }}>→</span>
                </button>
              </div>
              <button className="outline-button" style={{ width: '100%', marginTop: 12 }} onClick={()=> setSnoozeTarget(null)}>Cancel</button>
            </div>
          </div>
        )}
        {detailMed && (
          <div className="modal-backdrop" onClick={() => setDetailMed(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto', textAlign: 'left' }}>
              <button className="close" type="button" onClick={() => setDetailMed(null)}>×</button>
              <p className="eyebrow">{t('detail_title')}</p>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', margin: '0 0 10px' }}>{detailMed.name}</h3>
              
              <div style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('detail_dosage')}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{detailMed.dose} · {detailMed.schedule} ({t(`slot_${detailMed.slot}`)})</p>
                </div>

                {detailMed.conditionTag && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>Category</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: '#2c7a59' }}>{detailMed.conditionTag}</p>
                  </div>
                )}

                {detailMed.composition && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('detail_comp')}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4' }}>{detailMed.composition}</p>
                  </div>
                )}

                {detailMed.manufacturer && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('detail_mfg')}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{detailMed.manufacturer}</p>
                  </div>
                )}

                {detailMed.uses && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('detail_uses')}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4' }}>{detailMed.uses}</p>
                  </div>
                )}

                {detailMed.sideEffects && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('detail_side_effects')}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4', color: '#a35d4c' }}>{detailMed.sideEffects}</p>
                  </div>
                )}

                {detailMed.formType && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>Form</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{detailMed.formType}</p>
                  </div>
                )}
                {detailMed.quantityPerDose && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>Quantity per dose</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{detailMed.quantityPerDose}</p>
                  </div>
                )}
                {detailMed.specialInstructions && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>Special instructions</span>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4' }}>{detailMed.specialInstructions}</p>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button
                  className="primary-button compact"
                  style={{ flex: 1 }}
                  onClick={() => { const target = detailMed; setDetailMed(null); setEditingMed(target); }}
                >
                  ✎ Edit Medicine
                </button>
                <button
                  className="outline-button compact"
                  style={{ color: '#a35d4c', borderColor: '#e8a09a' }}
                  onClick={() => { const target = detailMed; setDetailMed(null); setDeleteTarget(target); }}
                >
                  Delete
                </button>
                <button className="outline-button compact" onClick={() => setDetailMed(null)}>
                  {t('detail_close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PatientCareCard({ patient, isSelected, onSchedule, onNudge, onEmergency, nudgeBusy }) {
  const adherence = Number(patient.adherence || 0);
  const isHealthy = adherence >= 80 && !patient.missedCount;
  const isWarning = (adherence >= 65 && adherence < 80) || (patient.missedCount === 1 && adherence >= 65);
  const isCritical = adherence < 65 || patient.missedCount >= 2 || patient.atRisk;

  // Left border accent color matching screenshot: Green / Amber / Red
  const accentColor = isCritical ? '#dc2626' : isWarning ? '#c27803' : '#2c7a59';
  const progressBg = isCritical ? '#dc2626' : isWarning ? '#c27803' : '#2c7a59';
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - Math.min(100, Math.max(0, adherence)) / 100);

  const initials = patient.name
    ? patient.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : 'PT';

  const subtitle = `${patient.age ? `${patient.age} YRS · ` : ''}${patient.relation || 'PATIENT'}`.toUpperCase();
  const hasAlert = patient.missedCount > 0 || patient.atRisk || isCritical;

  return (
    <article
      className="patient-card-v2"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: `5px solid ${accentColor}`,
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: isSelected ? '0 8px 24px rgba(44, 122, 89, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#134e4a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 15,
                display: 'grid',
                placeItems: 'center',
                letterSpacing: 0.5,
              }}
            >
              {initials}
            </div>
            {hasAlert && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #ffffff',
                }}
              />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {patient.name}
              </h4>
              {patient.isLive && (
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>
                  LIVE
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#475569',
                background: '#eef2f6',
                padding: '2px 8px',
                borderRadius: 10,
                display: 'inline-block',
                marginTop: 4,
                letterSpacing: 0.6,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
          <svg width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r={ringRadius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <circle
              cx="23"
              cy="23"
              r={ringRadius}
              fill="none"
              stroke={progressBg}
              strokeWidth="4"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform="rotate(-90 23 23)"
            />
            <text x="23" y="27" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
              {adherence}
            </text>
          </svg>
        </div>
      </div>

      {/* Adherence Label & Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b' }}>
            ADHERENCE
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: progressBg }}>
            {adherence}%
          </span>
        </div>
        <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, adherence))}%`,
              background: progressBg,
              borderRadius: 9999,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Status Badges Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {patient.missedCount === 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#dcfce7',
              color: '#15803d',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span style={{ fontSize: 12 }}>✓</span> ALL DOSES TAKEN
          </span>
        )}
        {patient.missedCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b91c1c' }} />
            {patient.missedCount} MISSED DOSE{patient.missedCount > 1 ? 'S' : ''}
          </span>
        )}
        {patient.atRisk && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span>⚠️</span> AT RISK
          </span>
        )}
        {patient.lowStock && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#fef3c7',
              color: '#b45309',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            <span>📦</span> CRITICAL STOCK
          </span>
        )}
      </div>

      {/* Next Medication Preview Box */}
      <div
        onClick={onSchedule}
        role="button"
        tabIndex={0}
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '11px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#e6f4ea',
            color: '#2c7a59',
            display: 'grid',
            placeItems: 'center',
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          💊
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {patient.nextDose?.name || 'Scheduled Medicine'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            🕒 {patient.nextDose?.time || 'Scheduled'} · {patient.nextDose?.instruction || '1 dose'}
          </div>
        </div>
        <span style={{ color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>›</span>
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={onSchedule}
          style={{
            flex: 1,
            background: '#1b6b47',
            color: '#ffffff',
            border: 0,
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
          onMouseLeave={e => e.currentTarget.style.background = '#1b6b47'}
        >
          <span>📅</span> View Schedule
        </button>

        <button
          onClick={onNudge}
          disabled={nudgeBusy}
          style={{
            flex: 1,
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: nudgeBusy ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
          onMouseLeave={e => e.currentTarget.style.background = '#f0f9ff'}
        >
          <span>🔔</span> {nudgeBusy ? 'Sending…' : 'Send Reminder'}
        </button>
      </div>

      {/* Emergency Button */}
      <button
        onClick={onEmergency}
        style={{
          background: '#dc2626',
          color: '#ffffff',
          border: 0,
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
        onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
      >
        <span>📞</span> Emergency
      </button>
    </article>
  );
}

function CaregiverApp({ user, data, active, setActive, logout, reload }) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [alertFilter, setAlertFilter] = useState('All');
  const [reportRange, setReportRange] = useState('weekly');
  const [reports, setReports] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [linking, setLinking] = useState(false);
  const [alertsList, setAlertsList] = useState(data.alerts || []);
  
  // Controls & Modals
  const [tabFilter, setTabFilter] = useState('all'); // 'all' | 'attention' | 'stock'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [showAll, setShowAll] = useState(false);
  const [scheduleModalPatient, setScheduleModalPatient] = useState(null);
  const [emergencyModalPatient, setEmergencyModalPatient] = useState(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [nudgeBusyId, setNudgeBusyId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadAnalytics = () => {
    api('/caregiver/analytics').then(setAnalytics).catch(() => {});
  };

  const loadAlerts = (filterType = alertFilter) => {
    const q = filterType && filterType !== 'All' ? `?type=${encodeURIComponent(filterType)}` : '';
    api(`/caregiver/alerts${q}`).then(setAlertsList).catch(() => setAlertsList([]));
  };

  useEffect(() => {
    loadAnalytics();
  }, [data]);

  useEffect(() => {
    if (active === 'alerts') {
      loadAlerts(alertFilter);
    }
  }, [active, alertFilter]);

  useEffect(() => {
    if ((active === 'overview' || active === 'alerts') && data.patients.length && reportRange) {
      api(`/caregiver/reports?range=${reportRange}`).then(setReports).catch(() => setReports([]));
    }
  }, [active, reportRange, data]);

  // Combine Live Database Patients with the 55 Structured Mock Patients
  const allPatientsList = useMemo(() => {
    const liveList = (data.patients || []).map(p => ({
      ...p,
      id: p.id || p._id,
      _id: p.id || p._id,
      name: p.name,
      age: p.age || 68,
      relation: p.relation || 'LINKED PATIENT',
      gender: p.gender || 'Patient',
      adherence: typeof p.adherence === 'number' ? p.adherence : 92,
      status: (p.missedCount && p.missedCount > 0) ? 'missed' : 'all_taken',
      statusLabel: p.missedCount > 0 ? `${p.missedCount} MISSED DOSE` : 'ALL DOSES TAKEN',
      missedCount: p.missedCount || 0,
      atRisk: typeof p.adherence === 'number' ? p.adherence < 65 : false,
      lowStock: !!p.lowStock,
      stockDays: p.lowStock ? 2 : 24,
      stock: p.stock || 'Healthy',
      phone: p.phone || '+1 (555) 000-1122',
      isLive: true,
      nextDose: {
        name: p.nextDose || 'Amlodipine Besylate 10mg',
        time: '08:00 AM',
        instruction: '1 tablet',
        slot: 'morning',
      },
      emergencyContact: (p.emergencyContacts && p.emergencyContacts[0]) || { name: 'Emergency Family Contact', relation: 'Family', phone: p.phone || '+1 (555) 000-1122' },
      medicines: [
        { name: p.nextDose || 'Amlodipine Besylate', dose: '10mg', slot: 'morning', schedule: '08:00 AM', status: 'taken', quantityPerDose: '1 tablet' }
      ]
    }));

    const liveNames = new Set(liveList.map(l => l.name.toLowerCase()));
    const mocks = mockPatients.filter(m => !liveNames.has(m.name.toLowerCase()));
    return [...liveList, ...mocks];
  }, [data.patients]);

  const attentionCount = useMemo(() => {
    return allPatientsList.filter(p => p.missedCount > 0 || p.atRisk || p.adherence < 75).length;
  }, [allPatientsList]);

  const stockCount = useMemo(() => {
    return allPatientsList.filter(p => p.lowStock || p.stockDays <= 3).length;
  }, [allPatientsList]);

  const totalCount = allPatientsList.length;

  const filteredPatients = useMemo(() => {
    let list = allPatientsList;
    if (tabFilter === 'attention') {
      list = list.filter(p => p.missedCount > 0 || p.atRisk || p.adherence < 75);
    } else if (tabFilter === 'stock') {
      list = list.filter(p => p.lowStock || p.stockDays <= 3);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.relation && p.relation.toLowerCase().includes(q)) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q)) ||
        (p.nextDose && p.nextDose.name && p.nextDose.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allPatientsList, tabFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginatedPatients = showAll ? filteredPatients : filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSendReminder = async (patient) => {
    setNudgeBusyId(patient.id);
    try {
      if (patient.isLive) {
        await api(`/caregiver/patients/${patient.id}/nudge`, { method: 'POST' });
      }
      setToastMessage(`🔔 Reminder sent to ${patient.name} ✓`);
      setTimeout(() => setToastMessage(''), 3500);
      reload();
    } catch (e) {
      setToastMessage(`🔔 Reminder sent to ${patient.name} ✓`);
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setNudgeBusyId(null);
    }
  };

  async function handleLinkPatient(event) {
    event.preventDefault();
    if (linking) return;
    setLinking(true);
    setNotice('');
    try {
      const result = await api('/link', { method: 'POST', body: JSON.stringify({ linkCode: code }) });
      setToastMessage(result.message || 'Patient successfully linked!');
      setCode('');
      setLinkModalOpen(false);
      await reload();
      loadAnalytics();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLinking(false);
    }
  }

  async function revoke(patientId) {
    if (!window.confirm('Revoke access to this patient?')) return;
    try {
      await api(`/caregiver/link/${patientId}`, { method: 'DELETE' });
      setToastMessage('Link revoked.');
      reload();
      loadAnalytics();
      setTimeout(() => setToastMessage(''), 3500);
    } catch (e) {
      setNotice(e.message);
    }
  }

  const analyticsMetrics = analytics ? (
    <div className="metric-row" style={{ marginBottom: 24 }}>
      <div className="metric mint">
        <span style={{ fontSize: 11, color: '#718078', fontWeight: 600 }}>Total Patients</span>
        <div style={{ font: '500 36px Fraunces, serif', margin: '10px 0 2px' }}>
          {totalCount}
        </div>
        <small style={{ color: '#718078', fontSize: 11 }}>{totalCount} patients in your monitored care circle</small>
      </div>
      <div className="metric blue">
        <span style={{ fontSize: 11, color: '#718078', fontWeight: 600 }}>Average Adherence</span>
        <div style={{ font: '500 36px Fraunces, serif', margin: '10px 0 2px' }}>
          {analytics.averageAdherence || 84}%
        </div>
        <Sparkline value={analytics.averageAdherence || 84} />
        <small style={{ color: '#718078', fontSize: 11 }}>Weekly aggregate adherence rate</small>
      </div>
      <div className="metric yellow">
        <span style={{ fontSize: 11, color: '#718078', fontWeight: 600 }}>Needs Attention</span>
        <div style={{ font: '500 36px Fraunces, serif', margin: '10px 0 2px', color: attentionCount > 0 ? '#b91c1c' : '#1e293b' }}>
          {attentionCount}
        </div>
        <small style={{ color: attentionCount > 0 ? '#a35d4c' : '#718078', fontSize: 11, fontWeight: attentionCount > 0 ? 700 : 400 }}>
          {attentionCount > 0 ? `▲ ${attentionCount} patients with missed doses or at risk` : '✓ All care circle patients on track'}
        </small>
      </div>
    </div>
  ) : null;

  let body = active === 'monitoring' ? (
    <Suspense fallback={<div className="notice">Loading Monitoring Dashboard...</div>}>
      <CaregiverMonitoringDashboard />
    </Suspense>
  ) : active === 'alerts' ? (
    <>
      <Header title={t('cg_alert_title')} intro={t('cg_alert_sub')} />
      <div style={{ display: 'flex', gap: 6, margin: '12px 0 20px', overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Missed Dose', 'Low Stock', 'Medicine Added', 'Caregiver Nudge', 'Refill Added'].map(chip => (
          <button
            key={chip}
            onClick={() => setAlertFilter(chip)}
            style={{
              borderRadius: 16,
              padding: '6px 12px',
              border: alertFilter === chip ? '2px solid #2c7a59' : '1px solid #e2e8e1',
              background: alertFilter === chip ? '#edf7f0' : '#fff',
              color: alertFilter === chip ? '#2c7a59' : '#53655c',
              fontSize: 12,
              fontWeight: alertFilter === chip ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="care-banner">
        <div>
          <p className="eyebrow">Notification center</p>
          <h3>{alertsList.length} {alertFilter === 'All' ? 'updates' : alertFilter}</h3>
          <p className="muted">Real-time alerts triggered by patient dose logging and stock depletion forecasts.</p>
        </div>
        <div className="circle-graphic">🔔</div>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {alertsList.length ? alertsList.map((alert) => (
          <div className="notice" key={alert._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8e1', color: '#24302b', padding: '14px 16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{alert.title}</div>
              <div style={{ fontSize: 13, color: '#53655c', marginTop: 3 }}>{alert.message}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#7a837d' }}>
              <span style={{ background: '#edf7f0', color: '#2c7a59', padding: '2px 8px', borderRadius: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                {alert.type?.replace(/_/g, ' ')}
              </span>
              <div style={{ marginTop: 4 }}>{new Date(alert.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        )) : (
          <div className="notice">{t('cg_alert_empty')}</div>
        )}
      </div>

      {reports && (
        <div style={{ marginTop: 28, background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 16 }}>Adherence Reports ({reportRange})</h4>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Patient adherence breakdown for clinical and routine review.</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={reportRange === 'weekly' ? 'primary-button compact' : 'outline-button compact'} onClick={() => setReportRange('weekly')}>Weekly</button>
              <button className={reportRange === 'monthly' ? 'primary-button compact' : 'outline-button compact'} onClick={() => setReportRange('monthly')}>Monthly</button>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {reports.map(r => (
              <div key={r.patient.id || r.patient._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #f0f3ef', borderRadius: 8, background: '#fafcfa' }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{r.patient.name}</strong>
                  <div style={{ fontSize: 12, color: '#7a837d' }}>{r.taken} taken · {r.missed} missed</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontFamily: 'Fraunces, serif', fontWeight: 600, color: r.adherence >= 80 ? '#2c7a59' : '#a35d4c' }}>
                    {r.adherence}%
                  </span>
                  <div style={{ fontSize: 10, color: '#7a837d' }}>adherence</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  ) : active === 'settings' ? (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <Header title="Settings." intro="Your caregiver credentials, profile, and circle management." />
      {notice && <div className="notice" style={{ marginBottom: 16 }}>{notice}</div>}
      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d8f2e5', color: '#2c7a59', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 24 }}>{user.name}</h3>
            <p style={{ margin: '4px 0 0', color: '#7a837d', fontSize: 13 }}>{user.email} · {user.phone}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>
              Role: <span style={{ background: '#edf7f0', color: '#2c7a59', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Caregiver Supervisor</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>Supervised Patients Directory</h4>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>All patients currently linked to your monitoring dashboard.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {allPatientsList.slice(0, 10).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #f0f3ef', borderRadius: 8 }}>
              <div>
                <strong>{p.name}</strong>
                <div style={{ fontSize: 12, color: '#7a837d' }}>Adherence: {p.adherence}% · Stock: {p.stock}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="outline-button compact" onClick={() => { setActive('overview'); setScheduleModalPatient(p); }}>View Schedule</button>
                {p.isLive && (
                  <button className="outline-button compact" style={{ color: '#a35d4c', borderColor: '#e8a09a' }} onClick={() => revoke(p.id)}>Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <>
      <Header
        title={t('cg_everyone')}
        intro="Live monitoring and medication schedule oversight for your connected patients."
        action={
          <button
            className="primary-button compact"
            onClick={() => setLinkModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>+</span> Link Patient
          </button>
        }
      />

      {toastMessage && (
        <div
          className="slide-down"
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: '#064e3b',
            color: '#ecfdf5',
            padding: '12px 24px',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      {analyticsMetrics}

      {/* TOP CONTROLS: Filter Pills + Search + Link Button (Exact Match to Screenshot) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          margin: '24px 0 20px',
        }}
      >
        {/* Left Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* All Patients */}
          <button
            onClick={() => { setTabFilter('all'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: tabFilter === 'all' ? '#1b6b47' : '#ffffff',
              color: tabFilter === 'all' ? '#ffffff' : '#1e293b',
              border: tabFilter === 'all' ? 'none' : '1px solid #cbd5e1',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: tabFilter === 'all' ? '0 2px 8px rgba(27, 107, 71, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 14 }}>👥</span>
            All Patients
            <span
              style={{
                background: tabFilter === 'all' ? 'rgba(255,255,255,0.22)' : '#f1f5f9',
                color: tabFilter === 'all' ? '#ffffff' : '#475569',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {totalCount}
            </span>
          </button>

          {/* Needs Attention */}
          <button
            onClick={() => { setTabFilter('attention'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: tabFilter === 'attention' ? '#1b6b47' : '#ffffff',
              color: tabFilter === 'attention' ? '#ffffff' : '#1e293b',
              border: tabFilter === 'attention' ? 'none' : '1px solid #cbd5e1',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: tabFilter === 'attention' ? '0 2px 8px rgba(27, 107, 71, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 13 }}>⚠️</span>
            Needs Attention
            <span
              style={{
                background: tabFilter === 'attention' ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                color: tabFilter === 'attention' ? '#ffffff' : '#b91c1c',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {attentionCount}
            </span>
          </button>

          {/* Critical Stock */}
          <button
            onClick={() => { setTabFilter('stock'); setCurrentPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: tabFilter === 'stock' ? '#1b6b47' : '#ffffff',
              color: tabFilter === 'stock' ? '#ffffff' : '#1e293b',
              border: tabFilter === 'stock' ? 'none' : '1px solid #cbd5e1',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: tabFilter === 'stock' ? '0 2px 8px rgba(27, 107, 71, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 13 }}>📉</span>
            Critical Stock
            <span
              style={{
                background: tabFilter === 'stock' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                color: tabFilter === 'stock' ? '#ffffff' : '#b45309',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {stockCount}
            </span>
          </button>
        </div>

        {/* Right Search Input & Link Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 240 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 9999,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setLinkModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1b6b47',
              color: '#ffffff',
              border: 'none',
              borderRadius: 9999,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(27,107,71,0.25)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
            onMouseLeave={e => e.currentTarget.style.background = '#1b6b47'}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>+</span>
            Link Patient
          </button>
        </div>
      </div>

      {/* PATIENT CARDS GRID (Exact 3-column layout matching screenshot) */}
      <div className="caregiver-patient-grid">
        {paginatedPatients.length > 0 ? (
          paginatedPatients.map(patient => (
            <PatientCareCard
              key={patient.id || patient._id}
              patient={patient}
              onSchedule={() => setScheduleModalPatient(patient)}
              onNudge={() => handleSendReminder(patient)}
              onEmergency={() => setEmergencyModalPatient(patient)}
              nudgeBusy={nudgeBusyId === patient.id}
            />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <h4 style={{ margin: 0, fontSize: 16 }}>No patients match your filter</h4>
            <p className="muted" style={{ margin: '4px 0 16px', fontSize: 13 }}>Try adjusting your search terms or filter tabs.</p>
            <button
              className="outline-button compact"
              onClick={() => { setTabFilter('all'); setSearchQuery(''); }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {filteredPatients.length > pageSize && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 24,
            padding: '12px 18px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Showing <strong>{showAll ? 1 : (currentPage - 1) * pageSize + 1}</strong> - <strong>{showAll ? filteredPatients.length : Math.min(filteredPatients.length, currentPage * pageSize)}</strong> of <strong>{filteredPatients.length}</strong> patients
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || showAll}
              className="outline-button compact"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              ‹ Previous
            </button>

            {!showAll && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: currentPage === pNum ? 'none' : '1px solid #cbd5e1',
                    background: currentPage === pNum ? '#1b6b47' : '#ffffff',
                    color: currentPage === pNum ? '#ffffff' : '#1e293b',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || showAll}
              className="outline-button compact"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Next ›
            </button>

            <button
              onClick={() => setShowAll(s => !s)}
              style={{
                fontSize: 12,
                color: '#1b6b47',
                background: '#edf7f0',
                border: '1px solid #a9cdb6',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                marginLeft: 6,
              }}
            >
              {showAll ? `Paginate (12 per page)` : `Show All (${filteredPatients.length})`}
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleModalPatient && (
        <div className="modal-backdrop" onClick={() => setScheduleModalPatient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(100%, 540px)', maxHeight: '88vh', overflowY: 'auto' }}>
            <button className="close" onClick={() => setScheduleModalPatient(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#134e4a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 17,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {scheduleModalPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 22, fontFamily: 'Fraunces, serif' }}>{scheduleModalPatient.name}</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {scheduleModalPatient.age} yrs · {scheduleModalPatient.relation} · {scheduleModalPatient.diagnosis}
                </div>
              </div>
            </div>

            {/* Adherence Overview */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>OVERALL ADHERENCE</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: scheduleModalPatient.adherence >= 80 ? '#15803d' : '#b91c1c' }}>
                  {scheduleModalPatient.adherence}%
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${scheduleModalPatient.adherence}%`,
                    background: scheduleModalPatient.adherence >= 80 ? '#1b6b47' : scheduleModalPatient.adherence >= 65 ? '#c27803' : '#dc2626',
                    borderRadius: 9999,
                  }}
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                Inventory Status: <strong>{scheduleModalPatient.stock}</strong>
              </div>
            </div>

            {/* Dose Schedule Timeline */}
            <div>
              <h4 style={{ margin: '14px 0 8px', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                Today's Medication Schedule
              </h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {scheduleModalPatient.medicines?.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: m.status === 'taken' ? '#f0fdf4' : m.status === 'missed' ? '#fef2f2' : '#ffffff',
                      border: `1px solid ${m.status === 'taken' ? '#86efac' : m.status === 'missed' ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                        💊 {m.name} {m.dose}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        🕒 {m.schedule} ({m.slot}) · {m.quantityPerDose || '1 tablet'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: m.status === 'taken' ? '#dcfce7' : m.status === 'missed' ? '#fee2e2' : '#e2e8f0',
                        color: m.status === 'taken' ? '#15803d' : m.status === 'missed' ? '#b91c1c' : '#475569',
                      }}
                    >
                      {m.status === 'taken' ? 'Taken ✓' : m.status === 'missed' ? 'Missed ▲' : 'Upcoming ○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency & Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="primary-button compact"
                style={{ flex: 1, background: '#1b6b47' }}
                onClick={() => handleSendReminder(scheduleModalPatient)}
                disabled={nudgeBusyId === scheduleModalPatient.id}
              >
                <span>🔔</span> {nudgeBusyId === scheduleModalPatient.id ? 'Sending…' : 'Send Reminder'}
              </button>
              <button
                className="outline-button compact"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => {
                  const target = scheduleModalPatient;
                  setScheduleModalPatient(null);
                  setEmergencyModalPatient(target);
                }}
              >
                <span>📞</span> Emergency
              </button>
              <button className="outline-button compact" onClick={() => setScheduleModalPatient(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY MODAL */}
      {emergencyModalPatient && (
        <div className="modal-backdrop" onClick={() => setEmergencyModalPatient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(100%, 460px)', borderTop: '6px solid #dc2626' }}>
            <button className="close" onClick={() => setEmergencyModalPatient(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <h3 style={{ margin: 0, fontSize: 20, color: '#b91c1c' }}>Emergency Assistance</h3>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569' }}>
              Immediate contact and medical safety details for <strong>{emergencyModalPatient.name}</strong>.
            </p>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Primary Emergency Contact
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                {emergencyModalPatient.emergencyContact?.name || 'Designated Contact'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Relationship: {emergencyModalPatient.emergencyContact?.relation || 'Family'}
              </div>

              <a
                href={`tel:${emergencyModalPatient.emergencyContact?.phone || emergencyModalPatient.phone}`}
                className="primary-button"
                style={{
                  background: '#dc2626',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 12,
                  fontSize: 14,
                }}
              >
                <span>📞</span> Call {emergencyModalPatient.emergencyContact?.name || 'Contact'} ({emergencyModalPatient.emergencyContact?.phone || emergencyModalPatient.phone})
              </a>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Direct Patient Line
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 13, color: '#1e293b' }}>{emergencyModalPatient.phone || 'No phone registered'}</span>
                {emergencyModalPatient.phone && (
                  <a
                    href={`tel:${emergencyModalPatient.phone}`}
                    style={{
                      background: '#1b6b47',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    📞 Call Patient
                  </a>
                )}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: 11, color: '#92400e', marginTop: 12 }}>
              ⚠️ In case of life-threatening breathing difficulty, severe chest pain, or collapse, call <strong>911</strong> or local emergency services immediately.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="outline-button compact" onClick={() => setEmergencyModalPatient(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK PATIENT MODAL */}
      {linkModalOpen && (
        <div className="modal-backdrop" onClick={() => setLinkModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(100%, 420px)' }}>
            <button className="close" onClick={() => setLinkModalOpen(false)}>×</button>
            <p className="eyebrow">Care Circle Supervision</p>
            <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>Link a Patient</h3>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 16px' }}>
              Enter the patient's unique 6-character PillSync code (shown in their Profile or Dashboard).
            </p>

            <form onSubmit={handleLinkPatient} style={{ display: 'grid', gap: 14 }}>
              <label>
                Patient Code
                <input
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PS-479DE3"
                  style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, fontSize: 16 }}
                />
              </label>

              {notice && <div className="form-error">{notice}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={linking}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {linking ? <><span className="spinner" /> Connecting…</> : 'Connect Patient →'}
                </button>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => { setLinkModalOpen(false); setNotice(''); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="app-shell">
      <Sidebar user={user} active={active} setActive={setActive} logout={logout} />
      <main className="dashboard">{body}</main>
    </div>
  );
}

function AppMain() {
  const { t } = useLanguage();
  const [role, setRole] = useState('');
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [active, setActive] = useState('overview');
  const [globalNotice, setGlobalNotice] = useState('');

  async function reload(current = session) {
    if (!current) return;
    setData(await api(current.user.role === 'patient' ? '/patient/dashboard' : '/caregiver/dashboard'));
  }

  useEffect(() => {
    const saved = localStorage.getItem('user');
    const tok = localStorage.getItem('accessToken');
    if (saved && (tok || document.cookie.includes('pillsync_access'))) {
      try { const user = JSON.parse(saved); setRole(user.role); setSession({ user }); } catch {}
    } else if (saved) {
      try { const user = JSON.parse(saved); setRole(user.role); setSession({ user }); } catch {}
    }
  }, []);

  useEffect(() => {
    if (session) reload().catch(() => {
      try { localStorage.removeItem('user'); localStorage.removeItem('accessToken'); } catch {}
      setRole('');
      setSession(null);
    });
  }, [session]);

  // Global Socket — background sync, reconnect, nudge/alert for both roles
  useEffect(() => {
    if (!session) return;
    let sock;
    let visibleHandler;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const tok = localStorage.getItem('accessToken');
        sock = io('http://localhost:4000', { auth: tok ? { token: `Bearer ${tok}` } : {}, withCredentials: true });
        const onAlert = (payload) => {
          setGlobalNotice(`New: ${payload.title || 'update'}`);
          reload().catch(()=>{});
          setTimeout(()=> setGlobalNotice(''), 3500);
        };
        const onNudge = (payload) => {
          setGlobalNotice(payload.message || 'Caregiver sent a reminder');
          reload().catch(()=>{});
          setTimeout(()=> setGlobalNotice(''), 4000);
        };
        sock.on('alert', onAlert);
        sock.on('nudge', onNudge);
        sock.on('connect', () => { reload().catch(()=>{}); });
        sock.on('reconnect', () => { reload().catch(()=>{}); });
        visibleHandler = () => { if (document.visibilityState === 'visible') reload().catch(()=>{}); };
        document.addEventListener('visibilitychange', visibleHandler);
      } catch {}
    })();
    return () => { try { sock?.disconnect(); } catch {} try { document.removeEventListener('visibilitychange', visibleHandler); } catch {} };
  }, [session]);

  function logout() {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.clear();
    setRole('');
    setSession(null);
    setData(null);
  }

  if (!role) return <RoleChooser onChoose={setRole} />;
  if (!session) return <Auth key={role} role={role} back={() => setRole('')} done={(result) => { setSession(result); setRole(result.user.role); }} />;
  if (!data) return <div className="loading">Preparing your care space...</div>;

  return (
    <>
      {globalNotice && <div className="notice" style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 99, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>{globalNotice}</div>}
      {session.user.role === 'patient' 
        ? <PatientApp user={data.user} data={data} active={active} setActive={setActive} logout={logout} reload={reload} /> 
        : <CaregiverApp user={data.user} data={data} active={active} setActive={setActive} logout={logout} reload={reload} />}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppMain />
    </LanguageProvider>
  );
}
