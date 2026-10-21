import { Bell } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";

export function TenantNotificationsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Notifications" subtitle="Updates about your lease and payments" />
      <div className="text-center py-16 text-[var(--text-muted)]">
        <Bell size={40} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No notifications</p>
        <p className="text-sm">You're all caught up.</p>
      </div>
    </div>
  );
}
