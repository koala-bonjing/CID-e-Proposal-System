"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Title, Card, Text, Stack, Table, Divider, Group, Badge, Loader, Center, Box, Image,
} from "@mantine/core";
import { fetchProposal } from "@/lib/api";
import type { ProposalDetail } from "@/lib/api";
import dayjs from "dayjs";

export default function FinalDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposal(id).then((data) => { setProposal(data); setLoading(false); });
  }, [id]);

  if (loading) return <Center h={400}><Loader /></Center>;
  if (!proposal) return <Center h={400}><Text>Not found</Text></Center>;

  const latestVersion = proposal.versions[proposal.versions.length - 1];
  const approvalDate = proposal.auditLog
    .filter((e) => e.action === "FINALIZED" || e.action === "APPROVED")
    .pop()?.timestamp;

  const budgetTotal = latestVersion?.budget.reduce((sum, r) => sum + r.qty * r.unitCost, 0) ?? 0;

  return (
    <Stack gap="md" maw={800} mx="auto" py="xl">
      {/* Header */}
      <Card withBorder p="xl" style={{ borderTop: "4px solid var(--mantine-color-blue-6)" }}>
        <Stack gap="xs" ta="center" align="center">
          <Image
            src="/logo.png"
            alt="DepEd SDO Sorsogon Logo"
            w={64}
            h={64}
            fit="contain"
          />
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: 2 }}>
            Republic of the Philippines • Department of Education
          </Text>
          <Text size="xs" c="dimmed">
            Schools Division Office of Sorsogon
          </Text>
          <Text size="xs" c="dimmed" fw={600}>
            Curriculum Implementation Division
          </Text>
          <Divider my="sm" w="100%" />
          <Title order={3}>{proposal.title}</Title>
          <Text size="sm" c="dimmed">{proposal.controlNumber}</Text>
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
                  <Table.Tr><Table.Td fw={500}>School</Table.Td><Table.Td>{proposal.school}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>District</Table.Td><Table.Td>{proposal.district}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Proposed Date</Table.Td><Table.Td>{latestVersion.proposedDate}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Venue</Table.Td><Table.Td>{latestVersion.venue}</Table.Td></Table.Tr>
                  <Table.Tr><Table.Td fw={500}>Target Participants</Table.Td><Table.Td>{latestVersion.targetParticipants}</Table.Td></Table.Tr>
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
            </div>

            {/* Budget */}
            <div>
              <Text size="sm" fw={700} tt="uppercase" c="blue" mb={4}>VI. Budget</Text>
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
              <Text size="sm" mt={4}><strong>Funding Source:</strong> {latestVersion.fundingSource}</Text>
            </div>
          </Stack>
        </Card>
      )}

      {/* QR Code Placeholder + Footer */}
      <Card withBorder p="xl">
        <Group justify="space-between" align="flex-start">
          {/* QR Placeholder */}
          <Box
            style={{
              width: 100,
              height: 100,
              border: "2px dashed var(--mantine-color-gray-4)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text size="xs" c="dimmed" ta="center">QR Code<br />Placeholder</Text>
          </Box>

          {/* Document footer */}
          <Stack gap={2} ta="right">
            <Text size="xs" c="dimmed">
              <strong>Control Number:</strong> {proposal.controlNumber}
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
