"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Card, Table, Button, Stack, Text, Loader, Center, Group, Badge,
  Modal, TextInput, Select, Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchUsers, createUser } from "@/lib/api";
import type { User, Role } from "@/types";
import { ROLE_LABELS, PROGRAM_AREAS } from "@/types";

const ROLE_ORDER: Role[] = [
  "PROPONENT",
  "PRINCIPAL",
  "PSDS",
  "COORDINATOR_EPS",
  "CID_CHIEF",
  "ASDS",
  "SDS",
  "ADMIN",
];

const ROLE_COLORS: Record<Role, string> = {
  PROPONENT: "blue",
  PRINCIPAL: "cyan",
  PSDS: "teal",
  COORDINATOR_EPS: "indigo",
  CID_CHIEF: "violet",
  ASDS: "grape",
  SDS: "orange",
  ADMIN: "red",
};

const ROLES: { value: Role; label: string }[] = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as Role,
  label,
}));

export default function AdminUsersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "" as string, school: "", district: "", programArea: "" });

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/login"); return; }
    fetchUsers().then((data) => { setUsers(data); setLoading(false); });
  }, [user, router]);

  const handleCreate = async () => {
    try {
      const newUser = await createUser({
        name: form.name,
        role: form.role as Role,
        school: form.school || undefined,
        district: form.district || undefined,
        programArea: form.programArea as any || undefined,
      });
      setUsers([...users, newUser]);
      setModalOpen(false);
      setForm({ name: "", role: "", school: "", district: "", programArea: "" });
      notifications.show({ title: "Created", message: `User ${newUser.name} created`, color: "green", icon: <IconCheck size={16} /> });
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    }
  };

  if (loading) return <Center h={400}><Loader /></Center>;

  // Group users by role
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    users: users.filter((u) => u.role === role),
  })).filter((g) => g.users.length > 0);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>User Directory</Title>
          <Text size="sm" c="dimmed">
            Manage system users organized by their respective administrative roles ({users.length} total users)
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
          Add User
        </Button>
      </Group>

      {grouped.map(({ role, users: roleUsers }) => (
        <Card key={role} withBorder p={0} radius="md">
          <Box
            p="sm"
            px="md"
            style={{
              borderBottom: "1px solid var(--mantine-color-gray-2)",
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            <Group justify="space-between">
              <Group gap="xs">
                <Badge color={ROLE_COLORS[role]} variant="filled" size="md">
                  {ROLE_LABELS[role]}
                </Badge>
                <Text size="sm" fw={600} c="dimmed">
                  {roleUsers.length} user{roleUsers.length > 1 ? "s" : ""}
                </Text>
              </Group>
            </Group>
          </Box>

          <Table.ScrollContainer minWidth={500}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>School</Table.Th>
                  <Table.Th>District</Table.Th>
                  <Table.Th>Program Area</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {roleUsers.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td><Text size="sm" fw={600}>{u.name}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{u.school ?? "—"}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{u.district ?? "—"}</Text></Table.Td>
                    <Table.Td>
                      {u.programArea ? (
                        <Badge variant="light" color={ROLE_COLORS[role]} size="sm">
                          {u.programArea}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      ))}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add New User">
        <Stack gap="md">
          <TextInput label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Role" required data={ROLES} value={form.role} onChange={(v) => setForm({ ...form, role: v ?? "" })} />
          <TextInput label="School" placeholder="e.g. Sorsogon NHS" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          <TextInput label="District" placeholder="e.g. Bulan, Sorsogon City" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          {form.role === "COORDINATOR_EPS" && (
            <Select
              label="Program Area"
              data={PROGRAM_AREAS.map((a) => ({ value: a, label: a }))}
              value={form.programArea}
              onChange={(v) => setForm({ ...form, programArea: v ?? "" })}
            />
          )}
          <Button onClick={handleCreate} disabled={!form.name || !form.role}>
            Create User
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
