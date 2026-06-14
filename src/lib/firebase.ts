import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:000000:web:000000",
};

// Initialize Firebase (avoid re-init in dev hot-reload)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

// ── Firestore helpers ─────────────────────────────────────────────────────────

// Convert Firestore timestamps to ISO strings
function normalizeTimestamps(data: DocumentData): DocumentData {
  const result: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = normalizeTimestamps(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ── User Profile ──────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string) {
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return normalizeTimestamps(snap.data());
}

export async function createUserProfile(uid: string, data: object) {
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
}

export async function updateUserProfile(uid: string, data: object) {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

// ── Emission Entries ──────────────────────────────────────────────────────────

export async function addEmissionEntry(uid: string, entry: object) {
  const col = collection(db, "users", uid, "emissions");
  const docRef = await addDoc(col, { ...entry, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getEmissionEntries(uid: string, limitCount = 50) {
  const col = collection(db, "users", uid, "emissions");
  const q = query(col, orderBy("date", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...normalizeTimestamps(d.data()), id: d.id }));
}

export async function deleteEmissionEntry(uid: string, entryId: string) {
  await deleteDoc(doc(db, "users", uid, "emissions", entryId));
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function addGoal(uid: string, goal: object) {
  const col = collection(db, "users", uid, "goals");
  const docRef = await addDoc(col, { ...goal, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getGoals(uid: string) {
  const col = collection(db, "users", uid, "goals");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...normalizeTimestamps(d.data()), id: d.id }));
}

export async function updateGoal(uid: string, goalId: string, data: object) {
  await updateDoc(doc(db, "users", uid, "goals", goalId), data);
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function addAction(uid: string, action: object) {
  const col = collection(db, "users", uid, "actions");
  const docRef = await addDoc(col, { ...action, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getActions(uid: string) {
  const col = collection(db, "users", uid, "actions");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...normalizeTimestamps(d.data()), id: d.id }));
}

export async function updateAction(uid: string, actionId: string, data: object) {
  await updateDoc(doc(db, "users", uid, "actions", actionId), data);
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export async function saveAIInsight(uid: string, insight: object) {
  const col = collection(db, "users", uid, "insights");
  const docRef = await addDoc(col, { ...insight, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getLatestInsight(uid: string) {
  const col = collection(db, "users", uid, "insights");
  const q = query(col, orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...normalizeTimestamps(d.data()), id: d.id };
}
