# Admin Mode Debug Guide

## Overview
This document provides guidance on debugging admin mode functionality issues. Comprehensive debug logging has been added throughout the admin mode system to help diagnose persistent issues.

## Debug Logging Added

### Frontend (Client-Side)

#### 1. admin-mode.js
Debug logging has been added to track:
- **Initialization**: Full parameter validation and DOM element checks
- **PIN Verification**: Complete flow from user input to backend response
- **Admin Toggle**: UI state changes and class modifications
- **Session Storage**: Success/failure of storage operations with fallback tracking
- **Refresh Callbacks**: Verification that data refresh is triggered

**Key Debug Markers:**
- 🚀 Initialization events
- 🔐 PIN verification flow
- 🔄 UI toggle operations
- 🖱️ Button click events
- 🔑 Admin mode entry
- 🚪 Admin mode exit
- ✅ Success operations
- ❌ Error conditions
- ⚠️ Warning conditions

#### 2. admin-panel.js
Debug logging tracks:
- **Panel Initialization**: Parameter validation and element discovery
- **Venue Management**: CRUD operations on venues
- **Configuration Saves**: Site config and logo URL updates
- **Form Operations**: Add/edit/delete venue workflows

**Key Debug Markers:**
- 🔧 Initialization and setup
- 🏢 Venue management operations
- 💾 Configuration saves
- 📋 Data loading
- ✏️ Edit operations
- 🗑️ Delete operations
- ➕ Add operations

### Backend (Firebase Functions)

#### functions/index.js
Debug logging added to:
- **setAdminClaim**: Complete authentication flow
- **verifyAdminAccess**: Admin claim verification
- **generateSignedUploadUrl**: File upload URL generation

**Key Debug Markers:**
- 🔐 Authentication operations
- 🔒 Access verification
- 📤 Upload operations
- ✅ Success operations
- ❌ Error conditions

## How to Use Debug Logs

### 1. Browser Console
Open the browser developer console (F12) and filter by:
- `[DEBUG]` - All debug messages
- `🔐` - Authentication/PIN verification
- `🔄` - UI state changes
- `❌` - Errors
- `✅` - Successful operations

