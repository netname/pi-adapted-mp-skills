#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npm test
printf '%s\n' 'Offline smoke passed. Live Paseo acceptance is separate: docs/WORKFLOW.md.'
