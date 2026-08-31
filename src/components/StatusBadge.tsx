"use client";
import { Badge } from "@mantine/core";
import type { ProposalStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

const STATUS_COLORS: Record<ProposalStatus, string> = {
  DRAFT: "gray",
  SUBMITTED: "blue",
  FOR_PRINCIPAL_APPROVAL: "cyan",
  FOR_PSDS_APPROVAL: "cyan",
  FOR_COORDINATOR_EPS_REVIEW: "indigo",
  REVISION_REQUIRED: "orange",
  TECHNICALLY_APPROVED: "teal",
  FOR_CID_CHIEF_APPROVAL: "violet",
  FOR_ASDS_APPROVAL: "violet",
  FOR_SDS_APPROVAL: "grape",
  APPROVED: "green",
  COMPLETED: "green",
  REJECTED: "red",
  WITHDRAWN: "yellow",
  CANCELLED: "red",
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge color={STATUS_COLORS[status]} variant="light" size="sm">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
