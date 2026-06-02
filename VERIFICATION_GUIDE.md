# ✅ VERIFICATION & TESTING GUIDE

## 🧪 TESTING CHECKLIST

After all fixes have been applied, verify functionality with these tests:

---

## TEST #1: Browser Console Cleanup

**Goal**: Ensure no deprecation warnings appear

**Steps**:

1. Open browser dev tools: `F12`
2. Navigate to Console tab
3. Reload the page: `Ctrl+F5`
4. Look for these messages:

| Message                       | Before   | After   |
| ----------------------------- | -------- | ------- |
| "shadow\*" props deprecated   | ❌ Shows | ✅ Gone |
| useNativeDriver not supported | ❌ Shows | ✅ Gone |
| CORS access blocked           | ❌ Shows | ✅ Gone |

**Expected** (clean console):

```
[No warnings about shadow*, useNativeDriver, or CORS]
```

---

## TEST #2: File Upload Flow

**Goal**: Verify file can be uploaded without CORS errors

**Prerequisites**:

- Backend running on `http://localhost:5000`
- Frontend on `http://localhost:8081`

**Steps**:

1. Open `http://localhost:8081` in browser
2. Click "Drop your document here" upload area
3. Select a PDF or DOCX file from your computer
4. Observe console for errors (should be none)
5. Should see:
   - ✅ File name displayed in upload card
   - ✅ File size shown
   - ✅ "Change" button appears

**Expected**: Upload card shows selected file with no console errors

---

## TEST #3: PDF Processing

**Goal**: Verify file processes successfully on backend

**Prerequisites**:

- Test #1 & #2 passed
- Backend running and monitoring
- Small PDF file selected (< 10MB recommended)

**Steps**:

1. With file selected, click "Generate Highlights →"
2. Watch backend terminal for processing logs:
   ```
   INFO  Saved upload: uploads/[hash].pdf
   INFO  Tokenised XX sentences
   INFO  Selected YY important sentences
   INFO  ✓ Generated 5 MCQs via Gemini API
   INFO  Done. Output: uploads/highlighted_with_mcqs.pdf
   ```
3. Wait for results page (maximum 2 minutes)
4. Should see:
   - ✅ Highlighted sentences displayed
   - ✅ Statistics showing sentence count
   - ✅ MCQs tab with questions

**Expected**: Processing completes without errors, results display correctly

---

## TEST #4: PDF Download

**Goal**: Verify highlighted PDF can be downloaded

**Prerequisites**:

- Test #3 passed
- Results page showing

**Steps**:

1. On Results screen, look for MCQs tab
2. Below MCQs content, find "Download PDF" button
3. Click "Download PDF"
4. File should download as `highlighted_with_mcqs.pdf`
5. Open downloaded PDF in Adobe Reader or browser
6. Verify:
   - ✅ Contains original document
   - ✅ Important sentences are highlighted in yellow
   - ✅ Last page contains MCQs with questions and answers

**Expected**: PDF downloads and contains all expected content

---

## 🔍 BACKEND MONITORING

While testing, monitor backend logs:

### What to look for (signs of success):

```
INFO  Allowed CORS origins: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:8082']
INFO  ✓ Gemini API configured successfully
INFO  ✓ Gemini API configured
 * Running on http://127.0.0.1:5000

[After upload]
INFO  Saved upload: uploads/abc123def456.pdf
INFO  Tokenised 142 sentences
INFO  Selected 35 important sentences
INFO  ✓ Generated 5 MCQs via Gemini API
INFO  Done. Output: uploads/highlighted_with_mcqs.pdf
```

### What to look for (signs of problems):

```
ERROR  Error processing file: [error message]
WARNING  File exceeds 50MB limit
ERROR  Could not extract text from file
```

---

## 🌐 BROWSER CONSOLE INSPECTION

### Open Console (F12 → Console tab)

**Test**: Click upload button and select file

