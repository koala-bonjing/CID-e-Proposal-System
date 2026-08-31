import { NextRequest, NextResponse } from "next/server";
import {
  getProposalById, updateProposal, addAuditEntry,
  getUserById, getAllUsers, getCoordinatorForProgramArea,
} from "@/lib/store";
import type { AuditLogEntry, AuditAction, Role } from "@/types";
import { APPROVAL_CHAINS } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposal = getProposalById(id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, comment, actorId } = await req.json() as {
    action: "APPROVE" | "RETURN" | "REJECT";
    comment?: string;
    actorId: string;
  };

  const actor = getUserById(actorId);
  if (!actor) return NextResponse.json({ error: "Actor not found" }, { status: 404 });

  // Validate actor can act on this proposal
  if (actor.role !== proposal.currentAssigneeRole && actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized for this action" }, { status: 403 });
  }

  const chain = APPROVAL_CHAINS[proposal.originType];
  const currentStepIdx = chain.findIndex((s) => s.status === proposal.status);
  const now = new Date().toISOString();

  let auditAction: AuditAction;
  let newStatus = proposal.status;
  let newAssigneeRole: Role | null = null;
  let newAssigneeId: string | null = null;

  if (action === "APPROVE") {
    auditAction = "APPROVED";
    const nextStepIdx = currentStepIdx + 1;

    if (nextStepIdx >= chain.length) {
      // Final approval (SDS) → APPROVED → COMPLETED
      newStatus = "COMPLETED";
      newAssigneeRole = null;
      newAssigneeId = null;
    } else {
      const nextStep = chain[nextStepIdx];
      newStatus = nextStep.status;
      newAssigneeRole = nextStep.role;

      // Resolve the specific assignee
      newAssigneeId = resolveAssignee(nextStep.role, proposal);
    }
  } else if (action === "RETURN") {
    auditAction = "RETURNED_FOR_REVISION";
    newStatus = "REVISION_REQUIRED";
    newAssigneeRole = "PROPONENT";
    newAssigneeId = proposal.proponentId;
  } else if (action === "REJECT") {
    auditAction = "REJECTED";
    newStatus = "REJECTED";
    newAssigneeRole = null;
    newAssigneeId = null;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  updateProposal(id, {
    status: newStatus,
    currentAssigneeRole: newAssigneeRole,
    currentAssigneeId: newAssigneeId,
  });

  addAuditEntry({
    id: `al-${crypto.randomUUID().slice(0, 8)}`,
    proposalId: id,
    actorId,
    actorRole: actor.role,
    action: auditAction,
    comment,
    timestamp: now,
  });

  // If final approval, also add FINALIZED entry
  if (action === "APPROVE" && newStatus === "COMPLETED") {
    addAuditEntry({
      id: `al-${crypto.randomUUID().slice(0, 8)}`,
      proposalId: id,
      actorId,
      actorRole: actor.role,
      action: "FINALIZED",
      comment: "Proposal completed and finalized.",
      timestamp: now,
    });
  }

  return NextResponse.json(getProposalById(id));
}

function resolveAssignee(role: Role, proposal: { school: string; district: string; programArea: string }): string | null {
  const users = getAllUsers();
  switch (role) {
    case "PRINCIPAL":
      return users.find((u) => u.role === "PRINCIPAL" && u.school === proposal.school)?.id ?? null;
    case "PSDS":
      return users.find((u) => u.role === "PSDS" && u.district === proposal.district)?.id ?? null;
    case "COORDINATOR_EPS":
      return getCoordinatorForProgramArea(proposal.programArea as any);
    default:
      return users.find((u) => u.role === role)?.id ?? null;
  }
}
