"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Title, Text, Card, Stack, Group, Button, Textarea, Loader, Center,
  Grid, Accordion, Table, Badge, Divider, Alert, SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconArrowBack, IconX } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchProposal, submitDecision } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ApprovalStepper } from "@/components/ApprovalStepper";
import { AuditTimeline } from "@/components/AuditTimeline";
import type { ProposalDetail } from "@/lib/api";
import { ROLE_LABELS } from "@/types";
import dayjs from "dayjs";

export default function ReviewerProposalPage() {
  const router = useRouter();
  const { proposalId } = useParams<{ proposalId: string }>();
  const user = useAuthStore((s) => s.user);
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchProposal(proposalId).then((data) => { setProposal(data); setLoading(false); });
  }, [proposalId, user, router]);

  const handleDecision = async (action: "APPROVE" | "RETURN" | "REJECT") => {
    if (!user || !proposal) return;
    setActing(true);
    try {
      await submitDecision(proposal.id, { action, comment, actorId: user.id });
      notifications.show({
        title: action === "APPROVE" ? "Approved" : action === "RETURN" ? "Returned" : "Rejected",
        message: `Proposal ${action.toLowerCase()}d successfully`,
        color: action === "APPROVE" ? "green" : action === "RETURN" ? "orange" : "red",
      });
      router.push("/reviewer/queue");
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setActing(false);
    }
  };

  if (loading) return <Center h={400}><Loader /></Center>;
  if (!proposal) return <Center h={400}><Text>Proposal not found</Text></Center>;

  const latestVersion = proposal.versions[proposal.versions.length - 1];
  const isCurrentReviewer = user?.role === proposal.currentAssigneeRole;
  const isProponent = user?.role === "PROPONENT" && user?.id === proposal.proponentId;
  const canAct = isCurrentReviewer && !["COMPLETED", "REJECTED", "WITHDRAWN", "CANCELLED"].includes(proposal.status);

  // Build user name map from audit log actors
  const userNameMap: Record<string, string> = {};
  proposal.auditLog.forEach((e) => { userNameMap[e.actorId] = e.actorId; });

  const budgetTotal = latestVersion?.budget.reduce((sum, r) => sum + r.qty * r.unitCost, 0) ?? 0;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>{proposal.title}</Title>
          <Group gap="sm" mt={4}>
            <Text size="sm" c="dimmed">{proposal.controlNumber}</Text>
            <StatusBadge status={proposal.status} />
            <Badge variant="light" size="sm">{proposal.programArea}</Badge>
          </Group>
        </div>
        <Button variant="default" onClick={() => router.back()}>← Back</Button>
      </Group>

      {/* Approval chain stepper */}
      <Card withBorder p="md">
        <Text size="sm" fw={600} mb="sm">Approval Progress</Text>
        <ApprovalStepper originType={proposal.originType} currentStatus={proposal.status} />
      </Card>

      <Grid>
        {/* Proposal content */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {latestVersion && (
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Version {latestVersion.version}</Text>
                    <Text size="xs" c="dimmed">
                      Submitted {dayjs(latestVersion.submittedAt).format("MMM D, YYYY h:mm A")}
                    </Text>
                  </Group>

                  <div>
                    <Text size="sm" fw={500} c="dimmed">Rationale</Text>
                    <Text size="sm">{latestVersion.rationale}</Text>
                  </div>

                  <div>
                    <Text size="sm" fw={500} c="dimmed">Objectives</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {latestVersion.objectives.map((obj, i) => (
                        <li key={i}><Text size="sm">{obj}</Text></li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Text size="sm" fw={500} c="dimmed">Expected Outputs</Text>
                    <Text size="sm">{latestVersion.expectedOutputs}</Text>
                  </div>

                  <div>
                    <Text size="sm" fw={500} c="dimmed">Implementation Plan</Text>
                    <Table.ScrollContainer minWidth={500}>
                      <Table withTableBorder mt={4}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Activity</Table.Th>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Responsible</Table.Th>
                            <Table.Th>Output</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {latestVersion.implementationPlan.map((row, i) => (
                            <Table.Tr key={i}>
                              <Table.Td>{row.activity}</Table.Td>
                              <Table.Td>{row.date}</Table.Td>
                              <Table.Td>{row.responsible}</Table.Td>
                              <Table.Td>{row.output}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </div>

                  <div>
                    <Text size="sm" fw={500} c="dimmed">Budget</Text>
                    <Table.ScrollContainer minWidth={500}>
                      <Table withTableBorder mt={4}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Particular</Table.Th>
                            <Table.Th>Qty</Table.Th>
                            <Table.Th>Unit Cost</Table.Th>
                            <Table.Th>Total</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {latestVersion.budget.map((row, i) => (
                            <Table.Tr key={i}>
                              <Table.Td>{row.particular}</Table.Td>
                              <Table.Td>{row.qty}</Table.Td>
                              <Table.Td>₱{row.unitCost.toLocaleString()}</Table.Td>
                              <Table.Td>₱{(row.qty * row.unitCost).toLocaleString()}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                        <Table.Tfoot>
                          <Table.Tr>
                            <Table.Td colSpan={3}><Text fw={600} ta="right">Grand Total</Text></Table.Td>
                            <Table.Td><Text fw={600}>₱{budgetTotal.toLocaleString()}</Text></Table.Td>
                          </Table.Tr>
                        </Table.Tfoot>
                      </Table>
                    </Table.ScrollContainer>
                  </div>

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Funding Source</Text>
                      <Text size="sm">{latestVersion.fundingSource}</Text>
                    </div>
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Target Participants</Text>
                      <Text size="sm">{latestVersion.targetParticipants}</Text>
                    </div>
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Venue</Text>
                      <Text size="sm">{latestVersion.venue}</Text>
                    </div>
                  </SimpleGrid>

                  {latestVersion.attachments.length > 0 && (
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Attachments</Text>
                      {latestVersion.attachments.map((att, i) => (
                        <Badge key={i} variant="outline" size="sm" mr={4}>{att}</Badge>
                      ))}
                    </div>
                  )}
                </Stack>
              </Card>
            )}

            {/* Version history accordion */}
            {proposal.versions.length > 1 && (
              <Card withBorder p="md">
                <Text fw={600} mb="sm">Version History</Text>
                <Accordion variant="separated">
                  {proposal.versions.slice(0, -1).reverse().map((v) => (
                    <Accordion.Item key={v.id} value={v.id}>
                      <Accordion.Control>
                        Version {v.version} — {dayjs(v.submittedAt).format("MMM D, YYYY")}
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text size="sm"><strong>Rationale:</strong> {v.rationale}</Text>
                        <Text size="sm" mt={4}><strong>Objectives:</strong> {v.objectives.join("; ")}</Text>
                        <Text size="sm" mt={4}><strong>Expected Outputs:</strong> {v.expectedOutputs}</Text>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Sidebar: actions + audit trail */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Decision panel */}
            {canAct && (
              <Card withBorder p="md" style={{ border: "2px solid var(--mantine-color-blue-3)" }}>
                <Text fw={600} mb="sm">Decision</Text>
                <Textarea
                  placeholder="Add a comment (optional for approve, recommended for return/reject)..."
                  minRows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  mb="md"
                />
                <Stack gap="xs">
                  <Button
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    loading={acting}
                    onClick={() => handleDecision("APPROVE")}
                    fullWidth
                  >
                    Approve
                  </Button>
                  <Button
                    color="orange"
                    variant="light"
                    leftSection={<IconArrowBack size={16} />}
                    loading={acting}
                    onClick={() => handleDecision("RETURN")}
                    fullWidth
                  >
                    Return for Revision
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    leftSection={<IconX size={16} />}
                    loading={acting}
                    onClick={() => handleDecision("REJECT")}
                    fullWidth
                  >
                    Reject
                  </Button>
                </Stack>
              </Card>
            )}

            {/* For proponent viewing REVISION_REQUIRED */}
            {isProponent && proposal.status === "REVISION_REQUIRED" && (
              <Alert color="orange" title="Revision Required">
                <Text size="sm">This proposal has been returned for revision. Please review the comments and resubmit.</Text>
                <Button
                  mt="sm"
                  size="sm"
                  color="orange"
                  onClick={() => router.push(`/proponent/new?resubmit=${proposal.id}`)}
                >
                  Resubmit
                </Button>
              </Alert>
            )}

            {/* Audit trail */}
            <Card withBorder p="md">
              <Text fw={600} mb="sm">Audit Trail</Text>
              <AuditTimeline entries={proposal.auditLog} users={userNameMap} />
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
