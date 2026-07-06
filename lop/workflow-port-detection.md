---
name: Workflow port detection quirk
description: The "Start application" workflow reliably shows FAILED even though the server starts and opens port 5000 correctly.
---

## The Rule
`WorkflowsRestart` times out with "didn't open port 5000" on every restart attempt, even though:
- Server logs confirm "serving on port 5000"
- Self-test GET /api/scans passes
- `timeout 30 bash -c 'NODE_ENV=development npx tsx server/index.ts'` runs cleanly for the full 30 seconds

**Why:** This is a Replit platform-side port-forwarding detection issue, not a code issue.

**How to apply:** When you see WorkflowsRestart fail with port timeout but server logs show successful startup — stop restarting. Verify health with `timeout 30 bash -c 'NODE_ENV=development npx tsx server/index.ts'` and move on. Do not keep restarting the workflow; it reproduces the same outcome every time per the debug-workflow-ports-issues skill.
