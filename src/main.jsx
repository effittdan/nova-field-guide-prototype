import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileText,
  Info,
  Mic,
  MonitorPlay,
  PlayCircle,
  QrCode,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  X,
  WifiOff
} from "lucide-react";
import { createInitialCase, facilities, indicationGroups as fallbackIndicationGroups, normalizeCase } from "./lib/caseModel";
import { loadIndicationGroups } from "./lib/indicationCatalog";
import { loadActiveDraft, saveActiveDraft } from "./lib/offlineStore";
import { isSupabaseConfigured, photoUploadsEnabled } from "./lib/supabaseClient";
import "./styles.css";

const demoSteps = [
  {
    title: "Launch from the treatment card",
    cue: "Point to Scan treatment card.",
    talk: "The QR code opens a phone-friendly field tool. For first-time users, the PWA can suggest adding it to the home screen.",
    actionLabel: "Show launch"
  },
  {
    title: "Load a realistic mobile case",
    cue: "Tap Load sample case.",
    talk: "The clinician uses a practice or EHR ID instead of a patient name by default. The app helps the chart tell the clinical story without collecting unnecessary identifiers.",
    actionLabel: "Load sample"
  },
  {
    title: "Walk through indications",
    cue: "Show the grouped indication checklist.",
    talk: "Dry-eye drivers can be documented, but dry eye alone is not treated as the reason. The focus is surface compromise, prior measures, rationale, and follow-up.",
    actionLabel: "Show indications"
  },
  {
    title: "Capture photo support",
    cue: "Open the camera preview.",
    talk: "Pre-treatment photos can support documentation. Production photo handling would need HIPAA-ready storage, access control, consent rules, and audit logging.",
    actionLabel: "Open camera"
  },
  {
    title: "Add voice note",
    cue: "Show the voice note demo.",
    talk: "The first version can use native phone dictation so clinicians can document findings quickly in the field.",
    actionLabel: "Show voice"
  },
  {
    title: "Show missing pieces",
    cue: "Open the status suggestions.",
    talk: "Green, yellow, and red are documentation completeness signals. They do not approve or deny treatment.",
    actionLabel: "Open status"
  },
  {
    title: "Close on facility oversight",
    cue: "Open Facility view.",
    talk: "Facility-level reporting helps supervisors see cases started, complete charts, follow-up gaps, and documentation patterns.",
    actionLabel: "Show facility"
  }
];

function completeness(caseData, indicationCatalog) {
  const missing = [];
  if (!caseData.facility) missing.push("Facility");
  if (!caseData.ehrId) missing.push("Practice/EHR ID");
  if (!caseData.indications.length && !caseData.customIndication) missing.push("Indication");
  if (!caseData.objectiveFindings) missing.push("Objective findings");
  if (!caseData.priorMeasures) missing.push("Prior measures");
  if (!caseData.treatmentRationale) missing.push("Why Nova may fit now");
  if (!caseData.photos.length) missing.push("Pre-treatment photo");
  if (!caseData.followUpDate && !caseData.followUpPlan) missing.push("Follow-up plan");

  const dryOnly =
    caseData.indications.length > 0 &&
    caseData.indications.every((item) => indicationCatalog.find((group) => group.id === "dryEyeDrivers")?.options.includes(item));
  if (dryOnly) missing.push("Ocular surface indication beyond dry-eye driver");

  if (missing.length === 0) return { level: "green", label: "Strong documentation", missing };
  if (missing.length <= 3 || caseData.incompleteAcknowledged) return { level: "yellow", label: "Needs detail", missing };
  return { level: "red", label: "Use caution", missing };
}

