# Vehicle workflow

- Admins add company fleet vehicles from Admin → Vehicles. The same panel lists the owner/driver, registration number, review status, availability, submitted date, and any document links. Admins can edit, approve/reject, separately toggle availability, or delete a vehicle; deletion asks for confirmation.
- Approved drivers submit vehicles from Driver Dashboard → My Vehicle. The form accepts the fields supported by `Car`, including image and document URLs. Submission creates a partner vehicle with `verificationStatus: pending` and `available: false`. Drivers can view their status and edit/resubmit pending or rejected submissions; those edits return the vehicle to pending and unavailable.
- Admin approval does not enable availability. An administrator must separately make an approved vehicle available. Rejection always forces it unavailable and its review note is shown to the driver.
- Public list/detail APIs and booking creation only accept vehicles where the source is an admin or driver workflow, `verificationStatus` is `approved`, and `available` is `true`.
- Demo cars, demo driver/rides, and default demo accounts remain in `server/utils/seed.js` for local development only. Seed cars are tagged `dataOrigin: demo`, and public APIs exclude them. Normal startup never seeds them. `SEED_DEMO_DATA=true` only opts in outside production; `npm run seed` also refuses to run in production.
- No automatic data cleanup runs. Records created before the `dataOrigin` field existed are treated as legacy and hidden from public listing/booking. An admin can explicitly verify a legacy company vehicle from the fleet table after checking ownership and documents; then it still needs approval and availability enabled. For legacy partner vehicles, coordinate with the operator and classify only after provenance is checked. Do not remove records based only on make/model/name: genuine vehicles can share those values.

## Operational note

Vehicle and document uploads currently use the existing URL fields; this project has no server-side vehicle document storage endpoint. Provide URLs from the deployment's approved upload/storage mechanism. Registration numbers are normalized and checked for duplicates at submission time, but the collection has no unique index because existing production records have not been assessed for duplicates; concurrent submissions can still race.

## Demo data cleanup

- Admins can use Admin → Vehicles → Demo / Test Data Cleanup. Preview first; only explicit `dataOrigin: demo` records and their safe, demo-only dependants are eligible. Cross-links to unmarked activity are reported and block deletion of affected parent records.
- The CLI preview is `npm run cleanup:demo:preview` from `server/`. Explicit deletion requires `npm run cleanup:demo:delete -- --confirm=DELETE_DEMO_DATA`. Deletion is transactional and writes an admin audit entry when initiated in the admin panel. Do not run the delete command until the preview has been reviewed.
- Records lacking provenance are never automatically removed. Seed-like legacy vehicles, the historical seed driver account, and seed-like rides are surfaced as manual-review matches only. The CLI and admin preview show IDs for review. No production cleanup runs during server startup.
