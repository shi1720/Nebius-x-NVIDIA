#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
RUNTIME_PROJECT="${RUNTIME_PROJECT:-granted-ai-2026}"
FIREBASE_PROJECT="${FIREBASE_PROJECT:-recallroom-ai-2026}"
REGION="${REGION:-us-central1}"
npm ci
npm run typecheck
npm run lint
npm test
"$GCLOUD_BIN" run deploy recallroom-api --source . --project="$RUNTIME_PROJECT" --region="$REGION" --service-account="recallroom-runtime@$RUNTIME_PROJECT.iam.gserviceaccount.com" --allow-unauthenticated --max-instances=2 --min-instances=0 --memory=512Mi --cpu=1 --timeout=180 --quiet
API_ORIGIN="$("$GCLOUD_BIN" run services describe recallroom-api --project="$RUNTIME_PROJECT" --region="$REGION" --format='value(status.url)')"
"$GCLOUD_BIN" run services update recallroom-api --project="$RUNTIME_PROJECT" --region="$REGION" --update-env-vars="SERVICE_ORIGIN=$API_ORIGIN" --quiet
VITE_API_ORIGIN="$API_ORIGIN" npm run build:web
npx --yes firebase-tools deploy --only hosting,firestore --project="$FIREBASE_PROJECT" --non-interactive
RECALLROOM_API_URL="$API_ORIGIN" node scripts/test-firebase-api.mjs
printf '\nRecallRoom is deployed at https://recallroom.web.app\n'
