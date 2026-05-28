# PDF Highlighter — Expo React Native App

Smart document highlighter with TF-IDF scoring, AI-generated MCQs, and PDF export.

---

## Features

- 📄 Upload PDF or DOCX via `expo-document-picker`
- ⚡ Sends to Flask backend at `http://localhost:5000`
- 🎯 Displays TF-IDF highlighted sentences in scrollable UI
- ↓ Download highlighted PDF with MCQs via `expo-file-system` + `expo-sharing`
- 👁 View PDF inline with `react-native-webview`
- Works on **Android**, **iOS**, and **Web**

---

## Project Structure

```
pdf-highlighter/
├── App.js                        # Navigation root
├── app.json                      # Expo config
├── babel.config.js
├── metro.config.js
├── package.json
└── src/
    ├── components/
    │   ├── UploadCard.js         # File picker UI
    │   ├── LoadingView.js        # Animated processing steps
    │   ├── DownloadButton.js     # Download + share PDF
    │   └── PDFViewer.js          # WebView-based PDF viewer
    ├── screens/
    │   ├── HomeScreen.js         # File selection
    │   ├── ProcessingScreen.js   # Loading + API call
    │   └── ResultScreen.js       # Highlights + PDF actions
    ├── services/
    │   └── api.js                # Axios API layer
    └── styles/
        └── theme.js              # Design tokens
```

---

## Setup

### 1. Install dependencies

```bash
cd pdf-highlighter
npm install
```

### 2. Start Flask backend

Make sure your Flask backend is running at `http://localhost:5000`.

Endpoints used:
- `POST /highlight-text` — accepts `file` (PDF/DOCX), returns `{ highlighted_text, output_pdf_path }`
- `POST /generate-mcqs` — accepts `file`, `num_questions`, returns `{ mcqs }`

### 3. Run the Expo app

```bash
# Start dev server
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios

# Web
npx expo start --web
```

---

## Backend URL

The base URL is set in `src/services/api.js`:

```js
const BASE_URL = 'http://localhost:5000';
```

For physical device testing, replace `localhost` with your machine's local IP:

```js
const BASE_URL = 'http://192.168.x.x:5000';
```

---

## PDF Viewing

| Platform | Method |
|----------|--------|
| Web      | `<iframe>` with `#toolbar=1` |
| iOS      | `WebView` with direct PDF URL (Safari renders natively) |
| Android  | `WebView` via Google Docs viewer proxy |

---

## PDF Download

| Platform | Method |
|----------|--------|
| Web      | Opens PDF in new tab |
| iOS/Android | `FileSystem.createDownloadResumable` → `Sharing.shareAsync` |

---

## Design System

The app uses a Navy + Amber palette with Georgia serif headers:

- **Primary**: `#1A2B4A` (deep navy)
- **Accent**: `#F59E0B` (amber)
- **Background**: `#F7F9FC`
- **Typography**: Georgia (display), System (body)

All styles use React Native `StyleSheet` — no Tailwind or UI frameworks.

---

## Dependencies

```json
{
  "expo": "~50.0.0",
  "expo-document-picker": "~11.10.1",
  "expo-file-system": "~16.0.9",
  "expo-sharing": "~11.10.0",
  "react-native-webview": "13.6.4",
  "axios": "^1.6.7",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/native-stack": "^6.9.17"
}
```
