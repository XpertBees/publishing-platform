import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
