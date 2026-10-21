import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText } from "lucide-react";
import { getLeases, type Lease } from "../../api/leases";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { formatCurrency, formatDate } from "../../lib/utils";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function TenantLeasePage() {
  // RLS scopes `tenants` to the signed-in tenant, so this returns only their lease.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-lease"],
    queryFn: () => getLeases({ limit: "10" }),
    retry: 1,
  });

  const leases = data?.data ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="My Lease" subtitle="Your current rental agreement" />

      {isLoading ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 animate-pulse h-48" />
      ) : isError ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-red-500">Failed to load lease</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 bg-[#003580] hover:bg-[#00224f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : leases.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No active lease</p>
          <p className="text-sm">Contact your property manager if you believe this is an error.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leases.map((l: Lease) => (
            <div
              key={l.id}
              className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {l.property_name ?? "—"} {l.unit_number ? `· Unit ${l.unit_number}` : ""}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{l.tenant_name}</p>
                </div>
                <Badge status={l.status} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Monthly Rent" value={formatCurrency(l.rent_amount ?? 0)} />
                <Field label="Deposit" value={formatCurrency(l.deposit_amount ?? 0)} />
                <Field label="Start Date" value={formatDate(l.start_date) || "—"} />
                <Field label="End Date" value={formatDate(l.end_date) || "—"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
