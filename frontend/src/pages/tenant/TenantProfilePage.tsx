import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Mail, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "../../lib/auth";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";

export function TenantProfilePage() {
  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-profile"],
    queryFn: getCurrentUser,
    retry: 1,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Profile" subtitle="Your account details" />

      {isLoading ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 animate-pulse h-40" />
      ) : isError ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-red-500">Failed to load profile</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 bg-[#003580] hover:bg-[#00224f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#003580] flex items-center justify-center text-white text-lg font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{user?.name}</p>
              <Badge status="tenant" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Mail size={16} className="text-[var(--text-muted)]" />
              {user?.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <ShieldCheck size={16} className="text-[var(--text-muted)]" />
              <span className="capitalize">{user?.role}</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-6 border-t border-[var(--border-color)] pt-4">
            To update your name or email, contact your property manager.
          </p>
        </div>
      )}
    </div>
  );
}
