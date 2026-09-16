/** One SQLite statement checks both budgets and the investigation lock before inserting.
 * Denied attempts create no row and consume neither user's nor global budget.
 */
export const RESERVE_JOB_SQL = `INSERT INTO inference_jobs (id,owner_id,investigation_id,source_revision,day,status,started_at)
SELECT ?,?,?,?,?, 'running', ?
WHERE (SELECT count(*) FROM inference_jobs WHERE owner_id = ? AND day = ?) < ?
AND (SELECT count(*) FROM inference_jobs WHERE day = ?) < ?
AND NOT EXISTS (SELECT 1 FROM inference_jobs WHERE investigation_id = ? AND status = 'running')
AND EXISTS (SELECT 1 FROM investigations WHERE id = ? AND owner_id = ? AND revision = ?)
RETURNING id`;
