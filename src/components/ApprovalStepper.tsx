"use client";
import { Stepper, Box } from "@mantine/core";
import type { OriginType, ProposalStatus } from "@/types";
import { APPROVAL_CHAINS, STATUS_LABELS, ROLE_LABELS } from "@/types";

interface Props {
  originType: OriginType;
  currentStatus: ProposalStatus;
}

export function ApprovalStepper({ originType, currentStatus }: Props) {
  const chain = APPROVAL_CHAINS[originType];

  // Find where we are in the chain
  let activeStep = chain.length; // past all steps = completed
  if (currentStatus === "REVISION_REQUIRED" || currentStatus === "REJECTED") {
    // Find the step that returned/rejected it — show it as active with error
    activeStep = chain.findIndex((s) => s.role === "PROPONENT") === -1
      ? 0
      : chain.length; // won't match, so show all as completed up to point
  }

  for (let i = 0; i < chain.length; i++) {
    if (chain[i].status === currentStatus) {
      activeStep = i;
      break;
    }
  }

  const isRevision = currentStatus === "REVISION_REQUIRED";
  const isRejected = currentStatus === "REJECTED";

  return (
    <Box style={{ overflowX: "auto", paddingBottom: 4 }}>
      <Box style={{ minWidth: 620 }}>
        <Stepper
          active={activeStep}
          size="sm"
          color={isRejected ? "red" : isRevision ? "orange" : "blue"}
          styles={{ stepLabel: { fontSize: 12 }, stepDescription: { fontSize: 11 } }}
        >
          {chain.map((step, i) => (
            <Stepper.Step
              key={step.status}
              label={ROLE_LABELS[step.role]}
              description={STATUS_LABELS[step.status]}
            />
          ))}
          <Stepper.Completed>
            {isRejected
              ? "Proposal Rejected"
              : isRevision
                ? "Returned for Revision"
                : "Approved & Completed"}
          </Stepper.Completed>
        </Stepper>
      </Box>
    </Box>
  );
}
