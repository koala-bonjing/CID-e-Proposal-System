"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Table, Text, Badge, Loader, Center, Card, Stack, Button, Group,
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchProposals } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import type { Proposal } from "@/types";
import { ROLE_LABELS } from "@/types";
import dayjs from "dayjs";

export default function ReviewerQueuePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    const reviewerRoles = ["PRINCIPAL", "PSDS", "COORDINATOR_EPS", "CID_CHIEF", "ASDS", "SDS"];
    if (!reviewerRoles.includes(user.role)) { router.push("/login"); return; }
    fetchProposals(user.id).then((data) => { setProposals(data); setLoading(false); });
  }, [user, router]);

  if (loading) return <Center h={400}><Loader /></Center>;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Review Queue</Title>
        <Badge size="lg" variant="light">
          {user ? ROLE_LABELS[user.role] : ""} — {proposals.length} item(s)
        </Badge>
      </Group>

      {proposals.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">No proposals in your queue right now.</Text>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Table.ScrollContainer minWidth={700}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Control No.</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Proponent</Table.Th>
                  <Table.Th>School</Table.Th>
                  <Table.Th>Program Area</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proposals.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td><Text size="sm" fw={500}>{p.controlNumber}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.title}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{p.proponentId}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{p.school}</Text></Table.Td>
                    <Table.Td><Badge variant="light" size="sm">{p.programArea}</Badge></Table.Td>
                    <Table.Td><StatusBadge status={p.status} /></Table.Td>
                    <Table.Td>
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                        onClick={() => router.push(`/reviewer/${p.id}`)}
                      >
                        Review
                      </Button>
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
