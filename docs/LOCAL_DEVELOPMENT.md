# Local Development Guide

## Why You Can't Open index.html Directly

Modern browsers block ES6 modules and CORS requests when opening HTML files directly (`file://` protocol). You need to run a local web server to test the site.

## Quick Start - Run Local Server

### Option 1: Using Firebase Emulators (Recommended)

This is the best option as it emulates the full Firebase environment including Firestore, Functions, and Hosting.

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Navigate to project directory
cd jam

# Install dependencies
npm install
cd functions && npm install && cd ..

# Start Firebase emulators
firebase emulators:start
```

The site will be available at: `http://localhost:5000`

The emulator UI will be at: `http://localhost:4000`

### Option 2: Using Python (Simple HTTP Server)

If you just want to preview the frontend without Firebase:

```bash
# Navigate to the public directory
cd jam/public

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

The site will be available at: `http://localhost:8000`

**Note:** Firebase features won't work with this method.

### Option 3: Using Node.js http-server

```bash
# Install http-server globally
npm install -g http-server

# Navigate to public directory
cd jam/public

# Start server
http-server -p 8000
```

The site will be available at: `http://localhost:8000`

### Option 4: Using VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click on `jam/public/index.html`
3. Select "Open with Live Server"

The site will open automatically in your browser.

## Firebase Emulator Setup (Detailed)

### 1. Install Firebase Tools

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Emulators (if not already done)

```bash
cd jam
firebase init emulators
```

Select:
- ✅ Authentication Emulator
- ✅ Firestore Emulator
- ✅ Functions Emulator
- ✅ Hosting Emulator
- ✅ Storage Emulator

Use default ports or customize as needed.

### 4. Configure Emulator Ports

Your `firebase.json` should have an emulators section:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 5. Start Emulators

```bash
firebase emulators:start
```

Or with data import:

```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

### 6. Access the Site

- **Website:** http://localhost:5000
- **Emulator UI:** http://localhost:4000
- **Firestore:** http://localhost:8080
- **Functions:** http://localhost:5001
- **Auth:** http://localhost:9099

## Emulator Data Seeding

### Create Sample Data

Create a file `jam/emulator-data-seed.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  // Add sample jams
  await db.collection('jams').doc('sample1').set({
    name: 'Monday Night Jam',
    venue: 'The Crane Bar',
    day: 'Monday',
    time: '21:00',
    description: 'Traditional Irish music session',
    active: true
  });

  // Add sample venues
  await db.collection('venues').doc('venue1').set({
    name: 'The Crane Bar',
    address: 'Sea Road, Galway',
    website: 'https://thecranebar.com'
  });

  // Add site config
  await db.collection('site_config').doc('main').set({
    coverPhotoUrl: 'https://example.com/cover.jpg',
    logoUrls: {
      default: 'images/logo.svg',
      maroon: 'images/logo.svg'
    }
  });

  console.log('Sample data seeded successfully!');
  process.exit(0);
}

seedData().catch(console.error);
```

Run it:

```bash
node emulator-data-seed.js
```

## Troubleshooting

### Issue: CORS Errors

**Problem:** `Access to script at 'file://...' has been blocked by CORS policy`

**Solution:** Use a local web server (see options above). Never open HTML files directly.

### Issue: Firebase Not Connecting

**Problem:** Firebase functions not working in emulator

**Solution:** 
1. Check that emulators are running: `firebase emulators:start`
2. Verify `main.js` connects to emulators when on localhost
3. Check console for connection errors

### Issue: Module Not Found

**Problem:** `Cannot find module 'firebase-admin'`

**Solution:**
```bash
cd jam/functions
npm install
```

### Issue: Port Already in Use

**Problem:** `Error: Port 5000 is already in use`

**Solution:**
```bash
# Find and kill the process using the port (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different ports in firebase.json
```

### Issue: SRI Hash Mismatch

**Problem:** `Failed to find a valid digest in the 'integrity' attribute`

**Solution:** The SRI hash has been removed from DOMPurify script tag. If you want to add it back, generate the correct hash:

```bash
curl https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

## Development Workflow

### 1. Start Development

```bash
cd jam
firebase emulators:start
```

### 2. Make Changes

Edit files in `jam/public/` directory

### 3. Test Changes

Refresh browser at `http://localhost:5000`

### 4. Check Logs

- Browser console for frontend errors
- Terminal for emulator logs
- Emulator UI at `http://localhost:4000` for database inspection

### 5. Deploy When Ready

```bash
firebase deploy
```

## Environment Variables

### Local Development

Create `.env.local` file in `jam/functions/`:

```bash
ADMIN_PIN=your-test-pin-here
```

### Production

Set secrets in Firebase:

```bash
firebase functions:secrets:set ADMIN_PIN
```

## Hot Reload

The Firebase emulator automatically reloads when you make changes to:
- HTML files
- CSS files
- JavaScript files
- Cloud Functions (after save)

No need to restart the emulator for most changes!

## Testing Admin Features

### 1. Enable Admin Mode

1. Open http://localhost:5000
2. Scroll to footer
3. Click "Admin" link
4. Enter PIN (default: check your environment variables)

### 2. Test Admin Functions

- Upload images
- Edit content
- Add/remove items
- Test session expiration (wait 4 hours or modify code)

### 3. Check Audit Logs

Open Emulator UI at http://localhost:4000:
1. Go to Firestore tab
2. Navigate to `audit_logs` collection
3. View logged admin actions

## Performance Testing

### Lighthouse

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5000 --view
```

### Network Throttling

Use Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Select throttling profile (Fast 3G, Slow 3G, etc.)

## Debugging

### Enable Verbose Logging

In `jam/public/js/main.js`, add:

```javascript
// At the top of the file
const DEBUG = true;

// Use throughout code
if (DEBUG) console.log('Debug info:', data);
```

### Firebase Emulator Debug Mode

```bash
firebase emulators:start --debug
```

### Chrome DevTools

- **Console:** View errors and logs
- **Network:** Monitor API calls
- **Application:** Inspect localStorage, cookies
- **Performance:** Profile page load
- **Security:** Check CSP violations

## Best Practices

1. **Always use emulators** for development
2. **Never commit** service account keys
3. **Use environment variables** for secrets
4. **Test on multiple browsers** (Chrome, Firefox, Safari, Edge)
5. **Check mobile responsiveness** using DevTools device mode
6. **Monitor console** for errors and warnings
7. **Clear cache** when testing CSP changes
8. **Export emulator data** before stopping: `--export-on-exit`

## Additional Resources

- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firebase Local Development](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
