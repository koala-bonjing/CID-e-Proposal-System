"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Card, SimpleGrid, Text, Stack, Group, Loader, Center, Badge, Table,
  Box, ActionIcon, Tooltip, TextInput, Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEye, IconFileText, IconDownload, IconCheck, IconSearch, IconFilter,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { StatusBadge } from "@/components/StatusBadge";
import { downloadProposalPdf } from "@/lib/api";
import type { Proposal, ProposalStatus } from "@/types";
import { PROGRAM_AREAS } from "@/types";
import dayjs from "dayjs";

// Fetch ALL proposals for management view
async function fetchAllProposals(): Promise<Proposal[]> {
  const res = await fetch("/api/proposals?userId=u-admin-1");
  return res.json();
}

const STAGE_STATUSES: ProposalStatus[] = [
  "FOR_PRINCIPAL_APPROVAL", "FOR_PSDS_APPROVAL", "FOR_COORDINATOR_EPS_REVIEW",
  "FOR_CID_CHIEF_APPROVAL", "FOR_ASDS_APPROVAL", "FOR_SDS_APPROVAL",
];

export default function ManagementDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    const allowed = ["CID_CHIEF", "ASDS", "SDS", "ADMIN"];
    if (!allowed.includes(user.role)) { router.push("/login"); return; }
    fetchAllProposals().then((data) => { setProposals(data); setLoading(false); });
  }, [user, router]);

  const handleQuickDownload = async (proposal: Proposal) => {
    setDownloadingId(proposal.id);
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
        message: err.message || "Failed to download PDF",
        color: "red",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <Center h={400}><Loader /></Center>;

  const total = proposals.length;
  const approved = proposals.filter((p) => p.status === "APPROVED" || p.status === "COMPLETED").length;
  const rejected = proposals.filter((p) => p.status === "REJECTED").length;
  const withdrawn = proposals.filter((p) => p.status === "WITHDRAWN" || p.status === "CANCELLED").length;
  const pending = proposals.filter((p) =>
    !["APPROVED", "COMPLETED", "REJECTED", "WITHDRAWN", "CANCELLED", "DRAFT"].includes(p.status)
  ).length;

  const byStage = STAGE_STATUSES.map((status) => ({
    status,
    count: proposals.filter((p) => p.status === status).length,
  })).filter((s) => s.count > 0);

  const byArea = PROGRAM_AREAS.map((area) => ({
    area,
    count: proposals.filter((p) => p.programArea === area).length,
  })).filter((a) => a.count > 0);

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.controlNumber && p.controlNumber.toLowerCase().includes(search.toLowerCase())) ||
      p.school.toLowerCase().includes(search.toLowerCase()) ||
      p.district.toLowerCase().includes(search.toLowerCase());

    const matchesArea = !areaFilter || p.programArea === areaFilter;

    return matchesSearch && matchesArea;
  });

  return (
    <Stack gap="md">
      <Title order={2}>Management Dashboard</Title>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="md">
        <StatCard label="Total Proposals" value={total} color="blue" />
        <StatCard label="Pending" value={pending} color="orange" />
        <StatCard label="Approved / Completed" value={approved} color="green" />
        <StatCard label="Rejected / Withdrawn" value={rejected + withdrawn} color="red" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder p="md">
          <Text fw={600} mb="sm">Pending by Stage</Text>
          {byStage.length === 0 ? (
            <Text c="dimmed" size="sm">No pending proposals</Text>
          ) : (
            <Stack gap="xs">
              {byStage.map(({ status, count }) => (
                <Group key={status} justify="space-between">
                  <StatusBadge status={status} />
                  <Badge variant="filled" size="lg">{count}</Badge>
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Card withBorder p="md">
          <Text fw={600} mb="sm">By Program Area</Text>
          <Table>
            <Table.Tbody>
              {byArea.map(({ area, count }) => (
                <Table.Tr key={area}>
                  <Table.Td><Text size="sm">{area}</Text></Table.Td>
                  <Table.Td><Badge variant="light">{count}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>

      {/* Monitored Proposals Table */}
      <Card withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap">
            <Text fw={600} size="md">All Proposals Monitoring ({filteredProposals.length})</Text>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <TextInput
              placeholder="Search by title, control no, school, district..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="xs"
            />
            <Select
              placeholder="Filter by Program Area"
              leftSection={<IconFilter size={16} />}
              data={[{ value: "", label: "All Program Areas" }, ...PROGRAM_AREAS.map((a) => ({ value: a, label: a }))]}
              value={areaFilter ?? ""}
              onChange={(v) => setAreaFilter(v ? v : null)}
              size="xs"
              clearable
            />
          </SimpleGrid>

          <Table.ScrollContainer minWidth={700}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Control No.</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Program Area</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>School</Table.Th>
                  <Table.Th>District</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredProposals.map((p) => {
                  const isCompleted = p.status === "COMPLETED" || p.status === "APPROVED";
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td><Text size="sm" fw={500}>{p.controlNumber || "—"}</Text></Table.Td>
                      <Table.Td><Text size="sm">{p.title}</Text></Table.Td>
                      <Table.Td><Badge variant="light" size="sm">{p.programArea}</Badge></Table.Td>
                      <Table.Td><StatusBadge status={p.status} /></Table.Td>
                      <Table.Td><Text size="sm" c="dimmed">{p.school || "—"}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="dimmed">{p.district || "—"}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="dimmed">{dayjs(p.updatedAt).format("MMM D, YYYY")}</Text></Table.Td>
                      <Table.Td>
                        <Group gap={6} wrap="nowrap">
                          <Tooltip label="View Details / Audit Trail">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => router.push(`/reviewer/${p.id}`)}
                            >
                              <IconEye size={15} />
                            </ActionIcon>
                          </Tooltip>

                          {isCompleted && (
                            <>
                              <Tooltip label="View Final Document">
                                <ActionIcon
                                  variant="light"
                                  color="green"
                                  size="sm"
                                  onClick={() => router.push(`/proposals/${p.id}/final`)}
                                >
                                  <IconFileText size={15} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Download Official PDF">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  size="sm"
                                  loading={downloadingId === p.id}
                                  onClick={() => handleQuickDownload(p)}
                                >
                                  <IconDownload size={15} />
                                </ActionIcon>
                              </Tooltip>
                            </>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      </Card>
    </Stack>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card withBorder p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
      <Text size="xl" fw={700} c={color} mt={4}>{value}</Text>
    </Card>
  );
}
