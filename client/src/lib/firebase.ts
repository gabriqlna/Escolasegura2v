// Firebase configuration and initialization
// Based on firebase_barebones_javascript integration
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const messaging = getMessaging(app); // TODO: Configure messaging later

// Auth functions
export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};

export const logout = async () => {
  return await signOut(auth);
};

// User data functions
export const createUserDocument = async (
  uid: string, 
  userData: {
    name: string;
    email: string;
    role: "student" | "staff" | "admin";
    isActive?: boolean;
  }
) => {
  const userDoc = {
    ...userData,
    isActive: userData.isActive ?? true,
    createdAt: serverTimestamp(),
  };
  
  await setDoc(doc(db, "users", uid), userDoc);
  return userDoc;
};

export const getUserDocument = async (uid: string) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};

export const updateUserDocument = async (uid: string, data: Partial<any>) => {
  await updateDoc(doc(db, "users", uid), data);
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Push notifications - TODO: Implement after configuring Firebase Messaging
export const requestNotificationPermission = async () => {
  console.log('Notification permission not yet configured');
  return null;
};

export const onNotificationMessage = (callback: (payload: any) => void) => {
  console.log('Notification messaging not yet configured');
  return () => {};
};

// Firestore collections helpers
export const collections = {
  users: 'users',
  reports: 'reports',
  notices: 'notices',
  visitors: 'visitors',
  occurrences: 'occurrences',
  checklistItems: 'checklistItems',
  drills: 'drills',
  campaigns: 'campaigns',
  emergencyAlerts: 'emergencyAlerts',
} as const;

// Generic Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getDocuments = async (
  collectionName: string, 
  conditions?: Array<{ field: string; operator: any; value: any }>,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc'
) => {
  let q = query(collection(db, collectionName));
  
  if (conditions) {
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
  }
  
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  await deleteDoc(doc(db, collectionName, docId));
};