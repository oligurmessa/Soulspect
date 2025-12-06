FROM chromadb/chroma:0.4.24

# Cloud Run network/runtime config
ENV HOST=0.0.0.0
ENV PORT=8000

# For now, permissive CORS (you can tighten this later)
ENV CHROMA_SERVER_CORS_ALLOW_ORIGINS=["*"]

# Turn off telemetry (optional, privacy)
ENV ANONYMIZED_TELEMETRY=FALSE

# === Static token auth ===
ENV CHROMA_SERVER_AUTHN_CREDENTIALS="soulspect-secure-token-change-me-in-production"
ENV CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.token_authn.TokenAuthenticationServerProvider"
ENV CHROMA_AUTH_TOKEN_TRANSPORT_HEADER="Authorization"

EXPOSE 8000
# Do NOT override CMD/ENTRYPOINT – base image already starts the server