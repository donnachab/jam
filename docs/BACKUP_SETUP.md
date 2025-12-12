# Automated Firestore Backup Setup Guide

## Overview
This guide explains how to set up automated daily backups for your Firestore database using Google Cloud Scheduler and Cloud Functions.

## Prerequisites
- Firebase project with Firestore enabled
- Google Cloud Platform billing enabled
- `gcloud` CLI installed and authenticated
- Firebase CLI installed

## Step 1: Enable Required APIs

```bash
# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Enable Cloud Functions API (should already be enabled)
gcloud services enable cloudfunctions.googleapis.com

# Enable Firestore Export API
gcloud services enable firestore.googleapis.com
```

## Step 2: Create a Cloud Storage Bucket for Backups

```bash
# Replace PROJECT_ID with your Firebase project ID
export PROJECT_ID="galway-jam-circle-live"
export BUCKET_NAME="${PROJECT_ID}-firestore-backups"

# Create the bucket
gsutil mb -p ${PROJECT_ID} -l europe-west1 gs://${BUCKET_NAME}

# Set lifecycle policy to delete backups older than 30 days
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://${BUCKET_NAME}
rm lifecycle.json
```

## Step 3: Grant Permissions

```bash
# Get the App Engine default service account
export SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant Firestore export permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.importExportAdmin"

# Grant storage permissions
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectAdmin gs://${BUCKET_NAME}
```

## Step 4: Create Backup Cloud Function

Create a new file `jam/functions/backup.js`:

```javascript
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getFirestore} = require("firebase-admin/firestore");
const {initializeApp} = require("firebase-admin/app");

initializeApp();

/**
 * Scheduled function to backup Firestore database daily
 * Runs at 2 AM UTC every day
 */
exports.scheduledFirestoreBackup = onSchedule({
    schedule: "0 2 * * *", // 2 AM UTC daily
    timeZone: "UTC",
    region: "europe-west1",
}, async (event) => {
    const projectId = process.env.GCLOUD_PROJECT;
    const bucket = `gs://${projectId}-firestore-backups`;
    
    const client = getFirestore();
    const timestamp = new Date().toISOString().split('T')[0];
    const outputUriPrefix = `${bucket}/${timestamp}`;
    
    try {
        console.log(`Starting Firestore backup to ${outputUriPrefix}`);
        
        await client._firestore.exportDocuments({
            outputUriPrefix: outputUriPrefix,
            // Optional: specify collections to backup
            // collectionIds: ['jams', 'venues', 'events', 'photos', 'community', 'site_config']
        });
        
        console.log(`Firestore backup completed successfully to ${outputUriPrefix}`);
        return {success: true, location: outputUriPrefix};
    } catch (error) {
        console.error('Firestore backup failed:', error);
        throw error;
    }
});
```

## Step 5: Update functions/index.js

Add this line to `jam/functions/index.js`:

```javascript
// At the top of the file
exports.backup = require('./backup');
```

## Step 6: Deploy the Backup Function

```bash
cd jam/functions
npm install
cd ..
firebase deploy --only functions:backup.scheduledFirestoreBackup
```

## Step 7: Verify Backup Schedule

```bash
# List all Cloud Scheduler jobs
gcloud scheduler jobs list --project=${PROJECT_ID}

# Check the backup function logs
firebase functions:log --only backup.scheduledFirestoreBackup
```

## Step 8: Manual Backup (Optional)

To trigger a manual backup immediately:

```bash
gcloud scheduler jobs run scheduledFirestoreBackup --project=${PROJECT_ID}
```

Or create a callable function for manual backups:

```javascript
// Add to functions/backup.js
const {onCall, HttpsError} = require("firebase-functions/v2/https");

