"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Table, Text, Badge, Loader, Center, Card, Stack, Button, Group,
  SegmentedControl, TextInput, Select, ActionIcon, Tooltip, SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEye, IconFileText, IconDownload, IconCheck, IconSearch, IconFilter,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchProposals, downloadProposalPdf } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import type { Proposal, Role } from "@/types";
import { ROLE_LABELS, PROGRAM_AREAS } from "@/types";
import dayjs from "dayjs";

const ROLE_ACTIVE_STATUS: Partial<Record<Role, string>> = {
  PRINCIPAL: "FOR_PRINCIPAL_APPROVAL",
  PSDS: "FOR_PSDS_APPROVAL",
  COORDINATOR_EPS: "FOR_COORDINATOR_EPS_REVIEW",
  CID_CHIEF: "FOR_CID_CHIEF_APPROVAL",
  ASDS: "FOR_ASDS_APPROVAL",
  SDS: "FOR_SDS_APPROVAL",
};

export default function ReviewerQueuePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [tab, setTab] = useState<"pending" | "passed" | "all">("pending");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    const reviewerRoles: Role[] = [
      "PRINCIPAL", "PSDS", "COORDINATOR_EPS", "CID_CHIEF", "ASDS", "SDS", "ADMIN"
    ];
    if (!reviewerRoles.includes(user.role)) { router.push("/login"); return; }
    fetchProposals(user.id).then((data) => {
      setProposals(data);
      setLoading(false);
    });
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

  const activeStatus = user ? ROLE_ACTIVE_STATUS[user.role] : null;

  // Split into categories
  const pendingProposals = proposals.filter((p) => {
    if (user?.role === "ADMIN") {
      return !["APPROVED", "COMPLETED", "REJECTED", "WITHDRAWN", "CANCELLED", "DRAFT"].includes(p.status);
    }
    return activeStatus ? p.status === activeStatus : false;
  });

  const passedProposals = proposals.filter((p) => {
    if (user?.role === "ADMIN") {
      return p.status === "APPROVED" || p.status === "COMPLETED";
    }
    // Any proposal that has passed this stage or completed
    if (p.status === "APPROVED" || p.status === "COMPLETED") return true;
    if (activeStatus && p.status !== activeStatus && p.status !== "DRAFT") return true;
    return false;
  });

  const currentTabList =
    tab === "pending"
      ? pendingProposals
      : tab === "passed"
      ? passedProposals
      : proposals;

  const filteredProposals = currentTabList.filter((p) => {
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
      {/* Header & Role Badge */}
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={2}>
            {user?.role === "ADMIN" || user?.role === "SDS"
              ? "Proposals Monitoring & Review"
              : "Review Queue"}
          </Title>
          <Text size="sm" c="dimmed">
            Monitor and review proposals passed into your office
          </Text>
        </div>
        <Badge size="lg" variant="light" color="blue">
          {user ? ROLE_LABELS[user.role] : ""} • {proposals.length} total
        </Badge>
      </Group>

      {/* Tabs / Filter Controls */}
      <Card withBorder p="sm" radius="md">
        <Stack gap="sm">
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as any)}
            data={[
              {
                value: "pending",
                label: `Pending Action (${pendingProposals.length})`,
              },
              {
                value: "passed",
                label: `Passed / Completed (${passedProposals.length})`,
              },
              {
                value: "all",
                label: `All Monitored (${proposals.length})`,
              },
            ]}
            fullWidth
          />

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
        </Stack>
      </Card>

      {/* Proposals Table */}
      {filteredProposals.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">
            {tab === "pending"
              ? "No proposals pending your action right now."
              : "No proposals match the current filter."}
          </Text>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Table.ScrollContainer minWidth={750}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Control No.</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>School / Office</Table.Th>
                  <Table.Th>District</Table.Th>
                  <Table.Th>Program Area</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredProposals.map((p) => {
                  const isActionable = activeStatus ? p.status === activeStatus : false;
                  const isCompleted = p.status === "COMPLETED" || p.status === "APPROVED";

                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{p.controlNumber || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={isActionable ? 600 : 400}>{p.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{p.school || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{p.district || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">{p.programArea}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <StatusBadge status={p.status} />
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">{dayjs(p.updatedAt).format("MMM D, YYYY")}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} wrap="nowrap">
                          {isActionable ? (
                            <Button
                              variant="filled"
                              color="blue"
                              size="xs"
                              leftSection={<IconEye size={14} />}
                              onClick={() => router.push(`/reviewer/${p.id}`)}
                            >
                              Review
                            </Button>
                          ) : (
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
                          )}

                          {isCompleted && (
                            <>
                              <Tooltip label="View Official Document">
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
        </Card>
      )}
    </Stack>
  );
}
