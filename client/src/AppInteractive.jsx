import { createContext, useContext, useEffect, useState, lazy, Suspense } from 'react';
import OcrReviewPanel from './OcrReviewPanel';
const AdherencePanel = lazy(() => import('./components/ui/AdherencePanel.jsx'));
const RefillPanel = lazy(() => import('./components/ui/RefillPanel.jsx'));
const History = lazy(() => import('./pages/patient/History.jsx'));
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
    ? [['overview', t('nav_overview')], ['medicines', t('nav_medicines')], ['scan', t('nav_scan')], ['refill', 'Refill'], ['history', t('nav_history')]] 
    : [['overview', t('nav_overview')], ['patients', t('nav_patients')], ['alerts', t('nav_alerts')]];
    
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
            <span className="nav-icon">{id === 'overview' ? '⌂' : id === 'scan' ? '▣' : id === 'alerts' ? '!' : id === 'history' ? '▥' : '◉'}</span>
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
  const [historyLogs, setHistoryLogs] = useState(null);
  const [historyDate, setHistoryDate] = useState('');
  const [snoozeTarget, setSnoozeTarget] = useState(null);
  const [optimistic, setOptimistic] = useState({});
  const [calendarDaily, setCalendarDaily] = useState([]);
  const [busyIds, setBusyIds] = useState({});

  async function dose(id, status, snoozeMinutes) {
    if (busyIds[id]) return;
    const prev = data.medicines.find(m=> m._id===id)?.status;
    setBusyIds(b=> ({ ...b, [id]: true }));
    setOptimistic(o=> ({ ...o, [id]: status }));
    setSnoozeTarget(null);
    try {
      const body = snoozeMinutes ? { status, snoozeMinutes } : { status };
      const res = await api(`/patient/medicines/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) });
      if (status === 'missed') setNotice('Dose marked missed \u25B2 Your caregiver has been notified.');
      else if (status === 'snoozed') setNotice(`Snoozed \u25F7 until ${res.snoozeUntil ? new Date(res.snoozeUntil).toLocaleTimeString() : ''}.`);
      else setNotice(`Dose marked taken \u2713`);
      await reload();
    } catch (error) {
      setOptimistic(o=> ({ ...o, [id]: prev }));
      // 409 double-tap guard
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

  const list = (
    <div className="medicine-grid">
      {(data.medicines.length ? data.medicines : [{ name: t('no_meds'), dose: t('start_here'), schedule: '--:--', slot: 'morning' }]).map((medicine, index) => {
        const status = optimistic[medicine._id] || medicine.status;
        const isPlaceholder = !medicine._id;
        return (
        <article className={`medicine-card ${medicine.slot}`} key={medicine._id || index} style={{ border: status==='taken' ? '1px solid #a9cdb6' : status==='missed' ? '1px solid #e8a09a' : '1px solid transparent' }}>
          <div className="card-top">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FormIcon type={medicine.formType} /><span className="time-icon">{medicine.slot === 'night' ? '☾' : '☼'}</span></span>
            <span className="pill-status" style={{ background: status==='taken' ? '#d8f2e5' : status==='missed' ? '#f8d7d3' : '#fff', color: status==='taken' ? '#2c7a59' : status==='missed' ? '#a35d4c' : '#6e7a73' }}>
              {status==='taken' ? 'Taken \u2713' : status==='missed' ? 'Missed \u25B2' : status==='snoozed' ? 'Snoozed \u25F7' : (medicine.status || 'upcoming')}
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

  let body = active === 'scan' ? (
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
    <div className="min-h-screen bg-[#fcfdf7] -m-12 p-8">
      <Header title="Settings." intro="Your local profile details." />
      <div className="border border-gray-200 p-6 rounded-lg flex items-center gap-6 bg-white mt-6">
        <div className="w-16 h-16 rounded-full bg-green-200 text-green-900 flex items-center justify-center text-2xl font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-right ml-auto">
          <h3 className="text-2xl font-serif font-bold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-600">{user.email} · {user.phone}</p>
          <p className="text-sm mt-1">Patient link code: <span className="font-mono font-bold bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200">{user.linkCode}</span></p>
        </div>
      </div>
      <div className="bg-green-50 text-green-800 p-4 rounded-md mt-6 text-sm leading-relaxed border border-green-100">
        <strong>All patient details in Compass:</strong> User (name/email/phone/conditions/linkCode/emergencyContacts) · Medicine (all medicines) · IntakeLog (reminders taken/missed/snoozed with istDate) · PrescriptionImage if OCR used.
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
      {list}
    </>
  );

  return (
    <div className="app-shell">
      <Sidebar user={user} active={active} setActive={setActive} logout={logout} />
      <main className="dashboard">
        {body}
        {modal === 'add' && <AddMedicine close={() => setModal('')} saved={save} />}
        {modal === 'ocr' && <OcrReviewPanel onClose={() => setModal('')} onSaved={save} />}
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
          <div className="modal-backdrop">
            <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto', textAlign: 'left' }}>
              <button className="close" type="button" onClick={() => setDetailMed(null)}>×</button>
              <p className="eyebrow">{t('detail_title')}</p>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', margin: '0 0 10px' }}>{detailMed.name}</h3>
              
              <div style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#7a837d', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('detail_dosage')}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{detailMed.dose} · {detailMed.schedule} ({t(`slot_${detailMed.slot}`)})</p>
                </div>

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
              
              <button className="primary-button" style={{ marginTop: '20px', width: '100%' }} onClick={() => setDetailMed(null)}>{t('detail_close')}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CaregiverApp({ user, data, active, setActive, logout, reload }) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [alertFilter, setAlertFilter] = useState('All');
  const [reportRange, setReportRange] = useState('weekly');
  const [reports, setReports] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [linking, setLinking] = useState(false);
  const [justLinkedId, setJustLinkedId] = useState(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [careFilter, setCareFilter] = useState('All');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nudgeBusy, setNudgeBusy] = useState(false);

  async function openDetail(patientId) {
    if (!patientId) return;
    // try router navigation if available, else inline fetch
    try {
      const maybeNavigate = window.location;
      if (maybeNavigate && maybeNavigate.pathname !== undefined && typeof window.history.pushState === 'function') {
        // fetch detail inline first; if router is active it will render PatientDetail page separately
        // For shell without router, show inline tray
      }
    } catch {}
    setDetailLoading(true);
    try {
      const d = await api(`/caregiver/patients/${patientId}/detail`);
      setDetail(d);
      // also push to history so dedicated view is bookmarkable when router is active
      try { window.history.pushState({}, '', `/caregiver/patients/${patientId}/detail`); } catch {}
    } catch (e) { setNotice(e.message); }
    finally { setDetailLoading(false); }
  }
  async function sendNudge(patientId) {
    setNudgeBusy(true);
    try {
      await api(`/caregiver/patients/${patientId}/nudge`, { method: 'POST' });
      setNotice('Reminder sent to patient \u2713');
      if (detail && detail.patient.id === patientId || detail && detail.patient._id === patientId) {
        const fresh = await api(`/caregiver/patients/${patientId}/detail`);
        setDetail(fresh);
      }
      reload();
    } catch (e) { setNotice(e.message); }
    finally { setNudgeBusy(false); }
  }
  
  async function link(event) {
    event.preventDefault();
    if (linking) return;
    setLinking(true);
    setNotice('');
    try {
      const result = await api('/link', { method: 'POST', body: JSON.stringify({ linkCode: code }) });
      setNotice(result.message);
      setJustLinkedId(result.patient?.id || result.patient?._id || null);
      setCode('');
      await reload();
      setTimeout(()=> setJustLinkedId(null), 1400);
    } catch (error) {
      setNotice(error.message);
    } finally { setLinking(false); }
  }
  async function revoke(patientId) {
    if (!window.confirm('Revoke access to this patient?')) return;
    try { await api(`/caregiver/link/${patientId}`, { method: 'DELETE' }); setNotice('Link revoked.'); reload(); } catch(e){ setNotice(e.message); }
  }
  useEffect(()=> {
    // socket now global in AppMain — keep reload on alertFilter change if needed but no new socket here
  }, [active]);
  useEffect(()=> {
    if (active==='alerts' && data.patients.length) {
      // fetch filtered alerts via API when filter changes
    }
  }, [alertFilter]);
  useEffect(()=> {
    if (active==='patients' || active==='overview') {
      // reports not needed
    }
    if (active==='alerts' && data) {
      // reports fetch if needed
    }
  }, []);
  useEffect(()=> {
    if (active==='overview' && data.patients.length && reportRange) {
      api(`/caregiver/reports?range=${reportRange}`).then(setReports).catch(()=> setReports([]));
    }
  }, [active, reportRange]);
  
  const switcher = data.patients.length > 1 ? (
    <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'8px 0', marginBottom:6 }}>
      {data.patients.map(p=> <button key={p.id} onClick={()=> setSelectedPatient(p.id)} style={{ display:'flex', alignItems:'center', gap:6, border: selectedPatient===p.id ? '2px solid #2c7a59':'1px solid #e2e8e1', borderRadius:20, padding:'4px 10px', background: selectedPatient===p.id?'#edf7f0':'#fff' }}><span className="avatar" style={{width:24,height:24,fontSize:12}}>{p.name[0]}</span>{p.name}</button>)}
    </div>
  ) : null;
  const displayPatients = careFilter==='All' ? data.patients : data.patients.filter(p => careFilter==='Healthy' ? !p.lowStock : p.lowStock);
  const cards = (
    <div className="patient-grid">
      {(displayPatients.length ? displayPatients : [{ name: 'No linked patients yet', adherence: 0, nextDose: t('cg_link_sub'), stock: 'Waiting', accessLevel: 'view' }]).map((patient, index) => {
        const isJustLinked = justLinkedId && (patient.id===justLinkedId || patient._id===justLinkedId);
        const stockColor = patient.lowStock ? '#a35d4c' : '#2c7a59';
        return (
        <article
          className={`patient-card ${isJustLinked ? 'slide-down' : ''}`}
          key={patient.id || index}
          style={{ border: selectedPatient===patient.id ? '2px solid #2c7a59' : isJustLinked ? '2px solid #a9cdb6' : undefined, cursor: patient.id ? 'pointer' : 'default' }}
          onClick={()=> { if (patient.id) { setSelectedPatient(patient.id); openDetail(patient.id); } }}
          tabIndex={patient.id ? 0 : -1}
          role={patient.id ? 'button' : undefined}
          onKeyDown={e=> { if (e.key==='Enter' && patient.id) openDetail(patient.id); }}
        >
          <div className="patient-head">
            <div className="avatar large">{patient.name[0]}</div>
            <div>
              <h4>{patient.name}</h4>
              <p>{t('patient_login')} · <span style={{ background: patient.accessLevel==='manage' ? '#2c7a59' : '#e2e8e1', color: patient.accessLevel==='manage'?'#fff':'#24302b', borderRadius:10, padding:'1px 6px', fontSize:10 }}>{patient.accessLevel === 'manage' ? 'Can manage' : 'View only'}</span></p>
            </div>
            <span className="health-dot" style={{ background: patient.lowStock ? '#e8a09a' : '#69b883' }} />
          </div>
          <div className="patient-stats">
            <div><span>{t('metric_adherence')}</span><strong>{patient.adherence}%</strong></div>
            <div><span>Next dose</span><strong>{patient.nextDose}</strong></div>
            <div><span>Stock</span><strong style={{ color: stockColor }}>{patient.stock}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e=> e.stopPropagation()}>
            {patient.id && <button onClick={()=> sendNudge(patient.id)} disabled={nudgeBusy} className="primary-button compact" style={{ minHeight: 44, flex: 1, opacity: 1 }}>{nudgeBusy ? <span className="spinner" /> : 'Send Reminder'}</button>}
            {patient.id && <button onClick={()=> revoke(patient.id)} style={{ fontSize: 11, color:'#a35d4c', background:'none', border:'1px solid #e2e8e1', borderRadius: 8, padding: '8px 10px', cursor:'pointer' }}>Revoke</button>}
          </div>
          <div style={{ fontSize: 11, color: '#7a837d', marginTop: 6, textAlign: 'center' }}>Tap card to see today's timeline — medicine taken ✓ / missed ▲ per dose</div>
        </article>
        );
      })}
    </div>
  );
  
  const linkPanel = (
    <div className="link-panel" id="link-form">
      <div>
        <p className="eyebrow">{t('auth_caregiver_title')}</p>
        <h3>{t('cg_link_title')}</h3>
        <p className="muted">{t('cg_link_sub')}</p>
      </div>
      <form onSubmit={link} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="PS-ABC123" style={{ flex: 1 }} />
        <button className="primary-button compact" disabled={linking} style={{ minWidth: 110, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {linking ? <><span className="spinner" /> Linking…</> : <>{t('cg_connect')} <span>→</span></>}
        </button>
      </form>
      {notice && <p className="notice inline" style={{ marginTop: 8 }}>{notice}</p>}
    </div>
  );
  
  let filteredAlerts = data.alerts || [];
  if (alertFilter !== 'All') {
    const f = alertFilter.toLowerCase();
    filteredAlerts = filteredAlerts.filter(a => a.type === f || a.type === alertFilter.toLowerCase().replace(' ','_'));
  }
  let body = active === 'alerts' ? (
    <>
      <Header title={t('cg_alert_title')} intro={t('cg_alert_sub')} />
      <div style={{ display:'flex', gap:6, margin:'12px 0' }}>
        {['All','Missed Dose','Low Stock','medicine_added'].map(chip=> <button key={chip} onClick={()=> setAlertFilter(chip)} style={{ borderRadius:16, padding:'6px 10px', border: alertFilter===chip?'2px solid #2c7a59':'1px solid #e2e8e1', background: alertFilter===chip?'#edf7f0':'#fff', fontSize:12 }}>{chip==='medicine_added'?'Medicine Added':chip}</button>)}
      </div>
      <div className="care-banner">
        <div>
          <p className="eyebrow">Notification center</p>
          <h3>{filteredAlerts.length} {alertFilter==='All'?'updates':alertFilter}</h3>
        </div>
      </div>
      {filteredAlerts.length ? filteredAlerts.map((alert) => (
        <div className="notice" key={alert._id}>{alert.title}: {alert.message} ({alert.type} · {alert.delivery})</div>
      )) : (
        <div className="notice">{t('cg_alert_empty')}</div>
      )}
      {reports && <div style={{ marginTop:16 }}><h4>Reports ({reportRange})</h4>{reports.map(r=> <div key={r.patient.id} style={{ background:'#fff', border:'1px solid #e2e8e1', borderRadius:8, padding:8, marginBottom:6 }}>{r.patient.name}: {r.adherence}% ({r.taken} taken/{r.missed} missed)</div>)}<div style={{ display:'flex', gap:6 }}><button className={reportRange==='weekly'?'primary-button compact':'outline-button compact'} onClick={()=> setReportRange('weekly')}>Weekly</button><button className={reportRange==='monthly'?'primary-button compact':'outline-button compact'} onClick={()=> setReportRange('monthly')}>Monthly</button></div></div>}
    </>
  ) : active === 'settings' ? (
    <div className="min-h-screen bg-[#fcfdf7] -m-12 p-8">
      <Header title="Settings." intro="Your caregiver profile and connections." />
      <div className="border border-gray-200 p-6 rounded-lg flex items-center gap-6 bg-white mt-6">
        <div className="w-16 h-16 rounded-full bg-green-200 text-green-900 flex items-center justify-center text-2xl font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-right ml-auto">
          <h3 className="text-2xl font-serif font-bold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-600">{user.email} · {user.phone}</p>
          <p className="text-sm text-slate-500 mt-1">Access level: <span className="font-semibold text-slate-600">View only</span></p>
        </div>
      </div>
    </div>
  ) : (
    <>
      <Header title={t('cg_everyone')} intro={t('cg_sub')} action={<button className="outline-button" onClick={() => document.getElementById('link-form').scrollIntoView()}>{t('cg_link_title')}</button>} />
      <div className="care-banner care-banner-clickable" onClick={()=> setBannerOpen(o=> !o)} role="button" tabIndex={0} onKeyDown={e=> { if (e.key==='Enter') setBannerOpen(o=>!o); }} style={{ position: 'relative' }}>
        <div>
          <p className="eyebrow">{t('cg_banner_title')}</p>
          <h3>{data.patients.length}{data.patients.length === 1 ? t('cg_banner_patient') : t('cg_banner_patients')}</h3>
          <p className="muted">{t('cg_banner_desc')} {data.patients.length>1 ? '· tap to filter' : ''}</p>
        </div>
        <div className="circle-graphic">♡</div>
        {bannerOpen && data.patients.length>1 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8e1', borderRadius: 10, marginTop: 8, padding: 8, display: 'flex', gap: 6, zIndex: 5 }} onClick={e=> e.stopPropagation()}>
            {['All','Healthy','Low Stock'].map(f=> <button key={f} onClick={()=> { setCareFilter(f==='Low Stock' ? 'LowStock' : f); setBannerOpen(false); }} style={{ flex: 1, borderRadius: 20, padding: '8px 10px', border: careFilter===(f==='Low Stock'?'LowStock':f) ? '2px solid #2c7a59':'1px solid #e2e8e1', background: careFilter===(f==='Low Stock'?'LowStock':f) ? '#edf7f0':'#fff', fontSize: 12 }}>{f}</button>)}
          </div>
        )}
      </div>
      <div className="section-heading"><h3>Patient overview</h3><span style={{ fontSize:11, color:'#7a837d' }}>Socket: {notice ? 'live' : 'idle'} · taps: card → detail with timeline</span></div>
      {switcher}
      {cards}
      {detailLoading && <div className="notice" style={{ marginTop: 12 }}><span className="spinner" /> Loading detail…</div>}
      {detail && (
        <div className="slide-down" style={{ marginTop: 16, background: '#fff', border: '1px solid #e2e8e1', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{detail.patient.name} — today's timeline</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="primary-button compact" onClick={()=> sendNudge(detail.patient.id || detail.patient._id)} disabled={nudgeBusy || !detail.hasOverdue} style={{ minHeight: 44 }}>{nudgeBusy ? <span className="spinner" /> : 'Send Reminder'}</button>
              <button className="outline-button compact" onClick={()=> setDetail(null)}>Close</button>
            </div>
          </div>
          {!detail.hasOverdue && <p className="muted" style={{ fontSize: 11, margin: '6px 0 0' }}>No overdue doses right now — all taken ✓ or upcoming.</p>}
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {detail.timeline.map(row=> (
              <div key={row.medicineId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${row.status==='taken'?'#a9cdb6': row.status==='missed'?'#e8a09a':'#e2e8e1'}`, background: row.status==='taken'?'#edf7f0': row.status==='missed'?'#fae9e4':'#fff', borderRadius: 10, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{row.schedule} · {row.slot} — {row.name} {row.formType==='tablet' || row.formType==='oral' ? '💊' : row.formType==='liquid'?'🧃':row.formType==='injection'?'💉':'💊'}</div>
                  <div style={{ fontSize: 11, color: '#7a837d' }}>{row.dose}{row.quantityPerDose? ` · ${row.quantityPerDose}`:''} {row.logAt? `· ${new Date(row.logAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`:''}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 11, color: row.status==='taken'?'#2c7a59': row.status==='missed'?'#a35d4c':'#8a7a2b' }}>
                  {row.status==='taken'?'Taken \u2713': row.status==='missed'?'Missed \u25B2': row.status==='snoozed'?'Snoozed \u25F7':'Upcoming \u25CB'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 13 }}>Inventory runway</h4>
              {detail.refillRows.map(r=> (
                <div key={r._id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f3ef', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{r.name}</strong><span style={{ color: r.lowStock?'#a35d4c':'#2c7a59', fontWeight: 700 }}>{r.runwayText}</span></div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 13 }}>Emergency contacts</h4>
              {(detail.patient.emergencyContacts && detail.patient.emergencyContacts.length) ? detail.patient.emergencyContacts.map((c,i)=> (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f0f3ef' }}><span><strong>{c.name}</strong> ({c.relation})</span><a href={`tel:${c.phone}`} style={{ color:'#2c7a59', fontWeight:700 }}>{c.phone}</a></div>
              )) : (
                <div style={{ fontSize: 12, padding: '6px 0' }}><span><strong>{detail.patient.name}</strong> (self)</span> — <a href={`tel:${detail.patient.phone}`} style={{ color:'#2c7a59', fontWeight:700 }}>{detail.patient.phone}</a><div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Primary phone shown. Add contacts on patient profile.</div></div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="outline-button compact" onClick={()=> { try { window.history.pushState({}, '', `/caregiver/patients/${detail.patient.id || detail.patient._id}/detail`); } catch{}; window.location.href = `/caregiver/patients/${detail.patient.id || detail.patient._id}/detail`; }}>Open dedicated view →</button>
            <a href={`tel:${detail.patient.phone}`} className="primary-button compact" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Call patient</a>
          </div>
        </div>
      )}
      {linkPanel}
      {reports && <div style={{ marginTop:12, background:'#fff', border:'1px solid #e2e8e1', borderRadius:10, padding:12 }}><div style={{ display:'flex', justifyContent:'space-between' }}><strong>Adherence reports ({reportRange})</strong><span><button className={reportRange==='weekly'?'primary-button compact':'outline-button compact'} onClick={()=> setReportRange('weekly')}>Weekly</button> <button className={reportRange==='monthly'?'primary-button compact':'outline-button compact'} onClick={()=> setReportRange('monthly')}>Monthly</button></span></div>{reports.map(r=> <div key={r.patient.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f0f3ef' }}><span>{r.patient.name}</span><strong>{r.adherence}%</strong></div>)}</div>}
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
