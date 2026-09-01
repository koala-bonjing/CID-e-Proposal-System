import { NextRequest, NextResponse } from "next/server";
import React from "react";
import path from "path";
import fs from "fs";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  getProposalById,
  getVersionsForProposal,
  getAuditLogForProposal,
  getAllUsers,
} from "@/lib/store";
import { ProposalPdfDocument } from "@/lib/pdf/ProposalPdfDocument";
import { generateQrDataUrl } from "@/lib/pdf/generateQrDataUrl";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = getProposalById(id);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Only allow finalized / approved proposals
    if (proposal.status !== "APPROVED" && proposal.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PDF export is only available for approved or completed proposals." },
        { status: 400 }
      );
    }

    const versions = getVersionsForProposal(id);
    const latestVersion = versions[versions.length - 1];

    if (!latestVersion) {
      return NextResponse.json(
        { error: "No version data found for this proposal" },
        { status: 404 }
      );
    }

    const auditLog = getAuditLogForProposal(id);
    const users = getAllUsers();

    // Construct verification URL for the QR code
    const origin = req.nextUrl.origin || "https://deped-sorsogon-dpmas.gov.ph";
    const verificationUrl = `${origin}/proposals/${id}/final`;
    const qrDataUrl = await generateQrDataUrl(verificationUrl);

    // Resolve local logo path
    const logoPath = path.join(process.cwd(), "public", "deped-logo.png");
    let logoSrc = logoPath;
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }

    const generatedAt = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Render the React-PDF document to a Node buffer
    const element = React.createElement(ProposalPdfDocument, {
      proposal,
      version: latestVersion,
      auditLog,
      users,
      qrDataUrl,
      logoSrc,
      generatedAt,
    });

    const pdfBuffer = await renderToBuffer(element as any);

    const filename = `${proposal.controlNumber || `proposal-${id}`}.pdf`;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate proposal PDF" },
      { status: 500 }
    );
  }
}
