import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { getTickets, createTicket, TICKET_TYPES } from "../../api/maintenance";
import { getLeases } from "../../api/leases";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { formatDate } from "../../lib/utils";

const PRIORITIES = ["low", "medium", "high", "urgent"];

export function TenantMaintenancePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [ticketType, setTicketType] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  // RLS scopes tickets and lease to the signed-in tenant.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-tickets", page],
    queryFn: () => getTickets({ page: String(page), limit: String(limit) }),
    retry: 1,
  });
  const { data: leaseData } = useQuery({
    queryKey: ["tenant-lease"],
    queryFn: () => getLeases({ limit: "10" }),
    retry: 1,
  });

  const lease = leaseData?.data?.[0];
  const canRequest = !!lease && !!lease.unit_id && !!lease.property_id;
  const tickets = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, total_pages: 0 };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest) return;
    setSubmitting(true);
    try {
      await createTicket({
        tenant_id: lease.tenant_id,
        property_id: lease.property_id,
        unit_id: lease.unit_id,
        description: description.trim(),
        ticket_type: ticketType,
        priority,
      });
      toast.success("Maintenance request submitted");
      setShowForm(false);
      setDescription("");
      setTicketType("general");
      setPriority("medium");
      queryClient.invalidateQueries({ queryKey: ["tenant-tickets"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Maintenance"
        subtitle={`${pagination.total || 0} requests`}
        action={
          canRequest ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#003580] hover:bg-[#00224f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={16} />
              New Request
            </button>
          ) : undefined
        }
      />

      {showForm && canRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">New Maintenance Request</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <label className="block mb-4">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Description</span>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue…"
                className="mt-1 w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#0071C2]"
              />
            </label>
            <label className="block mb-4">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Type</span>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#0071C2] capitalize"
              >
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block mb-6">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#0071C2] capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full bg-[#003580] hover:bg-[#00224f] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 animate-pulse h-48" />
      ) : isError ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-red-500">Failed to load requests</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 bg-[#003580] hover:bg-[#00224f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Wrench size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No maintenance requests</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {t.ticket_number}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 break-words">
                      {t.description}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {t.property_name ? `${t.property_name} · ` : ""}
                      {t.unit_number ? `Unit ${t.unit_number} · ` : ""}
                      Opened {formatDate(t.created_at)}
                      {t.assigned_worker_name ? ` · Assigned: ${t.assigned_worker_name}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge status={t.status} />
                    <Badge status={t.priority} />
                  </div>
                </div>
                {t.resolution_notes && (
                  <p className="text-xs text-[var(--text-muted)] mt-3 border-t border-[var(--border-color)] pt-2">
                    Resolution: {t.resolution_notes}
                  </p>
                )}
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
