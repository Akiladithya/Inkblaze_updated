# 🔧 STEP-BY-STEP FIX GUIDE WITH CORRECTED CODE

## FIX #1: FormData Cross-Platform Compatibility (CRITICAL - Unblocks uploads)

**File**: `src/services/api.js`  
**Lines to replace**: 1-110 (entire API service)

**Replace entire file with**:

```javascript
// src/services/api.js

import axios from "axios";
import { Platform } from "react-native";

// Dynamic BASE_URL based on platform
let BASE_URL = "http://localhost:5000";

// For Expo Android/iOS on physical devices, use the machine IP
// Uncomment and update the IP below:
// if (Platform.OS !== 'web') {
//   BASE_URL = 'http://192.168.x.x:5000';  // Replace with your machine's local IP
// }

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min — PDF processing can be slow
  headers: {
    Accept: "application/json",
  },
});

// Intercept responses for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  },
);

/**
 * Upload a file to /highlight-text endpoint.
 * Handles both web (File) and React Native (uri-based) uploads.
 *
 * @param {Object|File} file - File object (web) or file data (React Native)
 * @param {Function} onUploadProgress - Progress callback (optional)
 * @returns {Promise<{ highlighted_text: string, output_pdf_path: string }>}
 */
export const highlightText = async (file, onUploadProgress) => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // On web: file is a native File object, append directly
    formData.append("file", file);
  } else {
    // On React Native (iOS/Android): file has uri, name, mimeType
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || getMimeType(file.name),
    });
  }

  const response = await apiClient.post("/highlight-text", formData, {
    onUploadProgress: onUploadProgress
      ? (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          onUploadProgress(percent);
        }
      : undefined,
  });

  return response.data;
};

/**
 * Generate MCQs for a file.
 * Handles both web (File) and React Native (uri-based) uploads.
 *
 * @param {Object|File} file - File object (web) or file data (React Native)
 * @param {number} numQuestions - Number of questions to generate
 * @returns {Promise<{ mcqs: string }>}
 */
export const generateMCQs = async (file, numQuestions = 5) => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // On web: file is a native File object, append directly
    formData.append("file", file);
  } else {
    // On React Native: file has uri, name, mimeType
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || getMimeType(file.name),
    });
  }

  formData.append("num_questions", String(numQuestions));

  const response = await apiClient.post("/generate-mcqs", formData);

  return response.data;
};

/**
 * Build the full URL to download the highlighted PDF.
 * @param {string} outputPdfPath - Path returned by backend e.g. "uploads/highlighted_with_mcqs.pdf"
 * @returns {string}
 */
export const getPdfUrl = (outputPdfPath) => {
  // Strip leading slash if present
  const cleanPath = outputPdfPath.startsWith("/")
    ? outputPdfPath.slice(1)
    : outputPdfPath;
  return `${BASE_URL}/${cleanPath}`;
};

// Helper function to determine MIME type by file extension
function getMimeType(filename) {
  if (!filename) return "application/octet-stream";
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    default:
      return "application/octet-stream";
  }
}

export default { highlightText, generateMCQs, getPdfUrl };
```

---

## FIX #2: Remove Deprecated Shadow Props (MEDIUM - Cleans console)

**File**: `src/styles/theme.js`  
**Lines**: 88-111

**Current code**:

```javascript
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 14,
  },
};
```

**Replace with**:

```javascript
export const shadows = {
  sm:
    Platform.OS === "web"
      ? { boxShadow: "0 2px 6px rgba(26, 43, 74, 0.12)" }
      : {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 6,
          elevation: 3,
        },
  md:
    Platform.OS === "web"
      ? { boxShadow: "0 6px 16px rgba(26, 43, 74, 0.12)" }
      : {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 8,
        },
  lg:
    Platform.OS === "web"
      ? { boxShadow: "0 12px 28px rgba(26, 43, 74, 0.22)" }
      : {
          shadowColor: colors.shadowStrong,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 1,
          shadowRadius: 28,
          elevation: 14,
        },
};
```

**Also add Platform import at the top**:

```javascript
import { Platform } from "react-native";
```

---

## FIX #3: useNativeDriver on Web (MEDIUM - Cleans console)

### Fix #3a: ProcessingScreen.js

**File**: `src/screens/ProcessingScreen.js`  
**Lines**: 20-26

**Current**:

```javascript
useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }).start();
```

