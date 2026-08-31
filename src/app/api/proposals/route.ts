import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers,
  getProposalsForUser,
  getUserById,
  addProposal,
  addVersion,
  addAuditEntry,
  generateControlNumber,
  getCoordinatorForProgramArea,
} from "@/lib/store";
import type { Proposal, ProposalVersion, AuditLogEntry, User } from "@/types";
import { APPROVAL_CHAINS } from "@/types";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(getProposalsForUser(user));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title, proponentId, originType, school, district, programArea,
    rationale, objectives, expectedOutputs, implementationPlan, budget,
    fundingSource, targetParticipants, proposedDate, venue, attachments,
  } = body;

  // Completeness check
  const missing: string[] = [];
  if (!title) missing.push("title");
  if (!proponentId) missing.push("proponentId");
  if (!originType) missing.push("originType");
  if (!school) missing.push("school");
  if (!district) missing.push("district");
  if (!programArea) missing.push("programArea");
  if (!rationale) missing.push("rationale");
  if (!objectives?.length) missing.push("objectives");
  if (!expectedOutputs) missing.push("expectedOutputs");
  if (!implementationPlan?.length) missing.push("implementationPlan");
  if (!budget?.length) missing.push("budget");
  if (!fundingSource) missing.push("fundingSource");
  if (!targetParticipants) missing.push("targetParticipants");
  if (!proposedDate) missing.push("proposedDate");
  if (!venue) missing.push("venue");

  if (missing.length > 0) {
    return NextResponse.json({ error: "Missing required fields", missing }, { status: 400 });
  }

  const chain = APPROVAL_CHAINS[originType as keyof typeof APPROVAL_CHAINS];
  if (!chain) return NextResponse.json({ error: "Invalid originType" }, { status: 400 });

  const firstStep = chain[0];
  const controlNumber = generateControlNumber();
  const now = new Date().toISOString();
  const proposalId = `p-${crypto.randomUUID().slice(0, 8)}`;
  const versionId = `pv-${crypto.randomUUID().slice(0, 8)}`;

  // Determine assignee
  let assigneeId: string | null = null;
  if (firstStep.role === "PRINCIPAL") {
    // Find principal for the school
    const principals = getAllUsers().filter(u => u.role === "PRINCIPAL" && u.school === school);
    assigneeId = principals[0]?.id ?? null;
  } else if (firstStep.role === "PSDS") {
    const psds = getAllUsers().filter(u => u.role === "PSDS" && u.district === district);
    assigneeId = psds[0]?.id ?? null;
  } else if (firstStep.role === "COORDINATOR_EPS") {
    assigneeId = getCoordinatorForProgramArea(programArea);
  } else {
    // CID Chief, ASDS, SDS — find the single user with that role
    const users = getAllUsers().filter(u => u.role === firstStep.role);
    assigneeId = users[0]?.id ?? null;
  }

  const proposal: Proposal = {
    id: proposalId,
    controlNumber,
    title,
    proponentId,
    originType,
    school,
    district,
    programArea,
    status: firstStep.status,
    currentVersion: 1,
    currentAssigneeRole: firstStep.role,
    currentAssigneeId: assigneeId,
    createdAt: now,
    updatedAt: now,
  };

  const version: ProposalVersion = {
    id: versionId,
    proposalId,
    version: 1,
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

  const auditEntry: AuditLogEntry = {
    id: `al-${crypto.randomUUID().slice(0, 8)}`,
    proposalId,
    actorId: proponentId,
    actorRole: "PROPONENT",
    action: "SUBMITTED",
    timestamp: now,
  };

  addProposal(proposal);
  addVersion(version);
  addAuditEntry(auditEntry);

  return NextResponse.json(proposal, { status: 201 });
}
