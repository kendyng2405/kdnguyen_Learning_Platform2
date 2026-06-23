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
  collection, query, where, getDocs, limit, orderBy,
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
  async register(username, fullname, email, password, options = {}) {
    const uname = username.trim().toLowerCase();
    const cleanEmail = email.trim();

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

    const cred = await createUserWithEmailAndPassword(this.auth, cleanEmail, password);
    const user = cred.user;

    const isSystemAdmin = (APP_CONFIG.adminEmails || []).includes(cleanEmail);
    const isTeacherEmail = (APP_CONFIG.teacherEmails || []).includes(cleanEmail);
    const requestedRole = options.role === "teacher" ? "teacher" : "student";
    const role = isSystemAdmin ? "admin" : (isTeacherEmail ? "teacher" : requestedRole);

    await setDoc(doc(this.db, "users", user.uid), {
      uid: user.uid,
      username: uname,
      fullname: fullname.trim(),
      email: cleanEmail,
      role,
      isSuperAdmin: isSystemAdmin,
      learningPreferences: options.learningPreferences || null,
      createdAt: serverTimestamp(),
      dob: null,
      progress: {},
      enrolledCourses: [],
      streak: 0,
      xp: 0,
      lastLoginDate: null,
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
      await this.updateLoginStreak(uid, this.userProfile);
    } else {
      this.userProfile = null;
    }
    return this.userProfile;
  }

  async updateLoginStreak(uid, profile) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastLogin = profile.lastLoginDate;
    
    if (lastLogin === today) return; // Already logged in today
    
    let newStreak = profile.streak || 0;
    if (lastLogin) {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1; // Consecutive day
      } else if (diffDays > 1) {
        newStreak = 1; // Streak broken
      }
    } else {
      newStreak = 1; // First login
    }
    
    // Add 10 XP for daily login
    const newXP = (profile.xp || 0) + 10;
    
    await this.updateProfile(uid, {
      streak: newStreak,
      xp: newXP,
      lastLoginDate: today
    });
  }

  async updateProfile(uid, data) {
    await updateDoc(doc(this.db, "users", uid), data);
    if (this.userProfile) {
      Object.assign(this.userProfile, data);
    }
  }

  async getLeaderboard(maxRows = 30) {
    const q = query(
      collection(this.db, "users"),
      orderBy("xp", "desc"),
      limit(maxRows)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d, index) => ({
      id: d.id,
      rank: index + 1,
      ...d.data(),
    }));
  }

  async getAllUsers(maxRows = 200) {
    const q = query(
      collection(this.db, "users"),
      orderBy("createdAt", "desc"),
      limit(maxRows)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async updateUserRole(uid, role) {
    const isSuperAdmin = role === "admin";
    await updateDoc(doc(this.db, "users", uid), { role, isSuperAdmin });
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

  isConfiguredAdmin(email) {
    return (APP_CONFIG.adminEmails || []).includes(String(email || "").trim());
  }
}
