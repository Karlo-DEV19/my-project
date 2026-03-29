import { Hono } from "hono";
import { getAllActivityLogs } from "../../controller/activity-logs";
const activityLogsRoute = new Hono();

// ── Collection ─────────────────────────────────────────────────
activityLogsRoute.get("/", getAllActivityLogs);

export default activityLogsRoute;
