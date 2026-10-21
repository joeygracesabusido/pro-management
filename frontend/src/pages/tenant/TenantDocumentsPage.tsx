import { FolderOpen } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";

export function TenantDocumentsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Documents" subtitle="Lease agreements and receipts" />
      <div className="text-center py-16 text-[var(--text-muted)]">
        <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No documents yet</p>
        <p className="text-sm">Documents shared by your property manager will appear here.</p>
      </div>
    </div>
  );
}
