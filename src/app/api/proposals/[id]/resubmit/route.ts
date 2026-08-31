import { NextRequest, NextResponse } from "next/server";
import {
  getProposalById, updateProposal, addVersion, addAuditEntry,
  getAuditLogForProposal, getCoordinatorForProgramArea, getAllUsers,
} from "@/lib/store";
import type { ProposalVersion, Role } from "@/types";
import { APPROVAL_CHAINS } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposal = getProposalById(id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (proposal.status !== "REVISION_REQUIRED") {
    return NextResponse.json({ error: "Proposal is not in REVISION_REQUIRED status" }, { status: 400 });
  }

  const body = await req.json();
  const {
    rationale, objectives, expectedOutputs, implementationPlan,
    budget, fundingSource, targetParticipants, proposedDate, venue, attachments,
  } = body;

  const now = new Date().toISOString();
  const newVersion = proposal.currentVersion + 1;

  const version: ProposalVersion = {
    id: `pv-${crypto.randomUUID().slice(0, 8)}`,
    proposalId: id,
    version: newVersion,
    rationale,
    objectives,
    expectedOutputs,
    implementationPlan,
    budget,
    fundingSource,
    targetParticipants,
    proposedDate,
    venue,
    attachments: attachments ?? [],
    submittedAt: now,
  };

  // Find which step returned it — look at the last RETURNED_FOR_REVISION entry
  const auditLog = getAuditLogForProposal(id);
  const returnEntry = [...auditLog].reverse().find((e) => e.action === "RETURNED_FOR_REVISION");
  const returnedByRole = returnEntry?.actorRole;

  // Route back to the step that returned it
  const chain = APPROVAL_CHAINS[proposal.originType];
  const returnStepIdx = chain.findIndex((s) => s.role === returnedByRole);
  const returnStep = returnStepIdx >= 0 ? chain[returnStepIdx] : chain[0];

  // Resolve assignee for that step
  let assigneeId: string | null = null;
  const users = getAllUsers();
  switch (returnStep.role) {
    case "PRINCIPAL":
      assigneeId = users.find((u) => u.role === "PRINCIPAL" && u.school === proposal.school)?.id ?? null;
      break;
    case "PSDS":
      assigneeId = users.find((u) => u.role === "PSDS" && u.district === proposal.district)?.id ?? null;
      break;
    case "COORDINATOR_EPS":
      assigneeId = getCoordinatorForProgramArea(proposal.programArea);
      break;
    default:
      assigneeId = users.find((u) => u.role === returnStep.role)?.id ?? null;
  }

  addVersion(version);
  updateProposal(id, {
    currentVersion: newVersion,
    status: returnStep.status,
    currentAssigneeRole: returnStep.role,
    currentAssigneeId: assigneeId,
  });

  addAuditEntry({
    id: `al-${crypto.randomUUID().slice(0, 8)}`,
    proposalId: id,
    actorId: proposal.proponentId,
    actorRole: "PROPONENT",
    action: "RESUBMITTED",
    timestamp: now,
  });

  return NextResponse.json(getProposalById(id));
}
