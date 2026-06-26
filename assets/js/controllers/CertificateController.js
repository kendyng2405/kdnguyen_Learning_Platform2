// ============================================================
//  CertificateController.js - Course completion certificate
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=10";
import { QuizModel } from "../models/QuizModel.js?v=12";
import { CertificateView } from "../views/CertificateView.js?v=10";

export class CertificateController {
  constructor(app) {
    this.app = app;
    this.courseModel = new CourseModel();
    this.quizModel = new QuizModel();
    this.view = new CertificateView();
    this.currentCertificate = null;
  }

  async showCertificate(courseId) {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "certificate");
    const uid = this.app.getUser()?.uid;
    const lang = window.__i18n.current;

    try {
      const [course, lessons, quizzes, progress] = await Promise.all([
        this.courseModel.getCourseById(courseId),
        this.courseModel.getLessons(courseId),
        this.quizModel.getQuizzesByCourse(courseId),
        this.quizModel.getProgress(uid, courseId),
      ]);

      if (!course) {
        window.__toast.error("Course not found");
        this.app.navigate("courses");
        return;
      }

      const completedLessons = progress?.completedLessons || [];
      const isCompleted = lessons.length > 0 && completedLessons.length >= lessons.length;
      const quizScores = Object.values(progress?.quizScores || {});
      const averageScore = quizScores.length
        ? Math.round(quizScores.reduce((sum, item) => sum + (item.percentage || 0), 0) / quizScores.length)
        : null;

      const certificate = {
        id: this._certificateId(uid, courseId),
        studentName: this.app.getUserProfile()?.fullname || this.app.getUserProfile()?.username || "Learner",
        courseTitle: course.title,
        category: course.category || "",
        completedAt: new Date().toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US"),
        lessonCount: lessons.length,
        quizCount: quizzes.length,
        averageScore,
        courseId,
      };
      this.currentCertificate = certificate;

      const html = isCompleted
        ? this.view.renderCertificate(certificate, lang)
        : this.view.renderLocked(course, completedLessons.length, lessons.length, lang);
      this._renderPage(html, "certificate");
      this._bindEvents(courseId, isCompleted);
    } catch (e) {
      window.__toast.error(e.message);
      this._renderPage(this.view.renderError(lang), "certificate");
    }
  }

  _bindEvents(courseId, isCompleted) {
    document.getElementById("backToCourse")?.addEventListener("click", () => this.app.navigate("course", courseId));
    document.getElementById("downloadCertificatePdf")?.addEventListener("click", () => {
      if (isCompleted && this.currentCertificate) this._downloadPDF(this.currentCertificate);
    });
  }

  _downloadPDF(certificate) {
    const pdf = this._buildCertificatePDF(certificate);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BrilliantLMS-Certificate-${certificate.courseTitle.replace(/[^\w-]+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  _buildCertificatePDF(certificate) {
    const esc = (text) => this._pdfText(text);
    const content = [
      "0.96 0.98 1 rg 0 0 842 595 re f",
      "0.36 0.45 0.89 RG 5 w 38 38 766 519 re S",
      "0.18 0.27 0.49 RG 1.2 w 58 58 726 479 re S",
      "BT /F1 18 Tf 0.36 0.45 0.89 rg 318 504 Td (BRILLIANT LMS) Tj ET",
      "BT /F1 42 Tf 0.09 0.17 0.30 rg 230 436 Td (Certificate of Completion) Tj ET",
      `BT /F1 16 Tf 0.37 0.45 0.55 rg 318 390 Td (This certifies that) Tj ET`,
      `BT /F1 36 Tf 0.09 0.17 0.30 rg ${this._centerX(certificate.studentName, 36)} 340 Td (${esc(certificate.studentName)}) Tj ET`,
      `BT /F1 15 Tf 0.37 0.45 0.55 rg 250 300 Td (has successfully completed the course) Tj ET`,
      `BT /F1 28 Tf 0.36 0.45 0.89 rg ${this._centerX(certificate.courseTitle, 28)} 254 Td (${esc(certificate.courseTitle)}) Tj ET`,
      `BT /F1 13 Tf 0.37 0.45 0.55 rg 238 206 Td (Lessons: ${certificate.lessonCount}    Quizzes: ${certificate.quizCount}    Average Score: ${certificate.averageScore ?? "N/A"}%) Tj ET`,
      `BT /F1 13 Tf 0.37 0.45 0.55 rg 296 174 Td (Completed on ${esc(certificate.completedAt)}) Tj ET`,
      `BT /F1 10 Tf 0.55 0.60 0.68 rg 302 86 Td (Certificate ID: ${esc(certificate.id)}) Tj ET`,
      "BT /F1 12 Tf 0.09 0.17 0.30 rg 620 126 Td (Brilliant LMS) Tj ET",
      "0.36 0.45 0.89 RG 2 w 585 148 170 0 l S",
    ].join("\n");

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return pdf;
  }

  _centerX(text, fontSize) {
    const approxWidth = this._stripDiacritics(text).length * fontSize * 0.52;
    return Math.max(80, Math.round((842 - approxWidth) / 2));
  }

  _pdfText(value) {
    return this._stripDiacritics(value)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  _stripDiacritics(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  _certificateId(uid, courseId) {
    return `BLMS-${String(uid || "user").slice(0, 6).toUpperCase()}-${String(courseId).slice(0, 6).toUpperCase()}`;
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}
