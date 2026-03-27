// ============================================================
//  AuthModel.js — Authentication & User Profile (MVC2 Model)
//  Supports login by username OR email
//  Username uniqueness enforced via Firestore
// ============================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, where, getDocs, limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_CONFIG } from "../config.js";

export class AuthModel {
  constructor() {
    this.auth = window.__firebaseAuth;
    this.db   = window.__firebaseDB;
    this.userProfile = null;
  }

  onAuthStateChanged(callback) {
    onAuthStateChanged(this.auth, callback);
  }

  // ── Login by username OR email ──────────────────────────
  async login(identifier, password) {
    let email = identifier.trim();

    // If not an email format, lookup email by username
    if (!email.includes("@")) {
      const q = query(
        collection(this.db, "users"),
        where("username", "==", email.toLowerCase()),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        throw { code: "auth/user-not-found" };
      }
      email = snap.docs[0].data().email;
    }

    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  // ── Register with username uniqueness check ─────────────
  async register(username, fullname, email, password) {
    const uname = username.trim().toLowerCase();

    // Check username uniqueness
    const q = query(
      collection(this.db, "users"),
      where("username", "==", uname),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw { code: "auth/username-taken" };
    }

    const cred = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
    const user = cred.user;

    const isAdmin = APP_CONFIG.adminEmails.includes(email.trim());

    await setDoc(doc(this.db, "users", user.uid), {
      uid: user.uid,
      username: uname,
      fullname: fullname.trim(),
      email: email.trim(),
      role: isAdmin ? "admin" : "student",
      createdAt: serverTimestamp(),
      dob: null,
      progress: {},
      enrolledCourses: [],
    });

    await this.loadUserProfile(user.uid);
    return user;
  }

  async logout() {
    this.userProfile = null;
    await signOut(this.auth);
  }

  async loadUserProfile(uid) {
    const snap = await getDoc(doc(this.db, "users", uid));
    if (snap.exists()) {
      this.userProfile = snap.data();
    } else {
      this.userProfile = null;
    }
    return this.userProfile;
  }

  async updateProfile(uid, data) {
    await updateDoc(doc(this.db, "users", uid), data);
    if (this.userProfile) {
      Object.assign(this.userProfile, data);
    }
  }

  // ── Password reset via email ────────────────────────────
  async sendPasswordReset(email) {
//  const { sendPasswordResetEmail } = await import(
//    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
//  );
  await sendPasswordResetEmail(this.auth, email);
}

  // ── Change password (requires re-auth) ─────────────────
  async changePassword(currentPassword, newPassword) {
    const user = this.auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  }


  getCurrentUser() {
    return this.auth.currentUser;
  }
}
