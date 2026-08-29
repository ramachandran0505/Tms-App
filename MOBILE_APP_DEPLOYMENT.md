# 📱 TMS Mobile App Deployment Guide (A to Z Step-by-Step)

This guide explains **how to build, generate APK/AAB files, and deploy the TMS Mobile Application** to Android phones, Google Play Store, and Apple App Store.

---

## 🎯 Choose What You Want to Do:

1. **Option 1 (Fastest & Recommended)**: Generate direct **Installable Android APK** (Download and install directly on any phone without Play Store).
2. **Option 2**: Build **Google Play Store Release (.aab file)** to publish on Play Store.
3. **Option 3**: Build **Apple iOS App (IPA / TestFlight)** for iPhone users.
4. **Option 4**: Build **Offline Local APK on your Mac** using Gradle.

---

## ⚠️ CRITICAL STEP 0: Configure Your Backend API URL for Mobile

> 💡 **Why this is important**: On a physical mobile phone, `http://localhost:5001` will NOT work because `localhost` refers to the phone itself, not your computer or server.

### For Production Mobile App:
Make sure your live deployed backend URL (from Render, Railway, AWS, etc.) is set in `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-backend-api.onrender.com/api
```

---

## 🚀 OPTION 1: Generate Direct Android APK (EAS Cloud Build)

This is the easiest way. Expo builds the APK on the cloud and gives you a direct download link / QR code.

### Step 1: Install EAS CLI (One-time setup)
Open Terminal in VS Code and run:
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo Account
```bash
eas login
```
*(If you don't have an Expo account, create a free one at [expo.dev/signup](https://expo.dev/signup) and then login).*

### Step 3: Check `eas.json` Configuration
Your `frontend/eas.json` is already configured with the APK profile:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-api.onrender.com/api"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-api.onrender.com/api"
      }
    }
  }
}
```

### Step 4: Run the Build Command
```bash
cd frontend
eas build -p android --profile preview
```

### Step 5: Download & Install on Phone
- EAS will build your APK in the cloud (takes ~5-10 minutes).
- When done, it prints a **Download URL** and a **QR Code** in the terminal.
- Scan the QR code on your Android phone or open the URL to download and install `TMS.apk` directly!

---

## 🏬 OPTION 2: Publish to Google Play Store (Android AAB Release)

Google Play Store requires an **Android App Bundle (.aab)** format.

### Step 1: Generate Production AAB Bundle
Run:
```bash
cd frontend
eas build -p android --profile production
```
- EAS will ask if you want Expo to generate and manage your Android Keystore (`keystore.jks`). Press **Yes** (Recommended).
- Download the `.aab` file once the build completes.

### Step 2: Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console).
2. Click **Create App** → Enter App Name (`TMS - Facility Management`), Language, and App type.
3. Complete the **Set up your app** tasks (Privacy Policy, App Access, Content Rating, Target Audience).
4. Go to **Production** (or **Closed Testing / Internal Testing**) → Click **Create new release**.
5. Upload the `.aab` file downloaded from EAS.
6. Enter release notes and click **Review Release** → **Start rollout to Production**.

---

## 🍏 OPTION 3: Build & Deploy iOS App (Apple App Store / TestFlight)

### Prerequisites:
- Apple Developer Account ($99/year).

### Step 1: Run iOS Production Build
```bash
cd frontend
eas build -p ios --profile production
```
- Login with your Apple ID when prompted.
- EAS will automatically create certificates and provisioning profiles.

### Step 2: Submit to TestFlight / App Store
Run automated submission:
```bash
eas submit -p ios
```
Or download the `.ipa` file and upload via **Transporter app** on Mac to App Store Connect.

---

## 💻 OPTION 4: Offline Local Android Build on Your Mac (Without Cloud)

If you have **Android Studio** and **Android SDK** installed on your Mac, you can build the APK completely offline.

### Step 1: Navigate to the native android directory
```bash
cd frontend/android
```

### Step 2: Build Release APK using Gradle
```bash
./gradlew assembleRelease
```

### Step 3: Locate the generated APK
The output APK file will be ready at:
```
frontend/android/app/build/outputs/apk/release/app-release.apk
```
Transfer this file to your phone via USB or WhatsApp / Google Drive to install directly.

---

## 📋 Quick Command Cheatsheet

| Goal | Command to Run |
| :--- | :--- |
| **Direct Installable APK (Cloud)** | `cd frontend && eas build -p android --profile preview` |
| **Play Store Bundle .aab (Cloud)** | `cd frontend && eas build -p android --profile production` |
| **iOS Build (Cloud)** | `cd frontend && eas build -p ios --profile production` |
| **Local Offline Android Build (Mac)** | `cd frontend/android && ./gradlew assembleRelease` |

---

## ✅ Final Pre-Build Checklist

- [ ] `EXPO_PUBLIC_API_URL` points to your live backend (e.g. `https://tms-backend-api.onrender.com/api`).
- [ ] Backend is deployed and returning `{"message":"Server is running"}` on `/api/health`.
- [ ] App version in `app.json` is set (`"version": "1.0.0"`).
- [ ] App icons and splash screens in `frontend/assets/` are verified.
