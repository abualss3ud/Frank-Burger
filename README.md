# Frank Burger Platform - Production & DevOps Guide

منصة وموقع فرانك برجر (Frank Burger) - تطبيق Full-Stack مبني وفق معايير Production-Ready وأفضل ممارسات DevOps.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

* **Frontend:** React 19, Vite 6, Tailwind CSS v4, TypeScript, Lucide Icons, Recharts.
* **Backend:** Node.js 20+, Express 4, TypeScript (عبر `tsx` محلياً، ومجمع عبر `esbuild` إلى `dist/server.cjs` في الإنتاج).
* **Database:** Google Cloud Firestore (Firebase) مع قواعد أمان محكمة في `firestore.rules`.
* **API Integrations:** Meta Conversions API (CAPI) عبر السيرفر لتخطي حظر تتبع iOS/Safari، مع تشفير SHA256 للبيانات الحساسة.
* **DevOps & Containers:** Docker (Multi-stage build), Docker Compose, GitHub Actions (CI/CD).

---

## 🚀 التشغيل المحلي السريع (Local Development)

### المتطلبات:
* Node.js الإصدار 20 أو أحدث.
* npm أو bun.

### 1. تثبيت الحزم:
```bash
npm install
```

### 2. إعداد ملف البيئة:
قم بنسخ ملف المتغيرات:
```bash
cp .env.example .env
```
*(قم بتعديل قيم المتغيرات في ملف `.env` حسب الحاجة)*.

### 3. تشغيل وضع التطوير:
```bash
npm run dev
```
سيعمل التطبيق على: `http://localhost:3000`

---

## 🏗️ بناء وتشغيل بيئة الإنتاج (Production Run)

```bash
# 1. فحص الأنواع والأخطاء
npm run lint

# 2. بناء ملفات العميل والسيرفر
npm run build

# 3. تشغيل السيرفر الإنتاجي
npm start
```

---

## 🐳 التشغيل باستخدام Docker & Docker Compose

تم تجهيز التطبيق بملف `Dockerfile` متعدد المراحل (Multi-stage build) لتقليل حجم الحاوية وتشغيلها بمستخدم آمن غير ذي صلاحيات جذرية (`node:node`) مع ميزة `HEALTHCHECK` تلقائية.

### تشغيل المشروع بضغطة واحدة:
```bash
docker compose up --build -d
```

### فحص حالة الحاوية:
```bash
docker ps
docker compose logs -f
```

### إيقاف الحاوية:
```bash
docker compose down
```

---

## 🩺 فحص صحة النظام (Health Check Endpoint)

يوفر السيرفر نقطة فحص صحة جاهزة للمراقبة وأنظمة الـ Orchestration (مثل Kubernetes وDocker وCloud Run):

* **المسار:** `GET /api/health`
* **نموذج الاستجابة:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-25T12:00:00.000Z",
  "uptime": 1240,
  "environment": "production"
}
```

---

## 🔄 خطوط الأنابيب المؤتمتة (CI/CD Pipelines)

### 1. خط الفحص المستمر (CI - `.github/workflows/ci.yml`):
يعمل تلقائياً عند أي `push` أو `pull_request`:
* تثبيت الاعتماديات (Dependencies).
* فحص الأنواع ولغة TypeScript (`npm run lint`).
* بناء المشروع بالكامل للتأكد من عدم وجود أخطاء تجميع (`npm run build`).
* فحص أمان الحزم (`npm audit`).
* اختبار بناء صورة Docker للتأكد من سلامة ملف الـ Dockerfile.

### 2. خط النشر المؤتمت (CD - `.github/workflows/cd.yml`):
يعمل تلقائياً عند الدمج في فرع `main` أو إنشاء Tag جديد:
* بناء صورة Docker الإنتاجية بأحدث الكود.
* نشر الصورة إلى GitHub Container Registry (GHCR) باسم الحساب والمشروع.
* جاهز للربط عبر Webhook مع أي مزود استضافة (Cloud Run, Coolify, Portainer, CapRover, VPS).

---

## 🔐 إدارة الأمان والبيانات (Security & Database)

1. **إدارة المتغيرات الحساسة (Secrets):**
   * لا تقم برفع ملف `.env` إلى GitHub إطلاقاً (الملف مستبعد تلقائياً في `.gitignore`).
   * قم بتعيين المتغيرات في GitHub عبر: **Settings > Secrets and variables > Actions**.

2. **قواعد بيانات Firestore:**
   * القواعد الأمنية مضبوطة بالكامل في ملف `firestore.rules`.
   * لنشر أي تعديلات في القواعد إلى Firebase:
     ```bash
     firebase deploy --only firestore:rules
     ```

3. **النسخ الاحتياطي لقاعدة البيانات (Backups):**
   * يُوصى بتفعيل Google Cloud Scheduled Firestore Export عبر Cloud Storage لأخذ نسخ احتياطية يومية مجدولة:
     `gcloud firestore export gs://[YOUR_BACKUP_BUCKET]`

---

## 📊 المراقبة وتتبع الأخطاء المقترحة (Monitoring & Error Tracking)

1. **تتبع أخطاء الواجهة والسيرفر (Error Tracking):**
   * دمج **Sentry** لتتبع أي استثناءات غير متوقعة في الـ Frontend والـ Backend فور وقوعها.
2. **مراقبة التوفر (Uptime Monitoring):**
   * ربط مسار `/api/health` بخدمات مثل **Better Stack** أو **Uptime Kuma** لتنبيه الفريق فور توقف السيرفر.
3. **سجلات النظام (Logging):**
   * السيرفر يسجل كل طلبات الـ API بزمن الاستجابة (Latency) وكود الحالة، مع تدوير السجلات في Docker Compose بحجم أقصى 10MB لكل ملف.
