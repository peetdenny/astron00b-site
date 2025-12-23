# AstroN00b Authentication System

Complete Google OAuth authentication with user scope management for radio astronomy enthusiasts.

## 🎯 Features

- ✅ **Google OAuth 2.0 Login** - Secure authentication via Google accounts
- ✅ **User Dashboard** - Personalized space for each user
- ✅ **Scope Management** - Create, edit, and delete telescope scopes
- ✅ **Dual Units** - Support for both metric (mm) and imperial (inches)
- ✅ **Auto-Geocoding** - Automatically determine country from coordinates
- ✅ **Multi-Scope Support** - Manage unlimited scopes
- ✅ **Secure Sessions** - 30-day JWT-based sessions
- ✅ **Protected Routes** - Dashboard and scope pages require authentication

## 📦 Tech Stack

- **Frontend:** Astro 5 with SSR
- **Authentication:** Google OAuth 2.0 with PKCE
- **Database:** MongoDB Atlas
- **Session Management:** JWT (jose library)
- **Hosting:** Netlify with Edge Functions
- **Geocoding:** Nominatim (OpenStreetMap)

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ (20+ recommended for Netlify)
- MongoDB Atlas account
- Google Cloud Console account
- Netlify account

### 2. Clone and Install

```bash
cd astron00b-site
npm install
```

### 3. Set Up MongoDB Atlas

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free M0 tier is sufficient)
3. Database name: `astronoob`
4. Collections: `users`, `scopes`
5. Get connection string (Database → Connect → Drivers)

### 4. Set Up Google OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add authorized redirect URIs:
   ```
   http://localhost:4321/api/auth/callback
   https://your-site.netlify.app/api/auth/callback
   ```
7. Save Client ID and Client Secret

### 5. Configure Environment Variables

Create `.env` in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/astronoob

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Session Secret (generate with command below)
SESSION_SECRET=your-random-64-character-hex-string

# Site URL
SITE_URL=http://localhost:4321
```

Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Initialize Database

Create indexes in MongoDB:

```bash
npx tsx scripts/init-db.ts
```

### 7. Run Development Server

```bash
npm run dev
```

Visit http://localhost:4321

## 🌐 Deploying to Netlify

### 1. Create Netlify Site

1. Go to https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Connect to GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** `astron00b-site`

### 2. Configure Environment Variables

In Netlify dashboard → Site settings → Environment variables:

Add all variables from your `.env` file, updating:
```env
SITE_URL=https://your-actual-site.netlify.app
```

### 3. Update Google OAuth

Add production redirect URI to Google Console:
```
https://your-actual-site.netlify.app/api/auth/callback
```

### 4. Deploy

Push to GitHub - Netlify will auto-deploy!

## 📚 API Endpoints

### Authentication

```
GET  /api/auth/login     - Initiate Google OAuth flow
GET  /api/auth/callback  - OAuth callback handler
GET  /api/auth/logout    - Clear session, logout user
GET  /api/auth/user      - Get current user (JSON)
```

### Scopes (Authentication Required)

```
GET    /api/scopes       - List user's scopes
POST   /api/scopes       - Create new scope
GET    /api/scopes/:id   - Get scope details
PUT    /api/scopes/:id   - Update scope
DELETE /api/scopes/:id   - Delete scope
```

### Scope Object

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,           // "My Backyard Dish"
  latitude: number,       // 40.7128
  longitude: number,      // -74.0060
  country: string,        // "United States"
  dishSizeMm: number,     // 3048 (stored in mm)
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security

- **HTTP-only cookies** - Prevents XSS attacks
- **SameSite=Lax** - CSRF protection
- **PKCE for OAuth** - Prevents authorization code interception
- **State parameter** - Additional CSRF protection
- **User ownership checks** - Users can only access their own scopes
- **JWT signed sessions** - Tamper-proof session tokens
- **Secure cookies in production** - Transmitted only over HTTPS

## 📁 Project Structure

```
astron00b-site/
├── src/
│   ├── lib/
│   │   ├── db.ts              # MongoDB connection & models
│   │   ├── auth.ts            # Session management (JWT)
│   │   ├── units.ts           # mm ↔ inches conversions
│   │   └── geocoding.ts       # Reverse geocoding API
│   ├── pages/
│   │   ├── dashboard.astro    # User dashboard (protected)
│   │   ├── scopes/
│   │   │   ├── new.astro      # Create scope form
│   │   │   └── [id].astro     # Edit scope form
│   │   └── api/
│   │       ├── auth/          # OAuth endpoints
│   │       └── scopes/        # Scope CRUD API
│   ├── components/
│   │   └── Layout.astro       # Main layout with auth menu
│   ├── scripts/
│   │   └── authMenu.js        # Client-side auth state
│   └── styles/
│       └── base.css           # Global styles
├── scripts/
│   └── init-db.ts             # Database initialization
├── netlify.toml               # Netlify configuration
├── astro.config.mjs           # Astro config with Netlify adapter
└── package.json
```

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Click "Login" redirects to Google
- [ ] Google OAuth completes successfully
- [ ] Redirects to dashboard after login
- [ ] Username displays in navigation
- [ ] Logout clears session and redirects home
- [ ] Protected pages redirect to login when not authenticated

**Scope Management:**
- [ ] Create scope with mm units
- [ ] Create scope with inches units
- [ ] Verify country is auto-populated
- [ ] Edit existing scope
- [ ] Delete scope with confirmation
- [ ] Multiple scopes display correctly

**Edge Cases:**
- [ ] Invalid coordinates show error
- [ ] Missing required fields show validation errors
- [ ] Ocean coordinates show "Unknown" country
- [ ] Very large/small dish sizes handle correctly

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Node version (18+ required, 20+ for Netlify)
- All environment variables set
- MongoDB connection string valid
- `npm install` completed successfully

### OAuth Fails

**Check:**
- Redirect URI matches exactly (including protocol)
- Google OAuth credentials are correct
- SITE_URL environment variable is correct
- Cookies are enabled in browser

### Database Errors

**Check:**
- MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for serverless)
- Connection string includes database name
- Indexes created (`npx tsx scripts/init-db.ts`)
- Database user has read/write permissions

### Session Issues

**Check:**
- SESSION_SECRET is set and consistent
- Cookies are working (check browser dev tools)
- Clock sync (JWT expiration depends on server time)

## 📈 Future Enhancements

Potential additions for future development:

- [ ] GitHub OAuth provider
- [ ] Facebook OAuth provider  
- [ ] Scope selector in visibility tool
- [ ] Calculate what's visible from specific scope
- [ ] Dish performance metrics (beamwidth, gain)
- [ ] Public scope profiles
- [ ] Community scope directory
- [ ] Export scope data (JSON, CSV)
- [ ] Mobile app with scope management
- [ ] Scope sharing with other users
- [ ] Equipment tracking (LNAs, filters, etc.)

## 📄 License

Same license as AstroN00b project.

## 🤝 Contributing

Issues and pull requests welcome! Please test thoroughly before submitting.

## 📞 Support

- Check the implementation docs: `IMPLEMENTATION_COMPLETE.md`
- Review phase completion docs: `PHASE1_COMPLETE.md`, `PHASE2_COMPLETE.md`, `PHASE3_COMPLETE.md`
- Open an issue on GitHub

---

Built with 🔭 for the radio astronomy community

