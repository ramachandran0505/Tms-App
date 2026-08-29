# 🚀 TMS Project — Complete Step-by-Step Production Deployment Guide

This document contains the complete, all-in-one instructions to deploy both the **Backend API** and **Frontend Application (Web, Android APK/AAB, and iOS)** to production.

---

## 📌 Architecture Summary

| Component | Technology | Recommended Host | Build Output |
| :--- | :--- | :--- | :--- |
| **Backend API** | Node.js + Express + MongoDB | Render / Railway / AWS / VPS | Container / Node Process |
| **Frontend Web** | React Native Web + Expo | Vercel / Netlify / Cloudflare | Static Bundle (`dist/`) |
| **Android App** | Expo / React Native | Google Play Store / APK | `.apk` or `.aab` |
| **iOS App** | Expo / React Native | Apple App Store / TestFlight | `.ipa` |

---

# PART 1: Backend Deployment (Render / Railway / VPS)

### Step 1.1: Prepare Backend Environment Variables
Create the following environment variables in your deployment platform dashboard:

```env
MONGODB_URI=mongodb+srv://ramachandranboominathan_db_user:Rama9944@cluster0.jtdsusx.mongodb.net/Tms-db?retryWrites=true&w=majority
PORT=5001
JWT_SECRET=your_super_secret_production_key_here_xyz987
JWT_EXPIRY=7d
```

---

### Step 1.2: Deploy on Render.com (Recommended - Free / Easy)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository (`TMS-PROJECT-FINAL`).
3. Fill in the settings:
   - **Name**: `tms-backend-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Under **Environment Variables**, add the 4 variables from Step 1.1.
5. Click **Create Web Service**.
6. Note down your backend production URL (e.g. `https://tms-backend-api.onrender.com`).

---

### Step 1.3: Verify Backend Production API
Test your live deployed backend in terminal:
```bash
curl https://tms-backend-api.onrender.com/api/health
# Response: {"message":"Server is running"}
```

---

# PART 2: Frontend Web Deployment (Vercel / Netlify)

### Step 2.1: Update Frontend API URL
Set your `EXPO_PUBLIC_API_URL` to point to your live backend:

```env
EXPO_PUBLIC_API_URL=https://tms-backend-api.onrender.com/api
```

---

### Step 2.2: Deploy on Vercel (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new) and import your Git repo.
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Other`
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Under **Environment Variables**:
   - `EXPO_PUBLIC_API_URL` = `https://tms-backend-api.onrender.com/api`
4. Click **Deploy**.

Your Web TMS portal will be live at `https://tms-crossplatform.vercel.app`!

---

### Step 2.3: Deploy on Netlify (Alternative)

1. In `frontend`, export the static production bundle:
   ```bash
   cd frontend
   npm run build:web
   ```
2. Drag and drop the generated `frontend/dist` folder to [Netlify Drop](https://app.netlify.com/drop) or link Git with:
   - **Base directory**: `frontend`
   - **Build command**: `npx expo export --platform web`
   - **Publish directory**: `frontend/dist`
   - **Env variable**: `EXPO_PUBLIC_API_URL=https://tms-backend-api.onrender.com/api`

---

# PART 3: Mobile App Build (Android APK & iOS)

### Option A: Cloud Build using Expo Application Services (EAS Build)

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Initialize EAS in the `frontend` directory:
   ```bash
   cd frontend
   eas build:configure
   ```

#### 📱 Generate Standalone Android APK (Direct Install on Phones):
Add an APK profile in `frontend/eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://tms-backend-api.onrender.com/api"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://tms-backend-api.onrender.com/api"
      }
    }
  }
}
```
Run the build:
```bash
eas build -p android --profile preview
```
*(When finished, EAS provides a direct download link to install the `.apk` on any Android device).*

---

#### 📱 Generate Google Play Store Release (AAB):
```bash
eas build -p android --profile production
```

---

#### 🍏 Generate Apple iOS Build (TestFlight / App Store):
```bash
eas build -p ios --profile production
```

---

### Option B: Local Android Build via Gradle (Offline Build)

If you have Android Studio & Android SDK installed:

```bash
cd frontend/android
./gradlew assembleRelease
```
The output APK will be generated at:
`frontend/android/app/build/outputs/apk/release/app-release.apk`

---

# PART 4: Single-Machine / Self-Hosted VPS Deployment (Docker / PM2)

If deploying on Ubuntu / Debian VPS (e.g. AWS EC2, DigitalOcean):

### Step 4.1: Install Node.js & PM2
```bash
sudo apt update && sudo apt install -y nodejs npm
sudo npm install -g pm2 serve
```

### Step 4.2: Run Backend with PM2 (Auto-restart on reboot)
```bash
cd /path/to/TMS-PROJECT-FINAL/backend
npm install
pm2 start server.js --name "tms-backend"
pm2 save
pm2 startup
```

### Step 4.3: Build & Serve Frontend
```bash
cd /path/to/TMS-PROJECT-FINAL/frontend
npm install
npx expo export --platform web
pm2 start "serve -s dist -l 80" --name "tms-frontend"
pm2 save
```

---

# 🛡️ Production Verification Checklist

Before releasing to end users:

- [ ] Backend returns `{"message":"Server is running"}` at `/api/health`.
- [ ] Database contains SuperAdmin account (`ramachandranboominathan@gmail.com`).
- [ ] Frontend `EXPO_PUBLIC_API_URL` matches your deployed backend URL.
- [ ] Test ticket creation, department selection, photo/doc attachment, and status triage.
- [ ] Test theme toggle between Dark and Light mode.
- [ ] Test mobile responsiveness on phone browser and desktop.

---

🎉 **Your TMS application is now completely deployed and production-ready!**
