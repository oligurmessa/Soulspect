#!/bin/bash

# ChromaDB GCP Deployment Script for SoulSpect
set -e

PROJECT_ID="soulspect-app"
REGION="us-central1"
SERVICE_NAME="soulspect-chromadb"

echo "🚀 Deploying ChromaDB to Google Cloud Run for SoulSpect..."

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying ChromaDB container..."
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ ChromaDB deployed successfully!"
echo "📍 Service URL: $SERVICE_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Update your .env.local with:"
echo "   CHROMA_URL=\"$SERVICE_URL\""
echo "   CHROMA_API_KEY=\"soulspect-secure-token-change-me-in-production\""
echo ""
echo "2. Test the deployment:"
echo "   curl $SERVICE_URL/api/v1/heartbeat"
echo ""
echo "3. For production, generate a secure token and update credentials.json"