### 2. Firebase Functions Logs
View backend logs using:
```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to Firebase Console
2. Select your project
3. Navigate to Functions → Logs
4. Filter by function name: `setAdminClaim`, `generateSignedUploadUrl`

### 3. Common Issues to Check

#### Issue: Admin mode not activating
**Check for:**
1. `🚀 [DEBUG] initializeAdminMode called` - Confirms initialization
2. `🖱️ [DEBUG] Admin button clicked` - Confirms button works
3. `🔐 [DEBUG] verifyPin called` - Confirms PIN verification starts
4. Backend response in `🔐 [DEBUG] setAdminClaim response received`
5. `✅ [DEBUG] PIN verification successful` - Confirms success
6. `🔄 [DEBUG] toggleAdminMode called with enable=true` - Confirms UI toggle
7. `✅ [DEBUG] Admin mode is now: ENABLED` - Confirms final state

#### Issue: PIN verification fails
**Check for:**
1. `🔐 [DEBUG] PIN length` - Verify PIN format
2. Backend logs for `❌ [DEBUG] Failed admin login attempt`
3. `❌ [DEBUG] PIN provided length` vs `Expected length`
4. Rate limiting: `❌ [DEBUG] Rate limit check failed`
5. Environment variable: `🔐 [DEBUG] Admin PIN configured: true/false`

#### Issue: Admin controls not appearing
**Check for:**
1. `✅ [DEBUG] Refresh callback available: true` - Confirms callback exists
2. `✅ [DEBUG] Executing refresh callback...` - Confirms callback runs
3. `🔄 [DEBUG] Admin mode is now: ENABLED` - Confirms CSS class applied
4. Browser console for CSS errors
5. Network tab for failed resource loads

#### Issue: Session not persisting
**Check for:**
1. `⚠️ [DEBUG] Session storage blocked` - Indicates browser blocking
2. `✅ [DEBUG] In-memory admin state: true` - Confirms fallback working
3. Browser privacy settings (tracking prevention)
4. Incognito/private browsing mode

#### Issue: Upload functionality fails
**Check for:**
1. `📤 [DEBUG] generateSignedUploadUrl called` - Confirms function called
2. `🔒 [DEBUG] Admin access verified` - Confirms admin claim valid
3. `❌ [DEBUG] Admin session expired` - Check if session timed out
4. Storage bucket permissions in Firebase Console

## Debug Log Examples

### Successful Admin Login Flow
```
🚀 [DEBUG] ======================================== 
🚀 [DEBUG] initializeAdminMode called
🚀 [DEBUG] Parameters received: db: true, auth: true, functions: true, refreshCallback: true
🖱️ [DEBUG] Admin button clicked
🔑 [DEBUG] Entering admin mode - showing PIN prompt...
🔐 [DEBUG] verifyPin called
🔐 [DEBUG] Calling setAdminClaim function...
Backend: 🔐 [DEBUG] setAdminClaim function called
Backend: ✅ [DEBUG] PIN matches!
Backend: ✅ [DEBUG] Custom claims set successfully
🔐 [DEBUG] setAdminClaim response received
✅ [DEBUG] PIN verification successful
🔄 [DEBUG] toggleAdminMode called with enable=true
✅ [DEBUG] Admin mode is now: ENABLED
✅ [DEBUG] Executing refresh callback...
```

### Failed Login (Wrong PIN)
```
🔐 [DEBUG] verifyPin called
Backend: 🔐 [DEBUG] setAdminClaim function called
Backend: ❌ [DEBUG] Failed admin login attempt for UID: xxx
Backend: ❌ [DEBUG] PIN provided length: 4, Expected length: 6
❌ [DEBUG] PIN verification failed: Incorrect PIN provided
```

### Session Storage Blocked
```
✅ [DEBUG] PIN verification successful
🔄 [DEBUG] toggleAdminMode called with enable=true
⚠️ [DEBUG] Session storage blocked, using in-memory fallback: SecurityError
✅ [DEBUG] In-memory admin state: true
✅ [DEBUG] Admin mode is now: ENABLED
```

## Troubleshooting Steps

### Step 1: Verify Initialization
1. Open browser console
2. Refresh page
3. Look for `🚀 [DEBUG] initializeAdminMode called`
4. Verify all parameters show `true`
5. Verify admin button found: `Admin mode button found: true`

### Step 2: Test Admin Button
1. Click the Admin button
2. Look for `🖱️ [DEBUG] Admin button clicked`
3. Verify PIN prompt appears
4. Enter PIN and submit

### Step 3: Monitor PIN Verification
1. Watch for `🔐 [DEBUG] verifyPin called`
2. Check backend logs for corresponding function call
3. Verify PIN comparison in backend logs
4. Check for success/failure response

### Step 4: Verify UI Update
1. After successful PIN, look for `🔄 [DEBUG] toggleAdminMode called with enable=true`
2. Verify body class updated: `Updated body classes: ... admin-mode`
3. Check button text changed: `Admin button text updated to: "Exit Admin"`

### Step 5: Check Data Refresh
1. Look for `✅ [DEBUG] Executing refresh callback...`
2. Verify no errors in subsequent operations
3. Check that admin controls appear in UI

## Environment Variables

Ensure these are set in Firebase:
```bash
firebase functions:config:set admin.pin="YOUR_PIN_HERE"
```

Or using secrets (recommended):
```bash
firebase functions:secrets:set ADMIN_PIN
```

## Browser Compatibility

### Known Issues:
1. **Safari with Tracking Prevention**: Session storage may be blocked
   - Solution: In-memory fallback is automatic
   - User must re-authenticate on page refresh

2. **Firefox Private Browsing**: Session storage disabled
   - Solution: Same as Safari

3. **Chrome Incognito**: Session storage works but cleared on close
   - Expected behavior

## Next Steps

If issues persist after reviewing debug logs:

1. **Collect Full Debug Output**
   - Copy all console logs from page load through error
   - Include backend function logs
   - Note exact error messages

2. **Check Firebase Configuration**
   - Verify ADMIN_PIN is set
   - Check Firebase Functions deployment status
   - Verify Firestore security rules allow admin operations

3. **Test in Different Browser**
   - Try Chrome, Firefox, Safari
   - Test in normal and incognito/private mode
   - Check if issue is browser-specific

4. **Verify Network Connectivity**
   - Check Network tab in DevTools
   - Look for failed requests
   - Verify Firebase SDK loaded correctly

## Additional Resources

- Firebase Functions Logs: `firebase functions:log`
- Firebase Console: https://console.firebase.google.com
- Browser DevTools: F12 or Cmd+Option+I (Mac)
- Network Tab: Monitor all HTTP requests
- Console Tab: View all debug logs

## Contact

If you need additional debugging assistance, provide:
1. Full console log output (with timestamps)
2. Backend function logs
3. Browser and version
4. Steps to reproduce
5. Expected vs actual behavior
