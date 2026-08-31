import type { Proposal, ProposalVersion, AuditLogEntry, User, RoutingMatrixEntry } from "@/types";

const BASE = "/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Proposals ───────────────────────────────────────────────────────────

export type ProposalDetail = Proposal & {
  versions: ProposalVersion[];
  auditLog: AuditLogEntry[];
};

export function fetchProposals(userId: string): Promise<Proposal[]> {
  return fetchJson(`${BASE}/proposals?userId=${userId}`);
}

export function fetchProposal(id: string): Promise<ProposalDetail> {
  return fetchJson(`${BASE}/proposals/${id}`);
}

export function createProposal(data: Record<string, unknown>): Promise<Proposal> {
  return fetchJson(`${BASE}/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function submitDecision(
  proposalId: string,
  data: { action: string; comment?: string; actorId: string }
): Promise<Proposal> {
  return fetchJson(`${BASE}/proposals/${proposalId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function resubmitProposal(
  proposalId: string,
  data: Record<string, unknown>
): Promise<Proposal> {
  return fetchJson(`${BASE}/proposals/${proposalId}/resubmit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ── Users ───────────────────────────────────────────────────────────────

export function fetchUsers(): Promise<User[]> {
  return fetchJson(`${BASE}/users`);
}

export function createUser(data: Partial<User>): Promise<User> {
  return fetchJson(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ── Routing Matrix ──────────────────────────────────────────────────────

export function fetchRoutingMatrix(): Promise<RoutingMatrixEntry[]> {
  return fetchJson(`${BASE}/routing-matrix`);
}

export function updateRoutingMatrix(entries: RoutingMatrixEntry[]): Promise<RoutingMatrixEntry[]> {
  return fetchJson(`${BASE}/routing-matrix`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries),
  });
}
