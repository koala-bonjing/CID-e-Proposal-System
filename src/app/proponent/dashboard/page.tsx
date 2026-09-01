"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Table, Group, Text, Button, Loader, Center, Card, Stack, ActionIcon, Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEye, IconRefresh, IconFileText, IconDownload, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchProposals, downloadProposalPdf } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import type { Proposal } from "@/types";
import { ROLE_LABELS } from "@/types";
import dayjs from "dayjs";

export default function ProponentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchProposals(user.id).then((data) => { setProposals(data); setLoading(false); });
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

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>My Proposals</Title>
        <Button leftSection={<IconFileText size={16} />} onClick={() => router.push("/proponent/new")}>
          New Proposal
        </Button>
      </Group>

      {proposals.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">No proposals yet. Create your first proposal!</Text>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Table.ScrollContainer minWidth={650}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Control No.</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Current Assignee</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proposals.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{p.controlNumber || "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{p.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={p.status} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {p.currentAssigneeRole ? ROLE_LABELS[p.currentAssigneeRole] : "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {dayjs(p.updatedAt).format("MMM D, YYYY")}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="View Details">
                          <ActionIcon variant="light" onClick={() => router.push(`/reviewer/${p.id}`)}>
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {p.status === "REVISION_REQUIRED" && (
                          <Tooltip label="Resubmit">
                            <ActionIcon variant="light" color="orange" onClick={() => router.push(`/proponent/new?resubmit=${p.id}`)}>
                              <IconRefresh size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {p.status === "COMPLETED" && (
                          <>
                            <Tooltip label="View Final Document">
                              <ActionIcon variant="light" color="green" onClick={() => router.push(`/proposals/${p.id}/final`)}>
                                <IconFileText size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Download Official PDF">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                loading={downloadingId === p.id}
                                onClick={() => handleQuickDownload(p)}
                              >
                                <IconDownload size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}
    </Stack>
  );
}