function bestPracticeBullets(caseData, status) {
  if (status.missing.includes("Ocular surface indication beyond dry-eye driver")) {
    return [
      "Document the surface compromise, not dry eye alone.",
      "Connect the finding to prior measures and why amnion is clinically appropriate now.",
      "Keep driver management active: lids, exposure, inflammation, allergy, toxicity, or neurotrophic features."
    ];
  }
  if (caseData.indications.some((item) => item.toLowerCase().includes("spk") || item.toLowerCase().includes("punctate"))) {
    return [
      "Record staining pattern, severity, location, and chronicity.",
      "List prior measures and why a protected surface environment is being considered now.",
      "Add pre-treatment photos when image quality is clinically useful."
    ];
  }
  if (caseData.indications.some((item) => item.toLowerCase().includes("neurotrophic"))) {
    return [
      "Document corneal sensation concern, epithelial status, and risk factors.",
      "Include follow-up timing because mobile-site continuity can be uneven.",
      "Note escalation criteria if the surface worsens or fails to improve."
    ];
  }
  return [
    "Start with objective findings and the clinical problem.",
    "Document prior measures, rationale, and follow-up plan.",
    "Use photos to support the chart when image quality is adequate."
  ];
}

function App() {
  const [caseData, setCaseData] = useState(() => createInitialCase());
  const [indicationCatalog, setIndicationCatalog] = useState(fallbackIndicationGroups);
  const [catalogStatus, setCatalogStatus] = useState({
    source: "loading",
    message: "Checking Supabase indication list."
  });
  const [activeTab, setActiveTab] = useState("case");
  const [openGroup, setOpenGroup] = useState("keratitis");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCameraDemo, setShowCameraDemo] = useState(false);
  const [showVoiceDemo, setShowVoiceDemo] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [installReady, setInstallReady] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("Preparing encrypted draft storage.");

  const status = useMemo(() => completeness(caseData, indicationCatalog), [caseData, indicationCatalog]);
  const bullets = useMemo(() => bestPracticeBullets(caseData, status), [caseData, status]);

  useEffect(() => {
    let active = true;

    loadIndicationGroups()
      .then((result) => {
        if (!active) return;
        setIndicationCatalog(result.groups);
        setCatalogStatus({ source: result.source, message: result.message });
      })
      .catch(() => {
        if (!active) return;
        setIndicationCatalog(fallbackIndicationGroups);
        setCatalogStatus({
          source: "fallback",
          message: "Supabase unavailable; using local demo indication list."
        });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    loadActiveDraft()
      .then((savedDraft) => {
        if (!active) return;
        if (savedDraft?.payload) {
          setCaseData(normalizeCase(savedDraft.payload));
          setOfflineMessage("Encrypted text draft restored from this device.");
        } else {
          setOfflineMessage("Encrypted text drafts are enabled for this device.");
        }
      })
      .catch(() => {
        if (active) setOfflineMessage("Offline draft storage is unavailable in this browser session.");
      })
      .finally(() => {
        if (active) setDraftReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftReady) return;

    saveActiveDraft(caseData)
      .then(() => setOfflineMessage("Encrypted text draft saved on this device. Photos are not stored offline in Sprint 1."))
      .catch(() => setOfflineMessage("Draft could not be saved offline in this browser session."));
  }, [caseData, draftReady]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
    const handler = (event) => {
      event.preventDefault();
      setInstallReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const update = (key, value) =>
    setCaseData((current) => ({ ...current, [key]: value, syncStatus: "pending_sync", synced: false }));

  const toggleIndication = (value) => {
    setCaseData((current) => {
      const exists = current.indications.includes(value);
      return {
        ...current,
        indications: exists ? current.indications.filter((item) => item !== value) : [...current.indications, value],
        syncStatus: "pending_sync",
        synced: false
      };
    });
  };

  const addPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const photo = { name: file.name, type: "Pre-treatment", time: new Date().toLocaleString() };
    setCaseData((current) => ({ ...current, photos: [...current.photos, photo], syncStatus: "pending_sync", synced: false }));
  };

  const startDemoCase = () => {
    setCaseData((current) => ({
      ...current,
      ehrId: "EHR-10482",
      facility: "Cedar Ridge Assisted Living",
      eye: "OS",
      indications: ["Superficial punctate keratitis", "MGD", "Exposure"],
      objectiveFindings: "Diffuse inferior staining with nonspecific epithelial compromise. Mobile-facility exam notes exposure and lid disease context.",
      priorMeasures: "Lubrication, lid hygiene, environmental exposure management, and reassessment of inflammatory contributors documented by clinician.",
      treatmentRationale: "Nova considered as a clinician-directed option to support a protected ocular surface environment when documentation supports surface compromise.",
      followUpDate: "2026-07-20",
      followUpPlan: "Recheck surface status and capture post-treatment photo at next facility visit.",
      notes: "Demo case for partner walkthrough. No real patient data.",
      syncStatus: "pending_sync",
      synced: false
    }));
    setOpenGroup("keratitis");
    setActiveTab("case");
  };

  const closeDemoSurfaces = () => {
    setShowCameraDemo(false);
    setShowVoiceDemo(false);
    setShowSuggestions(false);
  };

  const beginDemoMode = () => {
    closeDemoSurfaces();
    setDemoStep(0);
    setDemoMode(true);
  };

  const endDemoMode = () => {
    closeDemoSurfaces();
    setDemoMode(false);
  };

  const runDemoStep = (stepIndex = demoStep) => {
    closeDemoSurfaces();
    if (stepIndex === 1) {
      startDemoCase();
      return;
    }
    if (stepIndex === 2) {
      setActiveTab("case");
      setOpenGroup("dryEyeDrivers");
      return;
    }
    if (stepIndex === 3) {
      setShowCameraDemo(true);
      return;
    }
    if (stepIndex === 4) {
      setShowVoiceDemo(true);
      return;
    }
    if (stepIndex === 5) {
      setShowSuggestions(true);
      return;
    }
    if (stepIndex === 6) {
      setActiveTab("manager");
    }
  };

  const nextDemoStep = () => {
    const next = Math.min(demoStep + 1, demoSteps.length - 1);
    closeDemoSurfaces();
    setDemoStep(next);
  };

  const useDemoPhoto = () => {
    const photo = { name: "adapter-anterior-segment-demo.jpg", type: "Pre-treatment", time: new Date().toLocaleString() };
    setCaseData((current) => ({ ...current, photos: [...current.photos, photo], syncStatus: "pending_sync", synced: false }));
    setShowCameraDemo(false);
    setActiveTab("photos");
  };

  const addVoiceSample = () => {
    update(
      "notes",
      "Voice note demo: patient seen at facility. Surface findings and prior measures reviewed. Follow-up photo requested at next mobile visit."
    );
    setShowVoiceDemo(false);
  };

  const summary = [
    `Facility: ${caseData.facility || "Not entered"}`,
    `Practice/EHR ID: ${caseData.ehrId || "Not entered"}`,
    `Eye: ${caseData.eye}`,
    `Indications: ${[...caseData.indications, caseData.customIndication].filter(Boolean).join(", ") || "Not entered"}`,
    `Objective findings: ${caseData.objectiveFindings || "Not entered"}`,
    `Prior measures: ${caseData.priorMeasures || "Not entered"}`,
    `Rationale: ${caseData.treatmentRationale || "Not entered"}`,
    `Follow-up: ${caseData.followUpDate || "No date"} ${caseData.followUpPlan || ""}`.trim(),
    `Notes: ${caseData.notes || "Not entered"}`,
    "Best-practice reminder: Clinician judgment, IFU, payer policies, documentation, and practice procedures control final decisions."
  ].join("\n");

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Nova Field Guide</p>
          <h1>{caseData.practiceName}</h1>
        </div>
        <button className={`status-dot ${status.level}`} onClick={() => setShowSuggestions(true)} aria-label="Open documentation suggestions">
          <span>{status.label}</span>
        </button>
      </header>

      <section className="install-strip">
        <WifiOff size={18} />
        <span>{offlineMessage} {isSupabaseConfigured ? "Supabase client configured." : "Supabase is not connected yet."}</span>
        <span className={`data-source-pill ${catalogStatus.source}`}>{catalogStatus.message}</span>
        {installReady && <button className="text-button">Install</button>}
      </section>

      <section className="demo-rail" aria-label="Partner demo actions">
        <div className="demo-card">
          <QrCode size={24} />
          <div>
            <strong>Scan treatment card</strong>
            <span>QR opens this PWA and suggests install for first-time users.</span>
          </div>
        </div>
        <button className="demo-action demo-mode-action" onClick={beginDemoMode}><MonitorPlay size={18} /> Demo mode</button>
        <button className="demo-action" onClick={startDemoCase}><PlayCircle size={18} /> Load sample case</button>
        <button className="demo-action" onClick={() => setShowCameraDemo(true)}><Camera size={18} /> Open camera</button>
        <button className="demo-action" onClick={() => setShowVoiceDemo(true)}><Mic size={18} /> Voice note</button>
        <button className="demo-action" onClick={() => setShowSuggestions(true)}><Info size={18} /> Missing pieces</button>
      </section>

      <nav className="tabs" aria-label="Prototype sections">
        <button className={activeTab === "case" ? "active" : ""} onClick={() => setActiveTab("case")}><ClipboardCheck size={18} /> Case</button>
        <button className={activeTab === "photos" ? "active" : ""} onClick={() => setActiveTab("photos")}><Camera size={18} /> Photos</button>
        <button className={activeTab === "summary" ? "active" : ""} onClick={() => setActiveTab("summary")}><FileText size={18} /> Summary</button>
        <button className={activeTab === "manager" ? "active" : ""} onClick={() => setActiveTab("manager")}><Building2 size={18} /> Facility</button>
      </nav>

      {activeTab === "case" && (
        <section className="content-grid">
          <div className="panel">
            <div className="section-heading">
              <ShieldCheck size={20} />
              <div>
                <h2>Field Case</h2>
                <p>Use practice/EHR ID instead of patient name in this prototype.</p>
              </div>
            </div>
            <label>
              Managing medical group
              <input value={caseData.practiceName} onChange={(event) => update("practiceName", event.target.value)} />
            </label>
            <label>
              Facility
              <select value={caseData.facility} onChange={(event) => update("facility", event.target.value)}>
                {facilities.map((facility) => <option key={facility}>{facility}</option>)}
              </select>
            </label>
            <div className="field-row">
              <label>
                Practice/EHR ID
                <input value={caseData.ehrId} onChange={(event) => update("ehrId", event.target.value)} placeholder="Example: EHR-10482" />
              </label>
              <label>
                Eye
                <select value={caseData.eye} onChange={(event) => update("eye", event.target.value)}>
                  <option>OD</option>
                  <option>OS</option>
                  <option>OU</option>
                </select>
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <ClipboardCheck size={20} />
              <div>
                <h2>Indication Check</h2>
                <p>Grouped for fast mobile use. Dry-eye drivers do not stand alone.</p>
              </div>
            </div>
            {indicationCatalog.map((group) => (
              <div className="accordion" key={group.id}>
                <button onClick={() => setOpenGroup(openGroup === group.id ? "" : group.id)}>
                  {group.label}
                  <ChevronDown size={18} />
                </button>
                {openGroup === group.id && (
                  <div className="chips">
                    {group.options.map((item) => (
                      <button key={item} className={caseData.indications.includes(item) ? "selected" : ""} onClick={() => toggleIndication(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <label>
              Other clinician-documented indication
              <input value={caseData.customIndication} onChange={(event) => update("customIndication", event.target.value)} />
            </label>
            <button className="secondary wide-action" onClick={() => setShowSuggestions(true)}><Info size={18} /> Show documentation status</button>
          </div>

          <div className="panel">
            <div className="section-heading">
              <Mic size={20} />
              <div>
                <h2>Clinical Notes</h2>
                <p>Use phone dictation from the keyboard microphone where available.</p>
              </div>
            </div>
            <button className="voice-card" onClick={() => setShowVoiceDemo(true)}>
              <Mic size={22} />
              <span>Tap to show voice input demo</span>
            </button>
            <label>
              Objective findings
              <textarea value={caseData.objectiveFindings} onChange={(event) => update("objectiveFindings", event.target.value)} />
            </label>
            <label>
              Prior measures / driver management
              <textarea value={caseData.priorMeasures} onChange={(event) => update("priorMeasures", event.target.value)} />
            </label>
            <label>
              Why Nova may fit now
              <textarea value={caseData.treatmentRationale} onChange={(event) => update("treatmentRationale", event.target.value)} />
            </label>
          </div>

          <div className="panel best-practice">
            <div className="section-heading">
              <Info size={20} />
              <div>
                <h2>3 Best-Practice Prompts</h2>
                <p>Sparse prompts based on the case so far.</p>
              </div>
            </div>
            <ol>
              {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ol>
          </div>
        </section>
      )}

      {activeTab === "photos" && (
        <section className="content-grid">
          <div className="panel">
            <div className="section-heading">
              <Camera size={20} />
              <div>
                <h2>Pre-Treatment Photos</h2>
                <p>Prototype supports phone capture or import from adapter/slit-lamp workflow.</p>
              </div>
            </div>
            <label className="upload-zone">
              <input type="file" accept="image/*" capture="environment" onChange={addPhoto} />
              <Camera size={28} />
              <span>Capture or import photo</span>
            </label>
            <button className="secondary wide-action" onClick={() => setShowCameraDemo(true)}><Camera size={18} /> Show camera preview</button>
            <div className="photo-list">
              {caseData.photos.length === 0 && <p>No photos added yet.</p>}
              {caseData.photos.map((photo, index) => (
                <div className="photo-item" key={`${photo.name}-${index}`}>
                  <Camera size={18} />
                  <div>
                    <strong>{photo.type}</strong>
                    <span>{photo.name} - {photo.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Follow-Up</h2>
            <label>
              Follow-up due
              <input type="date" value={caseData.followUpDate} onChange={(event) => update("followUpDate", event.target.value)} />
            </label>
            <label>
              Outcome / reassessment plan
              <textarea value={caseData.followUpPlan} onChange={(event) => update("followUpPlan", event.target.value)} />
            </label>
            <label>
              Additional notes
              <textarea value={caseData.notes} onChange={(event) => update("notes", event.target.value)} />
            </label>
          </div>
        </section>
      )}

      {activeTab === "summary" && (
        <section className="content-grid">
          <div className="panel">
            <div className="section-heading">
              <FileText size={20} />
              <div>
                <h2>Chart Summary Draft</h2>
                <p>Designed to be copied into the practice workflow or EHR template.</p>
              </div>
            </div>
            <pre>{summary}</pre>
            <div className="action-row">
              <button className="primary" onClick={() => navigator.clipboard?.writeText(summary)}><Download size={18} /> Copy summary</button>
              <button className="secondary" onClick={() => {
                setCaseData((current) => ({ ...current, synced: true, syncStatus: "synced" }));
              }}><CheckCircle2 size={18} /> Mark synced</button>
            </div>
          </div>

          <div className="panel">
            <h2>Case Study Candidate</h2>
            <p className="muted">Cases shared with AmniOptix should be de-identified and approved by practice administration before submission.</p>
            <label className="checkline">
              <input type="checkbox" checked={caseData.shareCandidate} onChange={(event) => update("shareCandidate", event.target.checked)} />
              Clinician wants to submit as a unique or satisfying case.
            </label>
            <label className="checkline">
              <input type="checkbox" checked={caseData.adminApproval} onChange={(event) => update("adminApproval", event.target.checked)} />
              Practice admin approval obtained.
            </label>
            <button className="primary" disabled={!caseData.shareCandidate || !caseData.adminApproval || !isSupabaseConfigured}><Send size={18} /> Prepare share packet</button>
            {!isSupabaseConfigured && <p className="muted">Production sharing will unlock after Supabase is connected.</p>}
          </div>
        </section>
      )}

      {activeTab === "manager" && (
        <section className="content-grid manager-grid">
          <div className="panel">
            <h2>Facility Snapshot</h2>
            <div className="metric"><strong>8</strong><span>Cases started this month</span></div>
            <div className="metric"><strong>6</strong><span>Complete charts</span></div>
            <div className="metric"><strong>2</strong><span>Follow-up notes due</span></div>
          </div>
          <div className="panel">
            <h2>Pattern Review</h2>
            <ul className="review-list">
              <li><span className="mini-dot green"></span> Complete chart examples are increasing.</li>
              <li><span className="mini-dot yellow"></span> Two cases lack pre-treatment photos.</li>
              <li><span className="mini-dot red"></span> One SPK-only case needs more objective context.</li>
            </ul>
          </div>
          <div className="panel">
            <h2>Partner Branding</h2>
            <p className="muted">Prototype uses one reusable app with configurable medical group name, facility directory, and restrained AmniOptix support attribution.</p>
            <button className="secondary"><Settings size={18} /> Configure group</button>
          </div>
        </section>
      )}

      <footer>
        <span>Appropriate-use and documentation best-practice prototype.</span>
        <span>Powered with quiet support from AmniOptix.</span>
      </footer>

      {showSuggestions && (
        <div className="drawer-backdrop" onClick={() => setShowSuggestions(false)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <AlertTriangle size={20} />
              <div>
                <h2>{status.label}</h2>
                <p>Suggestions only. Clinical judgment controls final decisions.</p>
              </div>
            </div>
            {status.missing.length === 0 ? (
              <p>Core documentation fields are complete for this prototype.</p>
            ) : (
              <ul className="missing-list">
                {status.missing.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            <label className="checkline">
              <input
                type="checkbox"
                checked={caseData.incompleteAcknowledged}
                onChange={(event) => update("incompleteAcknowledged", event.target.checked)}
              />
              Proceeding based on clinician judgment with incomplete documentation.
            </label>
            <button className="primary" onClick={() => setShowSuggestions(false)}>Close</button>
          </aside>
        </div>
      )}

      {demoMode && (
        <aside className="demo-coach" aria-live="polite">
          <div className="demo-coach-top">
            <span>Demo mode</span>
            <button onClick={endDemoMode} aria-label="Close demo mode"><X size={18} /></button>
          </div>
          <div className="demo-progress">
            {demoSteps.map((step, index) => (
              <span key={step.title} className={index <= demoStep ? "active" : ""}></span>
            ))}
          </div>
          <p className="demo-step-count">Step {demoStep + 1} of {demoSteps.length}</p>
          <h2>{demoSteps[demoStep].title}</h2>
          <p className="demo-cue">{demoSteps[demoStep].cue}</p>
          <p>{demoSteps[demoStep].talk}</p>
          <div className="demo-coach-actions">
            <button className="secondary" onClick={() => setDemoStep(Math.max(demoStep - 1, 0))} disabled={demoStep === 0}>Back</button>
            <button className="primary" onClick={() => runDemoStep()}>{demoSteps[demoStep].actionLabel}</button>
            {demoStep < demoSteps.length - 1 ? (
              <button className="secondary" onClick={nextDemoStep}>Next</button>
            ) : (
              <button className="secondary" onClick={endDemoMode}>Done</button>
            )}
          </div>
        </aside>
      )}

      {showCameraDemo && (
        <div className="drawer-backdrop" onClick={() => setShowCameraDemo(false)}>
          <aside className="phone-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCameraDemo(false)} aria-label="Close camera demo"><X size={20} /></button>
            <div className="camera-frame">
              <div className="camera-ui-top">
                <span>Anterior segment</span>
                <span>Adapter mode</span>
              </div>
              <div className="eye-preview">
                <span></span>
              </div>
              <div className="camera-ui-bottom">
                <button className="shutter" onClick={useDemoPhoto} aria-label="Use demo photo"></button>
              </div>
            </div>
            <div className="modal-copy">
              <h2>Capture Pre-Treatment Photo</h2>
              <p>Demo preview for phone adapter or slit-lamp import. Sprint 1 keeps offline drafts text-only; production photo upload is {photoUploadsEnabled ? "enabled by environment flag" : "disabled until policy approval"}.</p>
              <button className="primary" onClick={useDemoPhoto}><Camera size={18} /> Use demo photo</button>
            </div>
          </aside>
        </div>
      )}

      {showVoiceDemo && (
        <div className="drawer-backdrop" onClick={() => setShowVoiceDemo(false)}>
          <aside className="phone-modal voice-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowVoiceDemo(false)} aria-label="Close voice demo"><X size={20} /></button>
            <div className="voice-pulse">
              <Mic size={34} />
              <span></span>
              <span></span>
            </div>
            <div className="modal-copy">
              <h2>Voice Note</h2>
              <p>Native dictation can be used from the phone keyboard. This demo inserts a sample clinician note for the walkthrough.</p>
              <div className="dictation-preview">
                “Surface findings reviewed. Prior measures documented. Follow-up photo requested at next mobile visit.”
              </div>
              <button className="primary" onClick={addVoiceSample}><Smartphone size={18} /> Insert voice note</button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
