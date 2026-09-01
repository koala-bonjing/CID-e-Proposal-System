"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Title, Card, Text, Stack, Table, Divider, Group, Badge, Loader, Center, Box, Image, Button,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconCheck, IconFileCheck, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { fetchProposal, downloadProposalPdf } from "@/lib/api";
import { ROLE_LABELS } from "@/types";
import type { ProposalDetail } from "@/lib/api";
import dayjs from "dayjs";

export default function FinalDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    fetchProposal(id).then((data) => {
      setProposal(data);
      setLoading(false);

      if (typeof window !== "undefined") {
        const verifyUrl = `${window.location.origin}/proposals/${id}/final`;
        QRCode.toDataURL(verifyUrl, {
          width: 120,
          margin: 1,
          color: { dark: "#1864AB", light: "#FFFFFF" },
        }).then(setQrDataUrl).catch(console.error);
      }
    });
  }, [id]);

  const handleDownload = async () => {
    if (!proposal) return;
    setDownloading(true);
    try {
      await downloadProposalPdf(
        proposal.id,
        `${proposal.controlNumber || `proposal-${proposal.id}`}.pdf`
      );
      notifications.show({
        title: "Download Complete",
        message: `Saved ${proposal.controlNumber || "proposal"}.pdf`,
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch (err: any) {
      notifications.show({
        title: "Download Failed",
        message: err.message || "Failed to generate proposal PDF",
        color: "red",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Center h={400}><Loader /></Center>;
  if (!proposal) return <Center h={400}><Text>Not found</Text></Center>;

  const latestVersion = proposal.versions[proposal.versions.length - 1];
  const approvalDate = proposal.auditLog
    .filter((e) => e.action === "FINALIZED" || e.action === "APPROVED")
    .pop()?.timestamp;

  const budgetTotal = latestVersion?.budget.reduce((sum, r) => sum + r.qty * r.unitCost, 0) ?? 0;

  return (
    <Stack gap="md" maw={850} mx="auto" py="lg">
      {/* Top Action Bar */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Button
          variant="subtle"
          color="gray"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Group gap="xs">
          <Badge color="green" size="lg" variant="light" leftSection={<IconFileCheck size={14} />}>
            Official Approved Proposal
          </Badge>
          <Button
            leftSection={<IconDownload size={16} />}
            color="blue"
            loading={downloading}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </Group>
      </Group>

      {/* Header */}
      <Card withBorder p="xl" style={{ borderTop: "4px solid var(--mantine-color-blue-6)" }}>
        <Stack gap="xs" ta="center" align="center">
          <Image
            src="/deped-logo.png"
            alt="DepEd SDO Sorsogon Logo"
            w={64}
            h={64}
            fit="contain"
          />
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: 2 }}>
            Republic of the Philippines • Department of Education
          </Text>
          <Text size="xs" c="dimmed">
            Region V • Schools Division Office of Sorsogon
          </Text>
          <Text size="xs" c="dimmed" fw={600}>
            Curriculum Implementation Division
          </Text>
          <Divider my="sm" w="100%" />
          <Title order={3}>{proposal.title}</Title>
          <Text size="sm" c="dimmed" fw={600}>
            Control No: {proposal.controlNumber || "—"}
          </Text>
        </Stack>
      </Card>

      {latestVersion && (
        <Card withBorder p="xl">
          <Stack gap="lg">
            {/* Project Info */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>I. Project Information</Text>
              <Table withTableBorder>
                <Table.Tbody>
                  <Table.Tr><Table.Td fw={500} w={180}>Program Area</Table.Td><Table.Td>{proposal.programArea}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Origin Type</Table.Td><Table.Td>{proposal.originType}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>School</Table.Td><Table.Td>{proposal.school || "N/A"}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>District</Table.Td><Table.Td>{proposal.district || "N/A"}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Proposed Date</Table.Td><Table.Td>{latestVersion.proposedDate || "N/A"}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Venue</Table.Td><Table.Td>{latestVersion.venue || "N/A"}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Target Participants</Table.Td><Table.Td>{latestVersion.targetParticipants || "N/A"}</Table.Td></Table.Tr>
                </Table.Tbody>
              </Table>
            </div>

            <Divider />

            {/* Rationale */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>II. Rationale</Text>
              <Text size="sm">{latestVersion.rationale}</Text>
            </div>

            {/* Objectives */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>III. Objectives</Text>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {latestVersion.objectives.map((obj, i) => (
                  <li key={i}><Text size="sm">{obj}</Text></li>
                ))}
              </ul>
            </div>

            {/* Expected Outputs */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>IV. Expected Outputs</Text>
              <Text size="sm">{latestVersion.expectedOutputs}</Text>
            </div>

            {/* Implementation Plan */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>V. Implementation Plan</Text>
              <Table.ScrollContainer minWidth={500}>
                <Table withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Activity</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Responsible</Table.Th>
                      <Table.Th>Expected Output</Table.Th>
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

            {/* Budget */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>VI. Budget</Text>
              <Table.ScrollContainer minWidth={500}>
                <Table withTableBorder withColumnBorders>
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
                      <Table.Td colSpan={3}><Text fw={700} ta="right">Grand Total</Text></Table.Td>
                      <Table.Td><Text fw={700}>₱{budgetTotal.toLocaleString()}</Text></Table.Td>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </Table.ScrollContainer>
              <Text size="sm" mt={4}><strong>Funding Source:</strong> {latestVersion.fundingSource}</Text>
            </div>

            {/* Approval History */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>VII. Approval History</Text>
              <Table.ScrollContainer minWidth={500}>
                <Table withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Stage / Role</Table.Th>
                      <Table.Th>Action</Table.Th>
                      <Table.Th>Comment</Table.Th>
                      <Table.Th>Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {proposal.auditLog.map((entry, i) => (
                      <Table.Tr key={i}>
                        <Table.Td fw={500}>{ROLE_LABELS[entry.actorRole] || entry.actorRole}</Table.Td>
                        <Table.Td>{entry.action.replace(/_/g, " ")}</Table.Td>
                        <Table.Td><Text size="xs" c="dimmed" fs="italic">{entry.comment || "—"}</Text></Table.Td>
                        <Table.Td>{dayjs(entry.timestamp).format("MMM D, YYYY")}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </div>
          </Stack>
        </Card>
      )}

      {/* QR Code Verification + Footer */}
      <Card withBorder p="xl">
        <Group justify="space-between" align="center" wrap="wrap">
          {/* Real QR Verification Code */}
          <Group gap="md">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="Document Verification QR Code"
                w={80}
                h={80}
                fit="contain"
              />
            ) : (
              <Box
                style={{
                  width: 80,
                  height: 80,
                  border: "1px dashed var(--mantine-color-gray-4)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader size="xs" />
              </Box>
            )}
            <Box>
              <Text size="xs" fw={700} c="blue">Official Document Verification</Text>
              <Text size="xs" c="dimmed">Scan QR code to verify proposal authenticity</Text>
            </Box>
          </Group>

          {/* Document footer */}
          <Stack gap={2} ta={{ base: "left", sm: "right" }}>
            <Text size="xs" c="dimmed">
              <strong>Control Number:</strong> {proposal.controlNumber || "—"}
            </Text>
            <Text size="xs" c="dimmed">
              <strong>Version:</strong> {proposal.currentVersion}
            </Text>
            <Text size="xs" c="dimmed">
              <strong>Status:</strong> {proposal.status}
            </Text>
            {approvalDate && (
              <Text size="xs" c="dimmed">
                <strong>Approval Date:</strong> {dayjs(approvalDate).format("MMMM D, YYYY")}
              </Text>
            )}
          </Stack>
        </Group>
      </Card>
    </Stack>
  );
}
