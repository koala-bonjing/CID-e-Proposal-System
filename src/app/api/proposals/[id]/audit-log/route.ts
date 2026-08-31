import { NextRequest, NextResponse } from "next/server";
import { getAuditLogForProposal } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(getAuditLogForProposal(id));
}
