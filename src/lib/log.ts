import { db } from "./db";
import type { Prisma } from "@prisma/client";

export async function logActivity(entry: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  data?: Prisma.InputJsonValue;
}) {
  try {
    await db.activityLog.create({ data: entry });
  } catch (e) {
    console.error("[activity-log]", e);
  }
}
