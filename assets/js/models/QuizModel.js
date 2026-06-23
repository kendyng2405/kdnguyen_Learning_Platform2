// ============================================================
//  QuizModel.js — Quiz & Progress Data Layer (Firestore)
// ============================================================

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class QuizModel {
  constructor() {
    this.db = window.__firebaseDB;
  }

  // ── Quizzes ──────────────────────────────────────────────
  async getQuizzesByCourse(courseId) {
    const q = query(
      collection(this.db, "courses", courseId, "quizzes"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getQuizById(courseId, quizId) {
    const snap = await getDoc(doc(this.db, "courses", courseId, "quizzes", quizId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async createQuiz(courseId, data) {
    const ref = await addDoc(collection(this.db, "courses", courseId, "quizzes"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async updateQuiz(courseId, quizId, data) {
    await updateDoc(doc(this.db, "courses", courseId, "quizzes", quizId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteQuiz(courseId, quizId) {
    await deleteDoc(doc(this.db, "courses", courseId, "quizzes", quizId));
  }

  // ── Progress Tracking ─────────────────────────────────────
  async getProgress(uid, courseId) {
    const snap = await getDoc(doc(this.db, "progress", `${uid}_${courseId}`));
    return snap.exists() ? snap.data() : { completedLessons: [], quizScores: {}, enrolledAt: null };
  }

  async markLessonComplete(uid, courseId, lessonId) {
    const ref = doc(this.db, "progress", `${uid}_${courseId}`);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : { completedLessons: [], quizScores: {}, enrolledAt: serverTimestamp() };

    if (!data.completedLessons.includes(lessonId)) {
      data.completedLessons.push(lessonId);
    }
    data.lastUpdated = serverTimestamp();
    await setDoc(ref, data);
  }

  async saveQuizScore(uid, courseId, quizId, score, total) {
    const ref = doc(this.db, "progress", `${uid}_${courseId}`);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : { completedLessons: [], quizScores: {}, enrolledAt: serverTimestamp() };

    data.quizScores = data.quizScores || {};
    // Keep best score
    const prev = data.quizScores[quizId];
    if (!prev || score > prev.score) {
      data.quizScores[quizId] = { score, total, percentage: Math.round((score / total) * 100), takenAt: new Date().toISOString() };
    }
    data.lastUpdated = serverTimestamp();
    await setDoc(ref, data);
  }

  async getAllProgressForUser(uid) {
    // Get all courses user has progress in
    const { getDocs: gd, collection: col, query: q, where: wh } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    // We store progress as uid_courseId, query by prefix not supported in Firestore
    // So we get all progress docs and filter client-side
    const snap = await getDocs(collection(this.db, "progress"));
    return snap.docs
      .filter(d => d.id.startsWith(uid + "_"))
      .map(d => {
        const courseId = d.id.replace(uid + "_", "");
        return { courseId, ...d.data() };
      });
  }

  async getAllProgressDocs() {
    const snap = await getDocs(collection(this.db, "progress"));
    return snap.docs.map(d => this._parseProgressDoc(d)).filter(Boolean);
  }

  async getProgressForCourse(courseId) {
    const allProgress = await this.getAllProgressDocs();
    return allProgress.filter(item => item.courseId === courseId && this._isEnrollmentProgress(item));
  }

  async getEnrollmentCountsByCourse() {
    const counts = {};
    const allProgress = await this.getAllProgressDocs();
    allProgress.forEach(item => {
      if (!item.courseId || !this._isEnrollmentProgress(item)) return;
      counts[item.courseId] = (counts[item.courseId] || 0) + 1;
    });
    return counts;
  }

  async enrollCourse(uid, courseId) {
    const ref = doc(this.db, "progress", `${uid}_${courseId}`);
    const snap = await getDoc(ref);
    const isNewEnrollment = !snap.exists();
    if (!snap.exists()) {
      await setDoc(ref, {
        completedLessons: [],
        quizScores: {},
        enrolledAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    }
    // Also update user's enrolledCourses
    const userRef = doc(this.db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const enrolled = userSnap.data().enrolledCourses || [];
      if (!enrolled.includes(courseId)) {
        await updateDoc(userRef, { enrolledCourses: [...enrolled, courseId] });
      }
    }
    if (isNewEnrollment) {
      const courseRef = doc(this.db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        await updateDoc(courseRef, {
          enrolledCount: (courseSnap.data().enrolledCount || 0) + 1,
        });
      }
    }
  }

  _parseProgressDoc(docSnap) {
    const data = docSnap.data() || {};
    const separatorIndex = docSnap.id.indexOf("_");
    const uid = data.uid || (separatorIndex >= 0 ? docSnap.id.slice(0, separatorIndex) : "");
    const courseId = data.courseId || (separatorIndex >= 0 ? docSnap.id.slice(separatorIndex + 1) : "");
    if (!courseId) return null;
    return { id: docSnap.id, uid, courseId, ...data };
  }

  _isEnrollmentProgress(progress) {
    return !!(
      progress?.enrolledAt ||
      progress?.lastUpdated ||
      progress?.completedLessons?.length ||
      Object.keys(progress?.quizScores || {}).length
    );
  }
}
