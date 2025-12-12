# Complete Setup Guide - From Scratch

This guide assumes you have **nothing installed** and will walk you through every step.

---

## Step 1: Install Node.js

Node.js is required for Firebase CLI and running a local server.

### Windows:
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer
4. Accept all defaults
5. Restart your computer

### Verify Installation:
```bash
node --version
npm --version
```

You should see version numbers like `v20.x.x` and `10.x.x`

---

## Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
```

This will take a few minutes. Wait for it to complete.

### Verify Installation:
```bash
firebase --version
```

You should see a version number like `13.x.x`

---

## Step 3: Login to Firebase

```bash
firebase login
```

This will open your browser. Log in with your Google account that has access to the Firebase project.

---

## Step 4: Navigate to Project Directory

```bash
cd C:\Users\admin\Desktop\donnacha_git\jam
```

---

## Step 5: Install Project Dependencies

### Install Frontend Dependencies:
```bash
npm install
```

### Install Functions Dependencies:
```bash
cd functions
npm install
cd ..
```

---

## Step 6: Initialize Firebase Emulators (First Time Only)

```bash
firebase init emulators
```

When prompted:
- Select: **Authentication, Firestore, Functions, Hosting, Storage**
- Use default ports (just press Enter for each)
- Enable Emulator UI: **Yes**

---

## Step 7: Start Firebase Emulators

```bash
firebase emulators:start
```

You should see output like:
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! View status and logs at http://localhost:4000 │
└─────────────────────────────────────────────────────────────┘

┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Auth      │ localhost:9099 │ http://localhost:4000/auth      │
├───────────┼────────────────┼─────────────────────────────────┤
│ Functions │ localhost:5001 │ http://localhost:4000/functions │
├───────────┼────────────────┼─────────────────────────────────┤
│ Firestore │ localhost:8080 │ http://localhost:4000/firestore │
├───────────┼────────────────┼─────────────────────────────────┤
│ Hosting   │ localhost:5000 │ n/a                             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Storage   │ localhost:9199 │ http://localhost:4000/storage   │
└───────────┴────────────────┴─────────────────────────────────┘
```

---

## Step 8: Open the Website

Open your browser and go to:
```
http://localhost:5000
```

You should see the Galway Jam Circle website!

---

## Alternative: Simple HTTP Server (No Firebase Features)

If you just want to preview the HTML/CSS/JS without Firebase:

### Option A: Using Node.js http-server

```bash
# Install http-server globally
npm install -g http-server

# Navigate to public directory
cd C:\Users\admin\Desktop\donnacha_git\jam\public

# Start server
http-server -p 8000
```

Open: http://localhost:8000

### Option B: Using VS Code Live Server Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Live Server"
4. Install "Live Server" by Ritwick Dey
5. Right-click on `jam/public/index.html`
6. Select "Open with Live Server"

The site will open automatically in your browser.

---

## Troubleshooting

### Issue: "firebase is not recognized"

**Solution:** 
1. Close and reopen your terminal/command prompt
2. If still not working, add to PATH manually:
   - Windows: Search for "Environment Variables"
   - Add `C:\Users\[YourUsername]\AppData\Roaming\npm` to PATH
   - Restart terminal

### Issue: "npm is not recognized"

**Solution:** Node.js not installed correctly. Reinstall Node.js and restart computer.

### Issue: Port Already in Use

**Solution:**
```bash
# Windows: Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID [PID] /F
```

### Issue: Emulator Won't Start

**Solution:**
1. Check if all dependencies are installed:
   ```bash
   cd jam/functions
   npm install
   cd ..
   ```

2. Try starting with verbose logging:
   ```bash
   firebase emulators:start --debug
   ```

### Issue: "Cannot find module"

**Solution:**
```bash
# In jam directory
npm install

# In jam/functions directory
cd functions
npm install
cd ..
```

---

## What Each Tool Does

### Node.js
- JavaScript runtime that lets you run JavaScript outside the browser
- Required for Firebase CLI and npm

### npm (Node Package Manager)
- Comes with Node.js
- Installs and manages JavaScript packages/libraries

### Firebase CLI
- Command-line tool for Firebase
- Lets you deploy, test, and manage Firebase projects

### Firebase Emulators
- Local versions of Firebase services
- Lets you test without affecting production data
- Free to use, no charges

---

## Daily Development Workflow

### 1. Start Your Day
```bash
cd C:\Users\admin\Desktop\donnacha_git\jam
firebase emulators:start
```

### 2. Make Changes
Edit files in `jam/public/` directory

### 3. Test Changes
Refresh browser at http://localhost:5000

### 4. Stop Emulators
Press `Ctrl+C` in the terminal

### 5. Deploy to Production (When Ready)
```bash
firebase deploy
```

---

## Quick Reference Commands

```bash
# Start emulators
firebase emulators:start

# Start emulators with data persistence
firebase emulators:start --import=./emulator-data --export-on-exit

# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# View logs
firebase functions:log

# Check Firebase project
firebase projects:list
```

---

## System Requirements

- **OS:** Windows 10/11, macOS, or Linux
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 2GB free space
- **Internet:** Required for initial setup and deployment

---

## Next Steps After Setup

1. ✅ Verify emulators are running
2. ✅ Open http://localhost:5000 in browser
3. ✅ Check browser console for errors (F12)
4. ✅ Test admin features (scroll to footer, click "Admin")
5. ✅ Make a small change and verify hot reload works

---

## Getting Help

### Firebase Documentation
- https://firebase.google.com/docs

### Firebase Emulator Suite
- https://firebase.google.com/docs/emulator-suite

### Node.js Documentation
- https://nodejs.org/docs

### Project-Specific Help
- Check `jam/README.md` for project overview
- Check `jam/docs/LOCAL_DEVELOPMENT.md` for detailed dev guide
- Check `jam/docs/PHASE1_COMPLETION_SUMMARY.md` for recent changes

---

## Estimated Setup Time

- **First time:** 30-45 minutes (including downloads)
- **Subsequent times:** 2-3 minutes (just start emulators)

---

## Success Checklist

- [ ] Node.js installed and verified
- [ ] Firebase CLI installed and verified
- [ ] Logged into Firebase
- [ ] Project dependencies installed
- [ ] Emulators initialized
- [ ] Emulators running successfully
- [ ] Website accessible at http://localhost:5000
- [ ] No errors in browser console
- [ ] Can make changes and see them reflected

Once all items are checked, you're ready to develop!