exports.manualBackup = onCall(async (request) => {
    // Verify admin access
    if (!request.auth || !request.auth.token.admin) {
        throw new HttpsError("permission-denied", "Admin access required");
    }
    
    const projectId = process.env.GCLOUD_PROJECT;
    const bucket = `gs://${projectId}-firestore-backups`;
    const client = getFirestore();
    const timestamp = new Date().toISOString();
    const outputUriPrefix = `${bucket}/manual-${timestamp}`;
    
    try {
        await client._firestore.exportDocuments({
            outputUriPrefix: outputUriPrefix,
        });
        
        return {success: true, location: outputUriPrefix};
    } catch (error) {
        console.error('Manual backup failed:', error);
        throw new HttpsError("internal", "Backup failed");
    }
});
```

## Backup Restoration

To restore from a backup:

```bash
# List available backups
gsutil ls gs://${BUCKET_NAME}

# Restore from a specific backup
# WARNING: This will overwrite existing data!
gcloud firestore import gs://${BUCKET_NAME}/2025-12-12 \
  --project=${PROJECT_ID}
```

## Monitoring

### Set Up Alerts

1. Go to Google Cloud Console > Monitoring > Alerting
2. Create a new alert policy:
   - **Resource type:** Cloud Function
   - **Metric:** Execution count or Error count
   - **Condition:** Function execution fails
   - **Notification:** Email to admin

### Check Backup Status

```bash
# View recent backups
gsutil ls -l gs://${BUCKET_NAME}

# Check backup size
gsutil du -sh gs://${BUCKET_NAME}/*

# View function logs
gcloud functions logs read scheduledFirestoreBackup \
  --project=${PROJECT_ID} \
  --limit=50
```

## Cost Estimation

- **Cloud Scheduler:** $0.10 per job per month
- **Cloud Functions:** ~$0.01 per backup (minimal execution time)
- **Cloud Storage:** ~$0.02 per GB per month
- **Firestore Export:** Free (included in Firestore pricing)

**Estimated monthly cost:** $1-5 depending on database size

## Backup Retention Policy

Current policy: 30 days retention

To change retention period, update the lifecycle policy:

```bash
# Example: 90 days retention
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://${BUCKET_NAME}
```

## Troubleshooting

### Backup Function Not Running

1. Check Cloud Scheduler job status:
   ```bash
   gcloud scheduler jobs describe scheduledFirestoreBackup --project=${PROJECT_ID}
   ```

2. Check function logs for errors:
   ```bash
   firebase functions:log --only backup.scheduledFirestoreBackup
   ```

3. Verify IAM permissions:
   ```bash
   gcloud projects get-iam-policy ${PROJECT_ID} \
     --flatten="bindings[].members" \
     --filter="bindings.members:${SERVICE_ACCOUNT}"
   ```

### Insufficient Permissions Error

Grant additional permissions:

```bash
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.owner"
```

### Storage Quota Exceeded

1. Check current storage usage:
   ```bash
   gsutil du -sh gs://${BUCKET_NAME}
   ```

2. Delete old backups manually:
   ```bash
   gsutil rm -r gs://${BUCKET_NAME}/2025-01-*
   ```

3. Adjust retention policy to shorter period

## Security Considerations

1. **Bucket Access:** Ensure backup bucket has restricted access
2. **Encryption:** Backups are encrypted at rest by default
3. **Audit Logging:** Enable Cloud Audit Logs for backup operations
4. **Access Control:** Only grant backup permissions to necessary service accounts

## Best Practices

1. **Test Restoration:** Regularly test backup restoration in a dev environment
2. **Monitor Backup Size:** Set up alerts for unusual backup size changes
3. **Document Procedures:** Keep this guide updated with any changes
4. **Multiple Regions:** Consider cross-region backup replication for disaster recovery
5. **Backup Validation:** Implement automated backup validation checks

## Additional Resources

- [Firestore Export/Import Documentation](https://cloud.google.com/firestore/docs/manage-data/export-import)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Cloud Storage Lifecycle Management](https://cloud.google.com/storage/docs/lifecycle)
