import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Proposal, ProposalVersion, AuditLogEntry, User } from "@/types";
import { ROLE_LABELS } from "@/types";

// Avoid @react-pdf/hyphenate Node.js ESM subpath resolution issue
Font.registerHyphenationCallback((word) => [word]);

const PRIMARY_COLOR = "#1864AB"; // DepEd Blue
const TEXT_COLOR = "#212529";
const MUTED_COLOR = "#6c757d";
const BORDER_COLOR = "#dee2e6";
const LIGHT_BG = "#f8f9fa";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 45,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: TEXT_COLOR,
    lineHeight: 1.4,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: PRIMARY_COLOR,
    paddingBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 6,
  },
  headerTextRepublic: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: MUTED_COLOR,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTextDept: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTextRegion: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: TEXT_COLOR,
    marginBottom: 1.5,
  },
  headerTextDivision: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: TEXT_COLOR,
    marginBottom: 1.5,
  },
  headerTextCID: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: MUTED_COLOR,
    fontStyle: "italic",
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: 3,
  },
  controlNumber: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MUTED_COLOR,
    textAlign: "center",
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 3,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 9.5,
    textAlign: "justify",
    lineHeight: 1.45,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 12,
    fontSize: 9.5,
    color: PRIMARY_COLOR,
    fontFamily: "Helvetica-Bold",
  },
  bulletContent: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  // Table Styles
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginVertical: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    minHeight: 18,
    alignItems: "center",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: PRIMARY_COLOR,
    minHeight: 20,
    alignItems: "center",
  },
  tableHeaderCell: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tableCell: {
    fontSize: 8.5,
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    color: TEXT_COLOR,
  },
  tableCellLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    backgroundColor: LIGHT_BG,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  tableCellBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    backgroundColor: LIGHT_BG,
    borderTopWidth: 1.5,
    borderTopColor: PRIMARY_COLOR,
    minHeight: 20,
    alignItems: "center",
  },
  fundingSourceText: {
    fontSize: 8.5,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    color: MUTED_COLOR,
  },
  // Verification Footer Block
  verificationCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    padding: 8,
    backgroundColor: LIGHT_BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrImage: {
    width: 65,
    height: 65,
    marginRight: 10,
  },
  verificationDetails: {
    fontSize: 8,
    color: TEXT_COLOR,
    lineHeight: 1.35,
  },
  verificationTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_COLOR,
    marginBottom: 2,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 20,
    left: 45,
    right: 45,
    textAlign: "center",
    color: MUTED_COLOR,
    borderTopWidth: 0.5,
    borderTopColor: BORDER_COLOR,
    paddingTop: 6,
  },
});

interface Props {
  proposal: Proposal;
  version: ProposalVersion;
  auditLog: AuditLogEntry[];
  users: User[];
  qrDataUrl: string;
  logoSrc: string;
  generatedAt: string;
}

