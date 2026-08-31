export type Role =
  | "PROPONENT" | "PRINCIPAL" | "PSDS" | "COORDINATOR_EPS"
  | "CID_CHIEF" | "ASDS" | "SDS" | "ADMIN";

export type ProgramArea =
  | "Reading" | "Mathematics" | "Science" | "MAPEH"
  | "Sports" | "Journalism" | "DRRM" | "Inclusive Education" | "Learning Resources";

export type ProposalStatus =
  | "DRAFT" | "SUBMITTED"
  | "FOR_PRINCIPAL_APPROVAL" | "FOR_PSDS_APPROVAL"
  | "FOR_COORDINATOR_EPS_REVIEW" | "REVISION_REQUIRED" | "TECHNICALLY_APPROVED"
  | "FOR_CID_CHIEF_APPROVAL" | "FOR_ASDS_APPROVAL" | "FOR_SDS_APPROVAL"
  | "APPROVED" | "COMPLETED" | "REJECTED" | "WITHDRAWN" | "CANCELLED";

export type OriginType = "TEACHER" | "SCHOOL_HEAD" | "DISTRICT";

export type FundingSource = "School MOOE" | "Division MOOE" | "LGU" | "Partner" | "Other";

export interface User {
  id: string;
  name: string;
  role: Role;
  school?: string;
  district?: string;
  programArea?: ProgramArea;
}

export interface Proposal {
  id: string;
  controlNumber: string;
  title: string;
  proponentId: string;
  originType: OriginType;
  school: string;
  district: string;
  programArea: ProgramArea;
  status: ProposalStatus;
  currentVersion: number;
  currentAssigneeRole: Role | null;
  currentAssigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: number;
  rationale: string;
  objectives: string[];
  expectedOutputs: string;
  implementationPlan: { activity: string; date: string; responsible: string; output: string }[];
  budget: { particular: string; qty: number; unitCost: number }[];
  fundingSource: FundingSource;
  targetParticipants: string;
  proposedDate: string;
  venue: string;
  attachments: string[];
  submittedAt: string;
}

export interface RoutingMatrixEntry {
  programArea: ProgramArea;
  coordinatorId: string;
}

export type AuditAction =
  | "SUBMITTED" | "APPROVED" | "RETURNED_FOR_REVISION" | "REJECTED" | "RESUBMITTED" | "ROUTED" | "FINALIZED";

export interface AuditLogEntry {
  id: string;
  proposalId: string;
  actorId: string;
  actorRole: Role;
  action: AuditAction;
  comment?: string;
  timestamp: string;
}

// Approval chain steps per origin type
// Each step: [statusWhenAtThisStep, roleResponsible]
export type ApprovalStep = { status: ProposalStatus; role: Role };

export const APPROVAL_CHAINS: Record<OriginType, ApprovalStep[]> = {
  TEACHER: [
    { status: "FOR_PRINCIPAL_APPROVAL", role: "PRINCIPAL" },
    { status: "FOR_PSDS_APPROVAL", role: "PSDS" },
    { status: "FOR_COORDINATOR_EPS_REVIEW", role: "COORDINATOR_EPS" },
    { status: "FOR_CID_CHIEF_APPROVAL", role: "CID_CHIEF" },
    { status: "FOR_ASDS_APPROVAL", role: "ASDS" },
    { status: "FOR_SDS_APPROVAL", role: "SDS" },
  ],
  SCHOOL_HEAD: [
    { status: "FOR_PSDS_APPROVAL", role: "PSDS" },
    { status: "FOR_COORDINATOR_EPS_REVIEW", role: "COORDINATOR_EPS" },
    { status: "FOR_CID_CHIEF_APPROVAL", role: "CID_CHIEF" },
    { status: "FOR_ASDS_APPROVAL", role: "ASDS" },
    { status: "FOR_SDS_APPROVAL", role: "SDS" },
  ],
  DISTRICT: [
    { status: "FOR_PSDS_APPROVAL", role: "PSDS" },
    { status: "FOR_COORDINATOR_EPS_REVIEW", role: "COORDINATOR_EPS" },
    { status: "FOR_CID_CHIEF_APPROVAL", role: "CID_CHIEF" },
    { status: "FOR_ASDS_APPROVAL", role: "ASDS" },
    { status: "FOR_SDS_APPROVAL", role: "SDS" },
  ],
};

// Status labels for display
export const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  FOR_PRINCIPAL_APPROVAL: "For Principal Approval",
  FOR_PSDS_APPROVAL: "For PSDS Approval",
  FOR_COORDINATOR_EPS_REVIEW: "For Coordinator/EPS Review",
  REVISION_REQUIRED: "Revision Required",
  TECHNICALLY_APPROVED: "Technically Approved",
  FOR_CID_CHIEF_APPROVAL: "For CID Chief Approval",
  FOR_ASDS_APPROVAL: "For ASDS Approval",
  FOR_SDS_APPROVAL: "For SDS Approval",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  CANCELLED: "Cancelled",
};

export const ROLE_LABELS: Record<Role, string> = {
  PROPONENT: "Proponent",
  PRINCIPAL: "Principal",
  PSDS: "PSDS",
  COORDINATOR_EPS: "Coordinator/EPS",
  CID_CHIEF: "CID Chief",
  ASDS: "ASDS",
  SDS: "SDS",
  ADMIN: "Admin",
};

export const PROGRAM_AREAS: ProgramArea[] = [
  "Reading", "Mathematics", "Science", "MAPEH",
  "Sports", "Journalism", "DRRM", "Inclusive Education", "Learning Resources",
];
