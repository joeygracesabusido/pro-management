import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Landmark } from "lucide-react";
import { getItemFinancingRequests, ITEM_FINANCING_TYPE_LABELS } from "../../api/itemFinancing";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { formatCurrency, formatDate } from "../../lib/utils";

export function TenantFinancingPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  // RLS scopes item financing requests to the signed-in tenant's own rows.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-financing", page],
    queryFn: () => getItemFinancingRequests({ page: String(page), limit: String(limit) }),
    retry: 1,
  });

  const requests = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, total_pages: 0 };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="IF Financing"
        subtitle={`${pagination.total || 0} financing requests`}
      />

      {isLoading ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 animate-pulse h-48" />
      ) : isError ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-red-500">Failed to load financing requests</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 bg-[#003580] hover:bg-[#00224f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Landmark size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No financing requests</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {r.item_description}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {r.category?.name ? `${r.category.name} · ` : ""}
                    {ITEM_FINANCING_TYPE_LABELS[r.financing_type] ?? r.financing_type}
                    {r.unit ? ` · Unit ${r.unit.unit_number}` : ""}
                    {" · "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge status={r.status} />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {formatCurrency(Number(r.total_cost))}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages || 1}
            total={pagination.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
