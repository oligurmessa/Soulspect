# SoulSpect Vector Database Setup

## Current Status
✅ **Migration Complete**: Pinecone → ChromaDB + Qwen3-Embedding-8B + Llama 3.3 70B

## Required Setup Steps

### 1. 🔑 Get DeepInfra API Key
1. Visit [DeepInfra](https://deepinfra.com/)
2. Sign up/Login
3. Generate an API key
4. Add to `.env.local`:
```bash
DEEPINFRA_API_KEY="your-deepinfra-api-key-here"
```

### 2. 🐳 Start ChromaDB Locally (for development)
```bash
# Option A: Docker (recommended)
docker run -d -p 8000:8000 chromadb/chroma:latest

# Option B: Python install
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
```

### 3. ☁️ Enable Google Cloud APIs
In Google Cloud Console for project `soulspect-app`:
```bash
gcloud services enable aiplatform.googleapis.com --project=soulspect-app
```

### 4. 🔐 Add IAM Roles to Firebase Service Account
Add these roles to `firebase-adminsdk-fbsvc@soulspect-app.iam.gserviceaccount.com`:
- `roles/aiplatform.user` or `roles/aiplatform.predict`

## 🏥 Health Check

Visit: `/api/diagnostics` to check service status

Expected response when working:
```json
{
  "environment": {
    "deepinfra_api_key": true,
    "chroma_url": "http://localhost:8000",
    "google_cloud_project": "soulspect-app",
    "firebase_service_account": true
  },
  "services": {
    "embedding": { "status": "working" },
    "chroma": { "status": "working" },
    "llama": { "status": "working" }
  }
}
```

## 🔄 Pipeline Flow

### Save Process:
User Input → Backend → **Qwen3-Embedding-8B** → **ChromaDB**

### Query Process:  
User Query → Backend → **Qwen3-Embedding-8B** → **ChromaDB** → **Llama 3.3 70B** → Response

## 🛟 Fallback Behavior

The app is designed to gracefully degrade:
- If ChromaDB is unavailable → Falls back to direct database queries
- If DeepInfra is unavailable → Uses basic text matching
- If Vertex AI is unavailable → Uses basic AI responses

## 🚀 Production Deployment

For production, you'll need:
1. ChromaDB running on GCP (Cloud Run/GKE)
2. DeepInfra API key in environment
3. Vertex AI permissions configured
4. Update `CHROMA_URL` to point to your ChromaDB instance

## 🐛 Troubleshooting

**Common Issues:**

1. **"DEEPINFRA_API_KEY not configured"**
   - Add the API key to `.env.local`

2. **"ChromaDB connection failed"**
   - Ensure ChromaDB is running on port 8000
   - Check `CHROMA_URL` environment variable

3. **"Permission 'aiplatform.endpoints.predict' denied"**
   - Add IAM roles to Firebase service account

4. **Enhanced AI responses failing**
   - Check `/api/diagnostics` for service status
   - Review browser console for detailed error messages