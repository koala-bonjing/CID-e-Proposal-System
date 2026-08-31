"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Card, Table, Select, Button, Stack, Text, Loader, Center, Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchRoutingMatrix, updateRoutingMatrix, fetchUsers } from "@/lib/api";
import type { RoutingMatrixEntry, User } from "@/types";
import { PROGRAM_AREAS } from "@/types";

export default function RoutingMatrixPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [matrix, setMatrix] = useState<RoutingMatrixEntry[]>([]);
  const [epsUsers, setEpsUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/login"); return; }
    Promise.all([fetchRoutingMatrix(), fetchUsers()]).then(([m, users]) => {
      setMatrix(m);
      setEpsUsers(users.filter((u) => u.role === "COORDINATOR_EPS"));
      setLoading(false);
    });
  }, [user, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateRoutingMatrix(matrix);
      setMatrix(updated);
      notifications.show({ title: "Saved", message: "Routing matrix updated", color: "green", icon: <IconCheck size={16} /> });
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Center h={400}><Loader /></Center>;

  // Ensure all program areas have entries
  const fullMatrix = PROGRAM_AREAS.map((area) => {
    const existing = matrix.find((m) => m.programArea === area);
    return existing ?? { programArea: area, coordinatorId: "" };
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Routing Matrix</Title>
        <Button loading={saving} onClick={handleSave} leftSection={<IconCheck size={16} />}>
          Save Changes
        </Button>
      </Group>

      <Card withBorder p={0}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Program Area</Table.Th>
              <Table.Th>Assigned Coordinator/EPS</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fullMatrix.map((entry) => (
              <Table.Tr key={entry.programArea}>
                <Table.Td>
                  <Text size="sm" fw={500}>{entry.programArea}</Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    size="sm"
                    data={epsUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.programArea ?? ""})` }))}
                    value={entry.coordinatorId}
                    onChange={(v) => {
                      const updated = fullMatrix.map((m) =>
                        m.programArea === entry.programArea ? { ...m, coordinatorId: v ?? "" } : m
                      );
                      setMatrix(updated);
                    }}
                    placeholder="Select coordinator"
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
