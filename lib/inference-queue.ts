import { CloudTasksClient } from "@google-cloud/tasks";
import { OAuth2Client } from "google-auth-library";
import { ApiError } from "./server";
export async function enqueueInference(jobId: string) {
  const project = process.env.TASK_PROJECT,
    origin = process.env.SERVICE_ORIGIN,
    serviceAccount = process.env.TASK_SERVICE_ACCOUNT;
  if (!project || !origin || !serviceAccount)
    throw new Error("Inference queue is not configured");
  const client = new CloudTasksClient();
  await client.createTask({
    parent: client.queuePath(project, "us-central1", "recallroom-inference"),
    task: {
      name: client.taskPath(
        project,
        "us-central1",
        "recallroom-inference",
        jobId,
      ),
      dispatchDeadline: { seconds: 180 },
      httpRequest: {
        httpMethod: "POST",
        url: origin + "/api/tasks/extract",
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify({ jobId })).toString("base64"),
        oidcToken: { serviceAccountEmail: serviceAccount, audience: origin },
      },
    },
  });
}
export async function verifyTask(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer "))
    throw new ApiError(401, "Unauthorized task.");
  try {
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken: header.slice(7),
      audience: process.env.SERVICE_ORIGIN,
    });
    const payload = ticket.getPayload();
    if (
      !payload?.email_verified ||
      payload.email !== process.env.TASK_SERVICE_ACCOUNT
    )
      throw new Error("Wrong task identity");
  } catch {
    throw new ApiError(401, "Unauthorized task.");
  }
}
