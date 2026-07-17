import { normalizeCase, toOfflineDraftPayload } from "./caseModel";

const databaseName = "nova-field-guide-offline";
const storeName = "drafts";
const activeDraftKey = "active-case";
const keySessionName = "nova-field-guide-draft-key";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function getDraftKey() {
  const existing = window.sessionStorage.getItem(keySessionName);
  if (existing) {
    return crypto.subtle.importKey("raw", fromBase64(existing), "AES-GCM", false, ["encrypt", "decrypt"]);
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  window.sessionStorage.setItem(keySessionName, toBase64(raw));
  return key;
}

async function encryptPayload(payload) {
  const key = await getDraftKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(payload)));
  return {
    iv: toBase64(iv),
    encryptedPayload: toBase64(encrypted)
  };
}

async function decryptPayload(record) {
  const key = await getDraftKey();
  const encrypted = fromBase64(record.encryptedPayload);
  const iv = fromBase64(record.iv);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  return JSON.parse(decoder.decode(decrypted));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function loadActiveDraft() {
  const record = await withStore("readonly", (store) => store.get(activeDraftKey));
  if (!record) return null;
  const payload = await decryptPayload(record);
  return {
    ...record,
    payload: normalizeCase(payload)
  };
}

export async function saveActiveDraft(caseData) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const payload = toOfflineDraftPayload({ ...caseData, updatedAt: now.toISOString(), syncStatus: caseData.syncStatus || "pending_sync" });
  const encrypted = await encryptPayload(payload);

  return withStore("readwrite", (store) =>
    store.put({
      id: activeDraftKey,
      localDraftId: payload.localDraftId,
      organizationId: payload.organizationId,
      userId: "prototype-user",
      syncStatus: payload.syncStatus,
      createdAt: payload.createdAt || now.toISOString(),
      updatedAt: payload.updatedAt,
      expiresAt,
      schemaVersion: 1,
      ...encrypted
    })
  );
}

export async function clearActiveDraft() {
  return withStore("readwrite", (store) => store.delete(activeDraftKey));
}