**Replace with**:

```javascript
useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: Platform.OS !== 'web',
  }).start();
```

### Fix #3b: HomeScreen.js

**File**: `src/screens/HomeScreen.js`  
**Lines**: 75-95

**Current**:

```javascript
const handlePressIn = () => {
  Animated.spring(ctaBtnScale, {
    toValue: 0.97,
    useNativeDriver: true,
  }).start();
};
const handlePressOut = () => {
  Animated.spring(ctaBtnScale, {
    toValue: 1,
    useNativeDriver: true,
  }).start();
};
```

**Replace with**:

```javascript
const handlePressIn = () => {
  Animated.spring(ctaBtnScale, {
    toValue: 0.97,
    useNativeDriver: Platform.OS !== "web",
  }).start();
};
const handlePressOut = () => {
  Animated.spring(ctaBtnScale, {
    toValue: 1,
    useNativeDriver: Platform.OS !== "web",
  }).start();
};
```

### Fix #3c: UploadCard.js

**File**: `src/components/UploadCard.js`  
**Lines**: 20-35

**Current**:

```javascript
Animated.sequence([
  Animated.timing(scaleAnim, {
    toValue: 0.97,
    duration: 100,
    useNativeDriver: true,
  }),
  Animated.timing(scaleAnim, {
    toValue: 1,
    duration: 100,
    useNativeDriver: true,
  }),
]).start();
```

**Replace with**:

```javascript
Animated.sequence([
  Animated.timing(scaleAnim, {
    toValue: 0.97,
    duration: 100,
    useNativeDriver: Platform.OS !== "web",
  }),
  Animated.timing(scaleAnim, {
    toValue: 1,
    duration: 100,
    useNativeDriver: Platform.OS !== "web",
  }),
]).start();
```

**Also add Platform import at top**:

```javascript
import { Platform } from "react-native";
```

### Fix #3d: ResultScreen.js

**File**: `src/screens/ResultScreen.js`  
**Lines**: 33-42

**Current**:

```javascript
useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }),
  ]).start();
}, []);
```

**Replace with**:

```javascript
useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: Platform.OS !== "web",
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: Platform.OS !== "web",
    }),
  ]).start();
}, []);
```

**Also add Platform import at top**:

```javascript
import { Platform } from "react-native";
```

---

## VERIFICATION STEPS

### After applying FIX #1 (Critical Fix):

1. **Clear browser cache**: Press `Ctrl+Shift+Del` in browser
2. **Hard refresh**: Press `Ctrl+F5` or `Cmd+Shift+R`
3. **Open browser console**: Press `F12`
4. **Try uploading a PDF**:
   - Should NO LONGER see CORS error
   - Should see request reach backend (check backend terminal)
   - Backend should process and return results
5. **Download the highlighted PDF**

### After applying FIX #2 & #3 (Cleanup Fixes):

1. **Reload page**: `F5`
2. **Check console**: Should be clean, no warnings about:
   - `"shadow*" style props are deprecated`
   - `useNativeDriver is not supported`

---

## SUMMARY

| Fix                      | Priority    | Impact                  | Time       |
| ------------------------ | ----------- | ----------------------- | ---------- |
| FormData (FIX #1)        | 🔴 CRITICAL | Unblocks all uploads    | 2 min      |
| Shadow Props (FIX #2)    | 🟡 MEDIUM   | Cleans console          | 5 min      |
| useNativeDriver (FIX #3) | 🟡 MEDIUM   | Cleans console          | 10 min     |
| **TOTAL**                |             | **All uploads working** | **17 min** |

---

## TESTING CHECKLIST

After all fixes:

- [ ] No CORS errors in console
- [ ] No "shadow\*" deprecation warnings
- [ ] No "useNativeDriver" warnings
- [ ] Can browse and select PDF/DOCX
- [ ] Upload completes successfully
- [ ] Highlighted text displays
- [ ] PDF downloads
- [ ] Can open PDF in viewer
- [ ] MCQs display
- [ ] No errors in backend logs

---

## NEXT STEPS FOR ADVANCED SETUP

Once basic functionality works:

1. **Physical Device Testing**: Uncomment BASE_URL logic in api.js and set your machine's IP
2. **Environment Variables**: Use .env file to configure BASE_URL per environment
3. **Offline Support**: Add service worker for offline functionality
4. **Error Reporting**: Integrate Sentry or similar for production error tracking
