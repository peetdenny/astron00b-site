# Environment Variables Setup

Create a `.env` file in the root of the project with the following variables:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/astronoob?retryWrites=true&w=majority

# Google OAuth credentials (Phase 2)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Session secret for JWT signing (Phase 2)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-random-secret-here

# Site URL (for OAuth redirects)
SITE_URL=http://localhost:4321
```

## Setup Instructions

### MongoDB Atlas (Phase 1)
1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is fine)
3. Create a database named `astronoob`
4. Create collections: `users` and `scopes`
5. Get your connection string and add it to `MONGODB_URI`

### Google OAuth (Phase 2)
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:4321/api/auth/callback` (for local dev)
   - `https://your-site.netlify.app/api/auth/callback` (for production)
6. Copy Client ID and Client Secret

### Session Secret
Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

