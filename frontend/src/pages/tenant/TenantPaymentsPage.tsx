import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CreditCard } from "lucide-react";
import { getPayments } from "../../api/billing";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { formatCurrency, formatDate } from "../../lib/utils";

export function TenantPaymentsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  // RLS scopes `payments` to the signed-in tenant's rows only.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-payments", page],
    queryFn: () => getPayments({ page: String(page), limit: String(limit) }),
    retry: 1,
  });

  const payments = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, total_pages: 0 };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Payments"
        subtitle={`${pagination.total || 0} recorded payments`}
      />

      {isLoading ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 animate-pulse h-48" />
      ) : isError ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-red-500">Failed to load payments</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 bg-[#003580] hover:bg-[#00224f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <CreditCard size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No payments yet</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border-color)] last:border-0">
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-3 capitalize text-[var(--text-secondary)]">
                      {p.payment_method ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {String((p as { note?: unknown }).note ?? "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
