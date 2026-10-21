import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { getCurrentUser } from "../../lib/auth";

vi.mock("../../lib/auth", () => ({ getCurrentUser: vi.fn(), clearSession: vi.fn() }));
vi.mock("../../api/auth", () => ({ logout: vi.fn() }));

function renderSidebar(role: string) {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    email: "u@test.local",
    name: "Test User",
    role,
  });
  return render(
    <MemoryRouter>
      <Sidebar open onClose={() => {}} />
    </MemoryRouter>,
  );
}

describe("Sidebar tenant nav", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("shows staff navigation for staff roles", async () => {
    renderSidebar("admin");
    expect((await screen.findAllByText("Properties")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Billing").length).toBeGreaterThan(0);
    expect(screen.queryByText("Documents")).toBeNull();
  });

  it("shows only tenant portal items for tenants", async () => {
    renderSidebar("tenant");
    for (const label of ["Lease", "Payments", "IF Financing", "Documents", "Notifications", "Profile"]) {
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Properties")).toBeNull();
    expect(screen.queryByText("Dashboard")).toBeNull();
  });
});
