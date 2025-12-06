# ChromaDB Deployment Guide for Google Cloud

## 📋 **Prerequisites**

1. **Install Google Cloud CLI**:
   ```bash
   # macOS
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   
   # Or use Homebrew
   brew install google-cloud-sdk
   ```

2. **Authenticate and set project**:
   ```bash
   gcloud auth login
   gcloud config set project soulspect-app
   ```

## 🚀 **Option 1: Quick Deploy with Cloud Run (Recommended)**

1. **Navigate to deployment directory**:
   ```bash
   cd chromadb-deployment
   ```

2. **Enable required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Deploy using Cloud Build**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

4. **Get service URL**:
   ```bash
   gcloud run services describe soulspect-chromadb --region=us-central1 --format='value(status.url)'
   ```

## 🚀 **Option 2: Manual Deploy (if Option 1 fails)**

1. **Build and push container**:
   ```bash
   # Build the image
   docker build -t gcr.io/soulspect-app/chromadb:latest .
   
   # Configure Docker for GCR
   gcloud auth configure-docker
   
   # Push the image
   docker push gcr.io/soulspect-app/chromadb:latest
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy soulspect-chromadb \
     --image gcr.io/soulspect-app/chromadb:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8000 \
     --memory 2Gi \
     --cpu 1 \
     --max-instances 10 \
     --set-env-vars "CHROMA_SERVER_CORS_ALLOW_ORIGINS=[\"*\"]"
   ```

## 🚀 **Option 3: Use Google Cloud Console (No CLI required)**

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Navigate to Cloud Run → Create Service**
3. **Container Image**: `chromadb/chroma:latest`
4. **Service name**: `soulspect-chromadb`
5. **Region**: `us-central1`
6. **Authentication**: Allow unauthenticated invocations
7. **Container Port**: `8000`
8. **Memory**: `2 GiB`
9. **CPU**: `1`

## 🔧 **After Deployment**

1. **Get your ChromaDB URL** (from any of the deploy options above)

2. **Update your .env.local**:
   ```bash
   # Replace with your actual Cloud Run URL
   CHROMA_URL="https://soulspect-chromadb-xxxxxxxxx-uc.a.run.app"
   CHROMA_API_KEY="soulspect-secure-token-change-me-in-production"
   ```

3. **Test the deployment**:
   ```bash
   curl https://your-chromadb-url/api/v1/heartbeat
   ```
   Expected response: `{"nanosecond heartbeat":...}`

## 💰 **Cost Estimation**
- **Cloud Run**: ~$10-20/month for typical usage
- **Storage**: ~$1-5/month for vector data
- **Total**: ~$15-25/month

## 🔒 **Security Notes**
- The deployment uses a basic token authentication
- For production, generate a secure random token and update `credentials.json`
- Consider restricting access to specific IPs/networks

## 🐛 **Troubleshooting**

**Common issues:**
1. **Build fails**: Check Docker is installed and running
2. **Permission denied**: Run `gcloud auth login`
3. **API not enabled**: Run the `gcloud services enable` commands
4. **Memory issues**: Increase memory allocation in Cloud Run

## 🎯 **Next Steps**
Once ChromaDB is deployed:
1. Add credits to your DeepInfra account
2. Set up Vertex AI permissions  
3. Test the complete pipeline

**Current Status Check**: Visit `/api/diagnostics` in your app