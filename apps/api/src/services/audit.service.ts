import { AuditLog } from "../models/AuditLog";

/**
 * AuditService — best-effort admin activity log. Failures are swallowed:
 * auditing must never break the action being audited.
 */
export async function logAudit(
  userId: string | null | undefined,
  action: string,
  entity: string,
  entityId?: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId: entityId ?? null,
      meta: meta ?? null,
      userId: userId ?? null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write audit log", err);
  }
}
