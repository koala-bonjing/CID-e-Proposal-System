import type {
  User, Proposal, ProposalVersion, RoutingMatrixEntry, AuditLogEntry,
  Role, ProposalStatus, AuditAction, ProgramArea, APPROVAL_CHAINS,
} from "@/types";
import seedData from "../../data/seed.json";

// ── In-memory store (resets on server restart) ──────────────────────────

interface Store {
  users: User[];
  proposals: Proposal[];
  proposalVersions: ProposalVersion[];
  routingMatrix: RoutingMatrixEntry[];
  auditLog: AuditLogEntry[];
  controlNumberSeq: number;
}

// Lazy-init: first access loads seed data
let _store: Store | null = null;

function getStore(): Store {
  if (!_store) {
    _store = {
      users: seedData.users as User[],
      proposals: seedData.proposals as Proposal[],
      proposalVersions: seedData.proposalVersions as ProposalVersion[],
      routingMatrix: seedData.routingMatrix as RoutingMatrixEntry[],
      auditLog: seedData.auditLog as AuditLogEntry[],
      controlNumberSeq: seedData.controlNumberSeq ?? 0,
    };
  }
  return _store;
}

// ── Read helpers ────────────────────────────────────────────────────────

export function getAllUsers(): User[] {
  return getStore().users;
}

export function getUserById(id: string): User | undefined {
  return getStore().users.find((u) => u.id === id);
}

export function getAllProposals(): Proposal[] {
  return getStore().proposals;
}

export function getProposalById(id: string): Proposal | undefined {
  return getStore().proposals.find((p) => p.id === id);
}

export function getVersionsForProposal(proposalId: string): ProposalVersion[] {
  return getStore()
    .proposalVersions.filter((v) => v.proposalId === proposalId)
    .sort((a, b) => a.version - b.version);
}

export function getAuditLogForProposal(proposalId: string): AuditLogEntry[] {
  return getStore()
    .auditLog.filter((e) => e.proposalId === proposalId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getRoutingMatrix(): RoutingMatrixEntry[] {
  return getStore().routingMatrix;
}

export function getCoordinatorForProgramArea(programArea: ProgramArea): string | null {
  const entry = getStore().routingMatrix.find((r) => r.programArea === programArea);
  return entry?.coordinatorId ?? null;
}

// ── Write helpers ───────────────────────────────────────────────────────

export function generateControlNumber(): string {
  const store = getStore();
  store.controlNumberSeq += 1;
  const seq = String(store.controlNumberSeq).padStart(6, "0");
  return `SDO-SOR-${new Date().getFullYear()}-${seq}`;
}

export function addUser(user: User): void {
  getStore().users.push(user);
}

export function addProposal(proposal: Proposal): void {
  getStore().proposals.push(proposal);
}

export function updateProposal(id: string, updates: Partial<Proposal>): Proposal | null {
  const store = getStore();
  const idx = store.proposals.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.proposals[idx] = { ...store.proposals[idx], ...updates, updatedAt: new Date().toISOString() };
  return store.proposals[idx];
}

export function addVersion(version: ProposalVersion): void {
  getStore().proposalVersions.push(version);
}

export function addAuditEntry(entry: AuditLogEntry): void {
  getStore().auditLog.push(entry);
}

export function setRoutingMatrix(entries: RoutingMatrixEntry[]): void {
  getStore().routingMatrix = entries;
}

/**
 * Filter proposals visible to a given user based on role rules.
 */
export function getProposalsForUser(user: User): Proposal[] {
  const all = getAllProposals();

  switch (user.role) {
    case "ADMIN":
      return all;

    case "PROPONENT":
      return all.filter((p) => p.proponentId === user.id);

    case "PRINCIPAL":
      return all.filter(
        (p) => p.status === "FOR_PRINCIPAL_APPROVAL" && p.school === user.school
      );

    case "PSDS":
      return all.filter(
        (p) => p.status === "FOR_PSDS_APPROVAL" && p.district === user.district
      );

    case "COORDINATOR_EPS":
      return all.filter(
        (p) =>
          p.status === "FOR_COORDINATOR_EPS_REVIEW" &&
          p.programArea === user.programArea
      );

    case "CID_CHIEF":
      return all.filter((p) => p.status === "FOR_CID_CHIEF_APPROVAL");

    case "ASDS":
      return all.filter((p) => p.status === "FOR_ASDS_APPROVAL");

    case "SDS":
      return all.filter((p) => p.status === "FOR_SDS_APPROVAL");

    default:
      return [];
  }
}

/**
 * For management dashboard: return all proposals (CID Chief, ASDS, SDS, Admin).
 */
export function getAllProposalsForManagement(): Proposal[] {
  return getAllProposals();
}
