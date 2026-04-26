# Admin Claim Setup

Admin access now uses Firebase Auth custom claims only (`admin: true`).

## One-time setup

1. Create a service account key in Firebase Console:
   - Project settings -> Service accounts -> Generate new private key
2. Save it locally, for example:
   - `C:\Charchaa.com\serviceAccountKey.json`
3. Run this command from project root:

```powershell
@'
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const targetUid = "REPLACE_WITH_ADMIN_UID";

admin.auth().setCustomUserClaims(targetUid, { admin: true })
  .then(() => {
    console.log("Admin claim set successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
'@ | node
```

4. Ask that admin user to log out and log in again (token refresh required).

## Verify

- In app, Admin tab should now appear for that user.
- Firestore rules will allow admin-only reads for `/users/*`.
