#!/usr/bin/env bash
# Task 4: scripted release and rollback demonstration (v1 -> v2 -> rollback to v1).
#
# What it proves
#   v1  = the images that were deployed before the CSV report feature (no /api/transactions/export, returns 404)
#   v2  = images rebuilt from the current source (export returns 200)
#   The rollback returns the running containers to the retained v1 images WITHOUT rebuilding them.
#   No schema migration is part of this release, so v1 is compatible with the current database.
#
# Run from the repository root with the stack already running:
#   bash assessment/task-04-deployment/scripts/rollback-demo.sh
#   bash assessment/task-04-deployment/scripts/rollback-demo.sh | tee assessment/task-04-deployment/evidence/rollback-demo-output.txt
#
# Prerequisite (one-off, BEFORE rebuilding the stack for the first time after the report feature was added):
#   docker tag ledgerly-api:local ledgerly-api:v1 && docker tag ledgerly-web:local ledgerly-web:v1
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_EMAIL="${ADMIN_EMAIL:-asha@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"
COMPOSE=(docker compose -f compose.yaml -f compose.release.yaml)

say() { printf '\n[%s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }

wait_ready() {
  for _ in $(seq 1 40); do
    if curl -fsS "$BASE_URL/api/health/ready" >/dev/null 2>&1; then return 0; fi
    sleep 3
  done
  echo "Service did not become ready in time" >&2
  return 1
}

admin_token() {
  curl -fsS -X POST "$BASE_URL/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).token))'
}

# Prints which version is live by probing the report endpoint that only v2 has.
probe_release() {
  local token code
  token="$(admin_token)"
  code="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" "$BASE_URL/api/transactions/export?status=all")"
  echo "GET /api/transactions/export -> HTTP $code  (200 = v2 behaviour, 404 = v1 behaviour)"
}

show_running() {
  docker compose ps --format 'table {{.Service}}\t{{.Image}}\t{{.Status}}'
  docker inspect --format '{{.Name}} image={{.Image}}' "$(docker compose ps -q api)" "$(docker compose ps -q web)"
}

say "STEP 0: preflight, retained images"
docker image inspect ledgerly-api:v1 ledgerly-web:v1 --format '{{.RepoTags}}  id={{.Id}}' ||
  { echo "v1 images are missing. Tag them first (see the prerequisite at the top of this script)." >&2; exit 1; }

say "STEP 1: current production state (expected: v1 behaviour)"
RELEASE_TAG=v1 "${COMPOSE[@]}" up -d --no-build --no-deps api web
wait_ready
show_running
probe_release

say "STEP 2: build v2 from the current source and tag it"
docker compose build api web
docker tag ledgerly-api:local ledgerly-api:v2
docker tag ledgerly-web:local ledgerly-web:v2
docker images --format '{{.Repository}}:{{.Tag}}  {{.ID}}  {{.CreatedSince}}' | grep -E '^ledgerly-(api|web):(v1|v2)'

say "STEP 3: deploy v2 (no rebuild, pinned tag)"
RELEASE_TAG=v2 "${COMPOSE[@]}" up -d --no-build --no-deps api web
wait_ready
show_running
probe_release
curl -fsS "$BASE_URL/api/health/ready"; echo

say "STEP 4: ROLLBACK to v1 (decision point: the v2 release is rejected)"
RELEASE_TAG=v1 "${COMPOSE[@]}" up -d --no-build --no-deps api web
wait_ready

say "STEP 5: verify the rollback"
show_running
probe_release
curl -fsS "$BASE_URL/api/health"; echo
curl -fsS "$BASE_URL/api/health/ready"; echo
echo "Sign-in still works after rollback: token length $(admin_token | wc -c)"

if [ "${ROLL_FORWARD:-0}" = "1" ]; then
  say "STEP 6: roll forward to v2 again (ROLL_FORWARD=1)"
  RELEASE_TAG=v2 "${COMPOSE[@]}" up -d --no-build --no-deps api web
  wait_ready
  show_running
  probe_release
  say "DONE: stack is running v2 (includes the CSV report feature)."
else
  say "DONE: stack is running v1 again. To roll forward: RELEASE_TAG=v2 docker compose -f compose.yaml -f compose.release.yaml up -d --no-build --no-deps api web"
fi
