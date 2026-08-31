import { NextRequest, NextResponse } from "next/server";
import { getProposalById, getVersionsForProposal, getAuditLogForProposal } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposal = getProposalById(id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...proposal,
    versions: getVersionsForProposal(id),
    auditLog: getAuditLogForProposal(id),
  });
}
