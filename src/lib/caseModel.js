export const facilities = [
  "Cedar Ridge Assisted Living",
  "Hawthorne Manor",
  "Lakeview Skilled Nursing",
  "Prairie Oaks Memory Care",
  "Willow Creek Rehabilitation"
];

export const indicationGroups = [
  {
    id: "keratitis",
    label: "Keratitis",
    options: ["Superficial punctate keratitis", "Filamentary keratitis", "Exposure keratitis", "Neurotrophic keratitis"]
  },
  {
    id: "epithelial",
    label: "Epithelial compromise",
    options: ["Persistent epithelial defect", "Non-healing epithelial defect", "Corneal epithelial breakdown"]
  },
  {
    id: "erosion",
    label: "Erosion / dystrophy",
    options: ["Recurrent corneal erosion", "Anterior basement membrane dystrophy with epithelial compromise"]
  },
  {
    id: "severe",
    label: "Ulcer / severe surface compromise",
    options: ["Corneal ulcer support", "Corneal melt concern", "Post-surgical epithelial compromise"]
  },
  {
    id: "dryEyeDrivers",
    label: "Dry eye drivers to document",
    options: ["MGD", "Lid disease", "Exposure", "Allergy or inflammation", "Medication toxicity", "Tear-film instability"]
  }
];

export function createInitialCase() {
  return {
    localDraftId: crypto.randomUUID(),
    serverCaseId: "",
    organizationId: "demo-org-northstar",
    practiceName: "Northstar Mobile Eye Group",
    facility: facilities[0],
    ehrId: "",
    eye: "OD",
    indications: [],
    customIndication: "",
    objectiveFindings: "",
    priorMeasures: "",
    treatmentRationale: "",
    followUpDate: "",
    followUpPlan: "",
    notes: "",
    photos: [],
    incompleteAcknowledged: false,
    shareCandidate: false,
    adminApproval: false,
    syncStatus: "local_only",
    synced: false,
    updatedAt: new Date().toISOString()
  };
}

export function normalizeCase(savedCase) {
  return {
    ...createInitialCase(),
    ...savedCase,
    localDraftId: savedCase?.localDraftId || crypto.randomUUID(),
    syncStatus: savedCase?.syncStatus || (savedCase?.synced ? "synced" : "local_only"),
    photos: Array.isArray(savedCase?.photos) ? savedCase.photos : [],
    indications: Array.isArray(savedCase?.indications) ? savedCase.indications : []
  };
}

export function toOfflineDraftPayload(caseData) {
  return {
    ...caseData,
    // Sprint 1 intentionally keeps offline drafts text-only. Photo files stay out of IndexedDB.
    photos: []
  };
}
