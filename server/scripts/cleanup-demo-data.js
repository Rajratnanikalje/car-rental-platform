require("dotenv").config();
const connectDB = require("../config/db");
const { buildDemoCleanupPlan, deleteDemoRecords } = require("../services/demoCleanup");

async function main() {
  const deleting = process.argv.includes("--delete");
  const confirmed = process.argv.includes("--confirm=DELETE_DEMO_DATA");
  if (deleting && !confirmed) {
    throw new Error("Deletion requires both --delete and --confirm=DELETE_DEMO_DATA");
  }
  await connectDB();
  const plan = deleting ? await deleteDemoRecords() : await buildDemoCleanupPlan();
  const idsOnly = Object.fromEntries(Object.entries(plan.groups).map(([key, records]) => [key, records.map(({ id, label, reason }) => ({ id, ...(key === "manualReview" ? { label, reason } : {}) }))]));
  process.stdout.write(`${JSON.stringify({ mode: deleting ? "deleted" : "dry-run", counts: plan.counts, ids: idsOnly, conflicts: plan.conflicts }, null, 2)}\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error(`Demo cleanup ${process.argv.includes("--delete") ? "failed" : "preview failed"}. Check database connectivity and the command options.`);
  process.exit(1);
});
