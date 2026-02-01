# Replit Deployment Guide for Online Election System Backend

## 🚀 Quick Deploy to Replit

### Step 1: Create Replit Project
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub" or "Upload folder"
4. Select Python as language

### Step 2: Upload Backend Files
Upload these files to your Replit:
```
backend/
├── app.py
├── security.py
├── models.py
├── requirements.txt
├── .replit
└── .env.example
```

### Step 3: Configure Environment Variables
1. Click "Tools" > "Secrets" in Replit
2. Add these secrets (get values from your local `.env`):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
ENCRYPTION_KEY=your-fernet-key
JWT_SECRET_KEY=your-jwt-secret-32-chars
ALLOWED_ORIGINS=https://your-frontend.replit.app
CONTRACT_ADDRESS=0x...
ADMIN_ACCOUNT=0x...
GANACHE_URL=http://127.0.0.1:7545
```

**Generate JWT Secret:**
```bash
# Run in Replit Shell
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 4: Install Dependencies
Replit will auto-install from `requirements.txt`, or run:
```bash
pip install -r requirements.txt
```

### Step 5: Run the Server
Click the "Run" button or execute:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Step 6: Test the API
Your API will be available at:
```
https://your-repl-name.your-username.repl.co
```

Test health endpoint:
```bash
curl https://your-repl-name.your-username.repl.co/health
```

---

## 🔧 Configuration for Production

### Update CORS Origins
In Replit Secrets, set:
```bash
ALLOWED_ORIGINS=https://your-frontend.replit.app,https://your-custom-domain.com
```

### Database Schema
Run these SQL scripts in Supabase SQL Editor:
1. `backend/security_schema.sql`
2. `backend/schema_updates.sql`

### Blockchain Setup
For production, use a real blockchain:
```bash
# Polygon Mumbai Testnet
GANACHE_URL=https://rpc-mumbai.maticvigil.com

# Or Polygon Mainnet
GANACHE_URL=https://polygon-rpc.com
```

---

## 📊 Monitoring

### Check Logs
View logs in Replit Console to monitor:
- Startup messages
- API requests
- Errors
- Audit logs

### Health Check
Monitor your API health:
```bash
curl https://your-repl.repl.co/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "blockchain": "connected",
    "database": "connected",
    "yolo": "loaded",
    "mediapipe": "loaded"
  }
}
```

---

## 🛡️ Security Checklist

Before going live:
- [ ] Set strong JWT_SECRET_KEY (32+ chars)
- [ ] Update ALLOWED_ORIGINS to your domain
- [ ] Run database schema updates
- [ ] Test password hashing
- [ ] Test rate limiting
- [ ] Verify audit logging
- [ ] Test JWT authentication
- [ ] Enable HTTPS (Replit provides this)

---

## 🔄 Updating Your Deployment

To update your code:
1. Edit files in Replit editor
2. Click "Run" to restart
3. Or use Git integration to pull changes

---

## 🐛 Troubleshooting

### Issue: "Module not found"
**Solution:** Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: "Environment variable not set"
**Solution:** Add to Replit Secrets (Tools > Secrets)

### Issue: "Port already in use"
**Solution:** Replit handles this automatically, just restart

### Issue: "CORS error"
**Solution:** Update ALLOWED_ORIGINS in Secrets

### Issue: "Database connection failed"
**Solution:** Check SUPABASE_URL and SUPABASE_KEY in Secrets

---

## 📱 Frontend Integration

Update your frontend to use Replit backend URL:
```javascript
// In your frontend .env or config
VITE_API_URL=https://your-backend.your-username.repl.co
```

---

## 💰 Replit Pricing

- **Free Tier:** Limited uptime, public repls
- **Hacker Plan ($7/mo):** Always-on, private repls
- **Pro Plan ($20/mo):** More resources, custom domains

For production elections, use **Hacker** or **Pro** plan for 24/7 uptime.

---

## 🎉 You're Ready!

Your backend is now deployed and accessible at:
```
https://your-repl-name.your-username.repl.co
```

Test endpoints:
- `GET /health` - Health check
- `POST /api/register-voter` - Register voter
- `POST /api/login` - Login
- `POST /api/cast-vote` - Cast vote (requires JWT)

**Your election system is live! 🗳️🚀**
