// ============================================================
//  config.js — KDLearnSpace Configuration
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCRX3w6wURr1SZBHaC-ytxWPTFsKEGg-wc",
  authDomain: "kdnguyen-learning-platfo-45364.firebaseapp.com",
  projectId: "kdnguyen-learning-platfo-45364",
  storageBucket: "kdnguyen-learning-platfo-45364.firebasestorage.app",
  messagingSenderId: "624341432764",
  appId: "1:624341432764:web:de8efee583c2cd3be513b9"
};

export const GEMINI_API_KEY = "AIzaSyA8MdW9LtNOBqLTY0fofF6Tu7IvS0ppFFg"
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const APP_CONFIG = {
  name: "KDLearnSpace",
  defaultLang: "vi",
  defaultTheme: "light",
  // Thêm email admin vào đây, ví dụ: ["admin@example.com"]
  adminEmails: [],
};
