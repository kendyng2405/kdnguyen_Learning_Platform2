// ============================================================
//  CourseModel.js — Courses & Lessons Data Layer (Firestore)
// ============================================================

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class CourseModel {
  constructor() {
    this.db = window.__firebaseDB;
  }

  // ── Courses ──────────────────────────────────────────────
  async getAllCourses() {
    const q = query(collection(this.db, "courses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getCourseById(id) {
    const snap = await getDoc(doc(this.db, "courses", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async createCourse(data) {
    const ref = await addDoc(collection(this.db, "courses"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lessonCount: 0,
      enrolledCount: 0,
    });
    return ref.id;
  }

  async updateCourse(id, data) {
    await updateDoc(doc(this.db, "courses", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteCourse(id) {
    // Delete all lessons first
    const lessons = await this.getLessons(id);
    for (const lesson of lessons) {
      await this.deleteLesson(id, lesson.id);
    }
    await deleteDoc(doc(this.db, "courses", id));
  }

  // ── Lessons ───────────────────────────────────────────────
  async getLessons(courseId) {
    const q = query(
      collection(this.db, "courses", courseId, "lessons"),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getLessonById(courseId, lessonId) {
    const snap = await getDoc(doc(this.db, "courses", courseId, "lessons", lessonId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async createLesson(courseId, data) {
    const ref = await addDoc(collection(this.db, "courses", courseId, "lessons"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    // Update lesson count
    const course = await this.getCourseById(courseId);
    await updateDoc(doc(this.db, "courses", courseId), {
      lessonCount: (course?.lessonCount || 0) + 1
    });
    return ref.id;
  }

  async updateLesson(courseId, lessonId, data) {
    await updateDoc(doc(this.db, "courses", courseId, "lessons", lessonId), data);
  }

  async deleteLesson(courseId, lessonId) {
    await deleteDoc(doc(this.db, "courses", courseId, "lessons", lessonId));
    const course = await this.getCourseById(courseId);
    if (course && course.lessonCount > 0) {
      await updateDoc(doc(this.db, "courses", courseId), {
        lessonCount: course.lessonCount - 1
      });
    }
  }
}