export function ProposalPdfDocument({
  proposal,
  version,
  auditLog,
  users,
  qrDataUrl,
  logoSrc,
  generatedAt,
}: Props) {
  const budgetTotal = version.budget.reduce(
    (sum, r) => sum + r.qty * r.unitCost,
    0
  );

  const approvalDateEntry = auditLog
    .filter((e) => e.action === "FINALIZED" || e.action === "APPROVED")
    .pop();
  const approvalDateStr = approvalDateEntry?.timestamp
    ? new Date(approvalDateEntry.timestamp).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <Document title={`${proposal.controlNumber || "Proposal"} - Final Approved Document`}>
      <Page size="A4" style={styles.page}>
        {/* Header Block */}
        <View style={styles.headerContainer}>
          {logoSrc && <Image src={logoSrc} style={styles.logo} />}
          <Text style={styles.headerTextRepublic}>Republic of the Philippines</Text>
          <Text style={styles.headerTextDept}>Department of Education</Text>
          <Text style={styles.headerTextRegion}>Region V</Text>
          <Text style={styles.headerTextDivision}>Schools Division Office of Sorsogon</Text>
          <Text style={styles.headerTextCID}>Curriculum Implementation Division</Text>
          <Text style={styles.documentTitle}>{proposal.title}</Text>
          <Text style={styles.controlNumber}>Control No: {proposal.controlNumber || "PENDING"}</Text>
        </View>

        {/* I. Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>I. Project Information</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>Program Area</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{proposal.programArea}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>Origin Type</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{proposal.originType}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>School</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{proposal.school || "N/A"}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>District</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{proposal.district || "N/A"}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>Proposed Date</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{version.proposedDate || "N/A"}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>Venue</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{version.venue || "N/A"}</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCellLabel, { width: "30%" }]}>Target Participants</Text>
              <Text style={[styles.tableCell, { width: "70%" }]}>{version.targetParticipants || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* II. Rationale */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>II. Rationale</Text>
          <Text style={styles.paragraph}>{version.rationale}</Text>
        </View>

        {/* III. Objectives */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>III. Objectives</Text>
          {version.objectives.map((obj, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletContent}>{obj}</Text>
            </View>
          ))}
        </View>

        {/* IV. Expected Outputs */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>IV. Expected Outputs</Text>
          <Text style={styles.paragraph}>{version.expectedOutputs}</Text>
        </View>

        {/* V. Implementation Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>V. Implementation Plan</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: "35%" }]}>Activity</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Responsible</Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Expected Output</Text>
            </View>
            {version.implementationPlan.map((row, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i === version.implementationPlan.length - 1 ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <Text style={[styles.tableCell, { width: "35%" }]}>{row.activity}</Text>
                <Text style={[styles.tableCell, { width: "20%" }]}>{row.date}</Text>
                <Text style={[styles.tableCell, { width: "20%" }]}>{row.responsible}</Text>
                <Text style={[styles.tableCell, { width: "25%" }]}>{row.output}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* VI. Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>VI. Budget</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: "42%" }]}>Particular</Text>
              <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "center" }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Unit Cost</Text>
              <Text style={[styles.tableHeaderCell, { width: "23%", textAlign: "right" }]}>Total</Text>
            </View>
            {version.budget.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "42%" }]}>{row.particular}</Text>
                <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>{row.qty}</Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  ₱{row.unitCost.toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, { width: "23%", textAlign: "right" }]}>
                  ₱{(row.qty * row.unitCost).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={styles.grandTotalRow}>
              <Text style={[styles.tableCellBold, { width: "77%", textAlign: "right", paddingRight: 8 }]}>
                Grand Total:
              </Text>
              <Text style={[styles.tableCellBold, { width: "23%", textAlign: "right", paddingRight: 5 }]}>
                ₱{budgetTotal.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text style={styles.fundingSourceText}>
            Funding Source: {version.fundingSource || "N/A"}
          </Text>
        </View>

        {/* VII. Approval History / Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>VII. Approval History</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: "24%" }]}>Stage / Role</Text>
              <Text style={[styles.tableHeaderCell, { width: "24%" }]}>Approved By</Text>
              <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Action</Text>
              <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Comment</Text>
              <Text style={[styles.tableHeaderCell, { width: "16%" }]}>Date</Text>
            </View>
            {auditLog.map((entry, i) => {
              const approverName = userMap.get(entry.actorId) || entry.actorId;
              const dateStr = new Date(entry.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i === auditLog.length - 1 ? { borderBottomWidth: 0 } : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { width: "24%" }]}>
                    {ROLE_LABELS[entry.actorRole] || entry.actorRole}
                  </Text>
                  <Text style={[styles.tableCell, { width: "24%", fontFamily: "Helvetica-Bold" }]}>
                    {approverName}
                  </Text>
                  <Text style={[styles.tableCell, { width: "18%" }]}>
                    {entry.action.replace(/_/g, " ")}
                  </Text>
                  <Text style={[styles.tableCell, { width: "18%", fontStyle: "italic" }]}>
                    {entry.comment || "—"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "16%" }]}>{dateStr}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Verification Footer Block */}
        <View style={styles.verificationCard}>
          <View style={styles.qrSection}>
            {qrDataUrl && <Image src={qrDataUrl} style={styles.qrImage} />}
            <View>
              <Text style={styles.verificationTitle}>Official Document Verification</Text>
              <Text style={styles.verificationDetails}>
                Control No: {proposal.controlNumber || "N/A"}{"\n"}
                Version: {proposal.currentVersion} • Status: {proposal.status}{"\n"}
                Approval Date: {approvalDateStr}{"\n"}
                Generated: {generatedAt}
              </Text>
            </View>
          </View>
        </View>

        {/* Page numbers fixed at bottom */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} • DepEd SDO Sorsogon CID e-Proposal System`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