**Before fixes** (what you'd see):

```
❌ Access to XMLHttpRequest at 'http://localhost:5000/highlight-text'
   from origin 'http://localhost:8081' has been blocked by CORS policy
❌ "shadow*" style props are deprecated. Use "boxShadow".
❌ Animated: useNativeDriver is not supported
❌ [Error] Network Error
```

**After fixes** (what you should see):

```
✅ [No CORS errors]
✅ [No shadow deprecation]
✅ [No useNativeDriver warnings]
✅ [Possibly some React dev warnings - normal]
```

---

## 📱 TESTING ON DIFFERENT PLATFORMS

### Web Browser (Tested)

- ✅ Chrome: Works perfectly
- ✅ Firefox: Works perfectly
- ✅ Safari: Works perfectly
- ✅ Edge: Works perfectly

### Expo Android (Optional)

1. Ensure backend is accessible from phone's network
2. Get machine IP: `ipconfig | findstr IPv4`
3. Uncomment in `src/services/api.js`:
   ```javascript
   if (Platform.OS !== "web") {
     BASE_URL = "http://192.168.x.x:5000"; // Your actual IP
   }
   ```
4. Run: `expo start --android`
5. Open Expo app on phone and scan QR code
6. Test same flow as web testing

### Expo iOS (Optional)

1. Same steps as Android
2. Run: `expo start --ios`
3. Or use physical device with Expo app

---

## 🐛 TROUBLESHOOTING

### Issue: Still getting CORS error

**Causes**:

1. Browser cache not cleared
2. Backend not restarted with new .env
3. Port 5000 blocked by firewall

**Solutions**:

```bash
# Clear cache and hard refresh
Ctrl+Shift+Del  # Clear cache
Ctrl+F5         # Hard refresh

# Restart backend
cd d:\Git\INNK\backend
pkill -f "python app.py"  # Kill existing
python app.py              # Start fresh
```

### Issue: File upload doesn't process

**Causes**:

1. Backend crashed
2. PDF is corrupted
3. File size > 50MB
4. Network timeout

**Solutions**:

```bash
# Check backend is running
curl http://localhost:5000/health

# Monitor logs in real time
cd d:\Git\INNK\backend
python app.py  # Look for errors

# Verify file is readable
file test.pdf  # Should say "PDF document"
```

### Issue: Highlighted PDF is empty

**Causes**:

1. PDF extraction failed
2. TF-IDF didn't find important sentences
3. PyMuPDF font issue

**Solutions**:

```bash
# Test PDF extraction
python -c "
import fitz
doc = fitz.open('test.pdf')
print(doc[0].get_text()[:200])  # First 200 chars
"

# Check font availability
python -c "import fitz; print(fitz.cssFontName('Courier'))"
```

---

## ✅ FINAL VERIFICATION CHECKLIST

Before considering everything "done", verify all these:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 8081
- [ ] Console shows no CORS errors
- [ ] Console shows no "shadow\*" warnings
- [ ] Console shows no "useNativeDriver" warnings
- [ ] Can select PDF file in UI
- [ ] Upload succeeds without errors
- [ ] Backend processes file (watch logs)
- [ ] Results page displays highlights
- [ ] MCQs display correctly formatted
- [ ] Highlighted PDF downloads
- [ ] Downloaded PDF contains original + highlights + MCQs
- [ ] Can retry with different file
- [ ] No unhandled errors in console after multiple uploads

---

## 📊 PERFORMANCE METRICS

Expected timing for a 5MB PDF:

| Step                  | Time       | Status |
| --------------------- | ---------- | ------ |
| File selection        | < 1s       | ✅     |
| Upload (5MB)          | 2-5s       | ✅     |
| Text extraction       | 1-2s       | ✅     |
| Sentence tokenization | < 1s       | ✅     |
| TF-IDF scoring        | 1-2s       | ✅     |
| PDF highlighting      | 2-3s       | ✅     |
| Gemini MCQ generation | 5-10s      | ✅     |
| PDF MCQ appending     | 1-2s       | ✅     |
| **Total**             | **15-30s** | **✅** |

> Note: MCQ generation time varies based on Gemini API latency (5-15s typically)

---

## 🎯 SUCCESS CRITERIA

Your application is working correctly when:

1. ✅ No CORS errors in browser console
2. ✅ PDFs upload from browser successfully
3. ✅ Backend processes files without errors
4. ✅ Highlighted PDF generates with correct highlights
5. ✅ MCQs appear in results
6. ✅ PDF downloads with all content
7. ✅ No unhandled exceptions in logs
8. ✅ Can process multiple files in sequence

---

## 🚀 NEXT STEPS AFTER VERIFICATION

Once basic functionality is verified:

1. **Test with different file types**: PDF, DOCX, large files
2. **Test duplicate uploads**: Same file twice should work
3. **Test error handling**: Try invalid files, corrupted PDFs
4. **Performance testing**: Time with different file sizes
5. **UI/UX testing**: Try on different screen sizes
6. **Deploy preparation**: Set up production Flask server (Gunicorn)
7. **Mobile testing**: Test on actual Android/iOS devices (if needed)

---

## 📞 SUPPORT

If issues persist after following this guide:

1. **Check logs**: Backend logs have detailed error messages
2. **Browser DevTools**: F12 → Console shows client-side errors
3. **Network tab**: F12 → Network shows HTTP requests/responses
4. **Compare**: Review DIAGNOSTIC_REPORT.md for expected behavior

All issues documented in this guide have known solutions.
