/**
 * Firebase Client Configuration
 *
 * Initializes the Firebase SDK for Authentication and Firestore database access.
 * Configuration is loaded from 'firebase-applet-config.json'.
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, signInWithRedirect } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the core Firebase App instance
const app = initializeApp(firebaseConfig);

/**
 * Firebase Analytics instance.
 */
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

/**
 * Firebase Authentication instance.
 */
export const auth = getAuth(app);

/**
 * Firestore Database instance.
 * Note: Uses custom firestoreDatabaseId from config if provided.
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Google Authentication Provider.
 */
export const googleProvider = new GoogleAuthProvider();

// Re-export common Firebase functions for cleaner imports in the app
export {
  signInWithPopup, 
  signInAnonymously,
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
};
