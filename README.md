# 🎓 KDLearnSpace — Learning Platform

Nền tảng học tập trực tuyến xây dựng theo mô hình **MVC2**, thuần HTML/CSS/JavaScript ES Modules + Firebase.

---

## 🗂 Cấu trúc dự án (MVC2)

```
kdlearnspace/
├── index.html                  ← App shell duy nhất
├── 404.html                    ← GitHub Pages SPA routing trick
├── assets/
│   ├── css/
│   │   ├── main.css            ← Design system, layout, components
│   │   ├── animations.css      ← Keyframes, transitions
│   │   └── components.css      ← Toast, badges, shared UI
│   └── js/
│       ├── config.js           ← Firebase & Gemini config
│       ├── app.js              ← MVC2 Bootstrap & Router
│       ├── models/             ← DATA LAYER (Firebase interaction)
│       │   ├── AuthModel.js
│       │   ├── CourseModel.js
│       │   └── QuizModel.js
│       ├── views/              ← TEMPLATE LAYER (HTML rendering)
│       │   ├── AuthView.js
│       │   ├── CourseView.js
│       │   ├── QuizView.js
│       │   ├── ProgressView.js
│       │   ├── AdminView.js
│       │   └── ProfileView.js
│       ├── controllers/        ← BUSINESS LOGIC
│       │   ├── AuthController.js
│       │   ├── CourseController.js
│       │   ├── QuizController.js
│       │   ├── ProgressController.js
│       │   ├── AdminController.js
│       │   ├── ChatbotController.js
│       │   └── ProfileController.js
│       └── services/           ← SHARED UTILITIES
│           ├── I18nService.js  (+ ThemeService, ToastService)
│           ├── ThemeService.js
│           └── ToastService.js
```

---

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 🔐 Đăng nhập/Đăng ký | Username hoặc Email đều được |
| 👤 Hồ sơ cá nhân | Sửa fullname, ngày sinh; reset password qua email |
| 📚 Khóa học | Danh sách, chi tiết, đăng ký học |
| 🎥 Bài học | Video (YouTube embed), tài liệu, văn bản |
| 📝 Quiz | Trắc nghiệm, đếm giờ, xem đáp án |
| 📊 Tiến độ | Tracking tiến độ từng khóa học |
| 🤖 AI Chatbot | KDLearnBot dùng Gemini 2.0 Flash API |
| 🛡 Phân quyền | Admin: CRUD khóa học/bài học/quiz |
| 🌙 Dark/Light | Chuyển chế độ sáng/tối |
| 🌐 Vi/En | Giao diện 2 ngôn ngữ |
| 🔙 Browser Back | Routing hỗ trợ nút Back/Forward trình duyệt |

---

## 🚀 Deploy lên GitHub Pages

### Bước 1 — Tạo repo

```bash
git init
git add .
git commit -m "init: KDLearnSpace"
git remote add origin https://github.com/YOUR_USERNAME/kdlearnspace.git
git push -u origin main
```

### Bước 2 — Bật GitHub Pages

- Vào **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)`
- Nhấn **Save**

### Bước 3 — Cấu hình 404.html routing

File `404.html` đã có sẵn — GitHub Pages sẽ redirect mọi path về `index.html` tự động.

> **Lưu ý:** Nếu repo của bạn là `github.com/user/kdlearnspace` (không phải custom domain), mở `404.html` và đổi `segmentCount = 1` (đã là 1 theo mặc định — đúng cho repo con).  
> Nếu dùng custom domain (ví dụ `kdnguyen.me`), đổi thành `segmentCount = 0`.

---

## 🔧 Cấu hình Firebase

File `assets/js/config.js` đã có sẵn Firebase config của bạn. Cần bật các tính năng sau trong Firebase Console:

1. **Authentication** → Sign-in method → **Email/Password** ✅
2. **Firestore Database** → Tạo database, chọn mode **Test** (hoặc production với rules)
3. **Firestore Security Rules** (khuyến nghị):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: chỉ đọc/ghi profile của chính mình
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    // Courses: mọi người đọc, chỉ admin ghi
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
      match /lessons/{lessonId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
      }
      match /quizzes/{quizId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
      }
    }
    // Progress: chỉ chủ nhân đọc/ghi
    match /progress/{docId} {
      allow read, write: if request.auth != null &&
        docId.matches(request.auth.uid + "_.*");
    }
  }
}
```

---

## 👑 Tạo tài khoản Admin

**Cách 1 — Qua config.js** (dễ nhất):
```js
// Thêm email vào adminEmails trước khi đăng ký
adminEmails: ["your-admin@email.com"],
```

**Cách 2 — Qua Firebase Console:**
1. Vào **Firestore → users → [uid của tài khoản]**
2. Sửa field `role` từ `"student"` thành `"admin"`

---

## 🛣 URL Routes

| URL | Trang |
|-----|-------|
| `/login` | Đăng nhập |
| `/register` | Đăng ký |
| `/home` | Trang chủ / Dashboard |
| `/courses` | Danh sách khóa học |
| `/course/:id` | Chi tiết khóa học |
| `/lesson/:courseId/:lessonId` | Xem bài học |
| `/quiz/:courseId/:quizId` | Làm bài kiểm tra |
| `/progress` | Tiến độ học tập |
| `/admin` | Quản trị (chỉ admin) |
| `/profile` | Hồ sơ cá nhân |

---

## 📦 Tech Stack

- **Frontend:** Vanilla JS ES Modules, CSS Custom Properties
- **Font:** Inter (hỗ trợ đầy đủ tiếng Việt Unicode)
- **Backend:** Firebase Authentication + Firestore
- **AI Chatbot:** Google Gemini 2.0 Flash API
- **Hosting:** GitHub Pages (static)
- **Pattern:** MVC2 (Model-View-Controller + Services)
