"use client";
import { Stepper, Box, Card, Stack, Group, Text, Badge, Progress } from "@mantine/core";
import { IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";
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
      : chain.length;
  }

  for (let i = 0; i < chain.length; i++) {
    if (chain[i].status === currentStatus) {
      activeStep = i;
      break;
    }
  }

  const isRevision = currentStatus === "REVISION_REQUIRED";
  const isRejected = currentStatus === "REJECTED";
  const isCompleted = currentStatus === "COMPLETED";
  const stepColor = isRejected ? "red" : isRevision ? "orange" : isCompleted ? "green" : "blue";

  const currentStepObj = chain[activeStep] || null;
  const currentStepTitle = isCompleted
    ? "Approved & Completed"
    : isRejected
      ? "Proposal Rejected"
      : isRevision
        ? "Returned for Revision"
        : currentStepObj
          ? `${ROLE_LABELS[currentStepObj.role]} Review`
          : "Under Review";

  const progressPercent = isCompleted
    ? 100
    : Math.min(100, Math.round(((activeStep + 1) / (chain.length + 1)) * 100));

  return (
    <>
      {/* Mobile Card Progress (hidden on desktop) */}
      <Card withBorder p="sm" radius="md" hiddenFrom="sm" bg="var(--mantine-color-gray-0)">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Badge color={stepColor} variant="filled" size="sm">
                {isCompleted ? "Completed" : `Stage ${Math.min(activeStep + 1, chain.length)} of ${chain.length}`}
              </Badge>
              <Text size="sm" fw={700}>
                {currentStepTitle}
              </Text>
            </Group>
            <Text size="xs" fw={600} c="dimmed">
              {progressPercent}%
            </Text>
          </Group>

          <Progress value={progressPercent} size="sm" radius="xl" color={stepColor} />

          <Text size="xs" c="dimmed">
            {STATUS_LABELS[currentStatus] || "Proposal In Process"}
          </Text>

          {/* Mini stage pills */}
          <Group gap={4} mt={2}>
            {chain.map((step, idx) => {
              const isPassed = idx < activeStep || isCompleted;
              const isCurrent = idx === activeStep && !isCompleted;
              return (
                <Badge
                  key={step.status}
                  size="xs"
                  variant={isCurrent ? "filled" : isPassed ? "light" : "outline"}
                  color={isPassed ? "green" : isCurrent ? stepColor : "gray"}
                  leftSection={
                    isPassed ? (
                      <IconCheck size={10} />
                    ) : isCurrent && isRevision ? (
                      <IconAlertTriangle size={10} />
                    ) : isCurrent && isRejected ? (
                      <IconX size={10} />
                    ) : undefined
                  }
                  styles={{ root: { textTransform: "none", fontSize: 10, padding: "0 6px" } }}
                >
                  {ROLE_LABELS[step.role]}
                </Badge>
              );
            })}
          </Group>
        </Stack>
      </Card>

      {/* Desktop Stepper (hidden on mobile) */}
      <Box visibleFrom="sm" style={{ overflowX: "auto", paddingBottom: 4 }}>
        <Box style={{ minWidth: 620 }}>
          <Stepper
            active={activeStep}
            size="sm"
            color={stepColor}
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
    </>
  );
}
