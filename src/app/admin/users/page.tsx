"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title, Card, Table, Button, Stack, Text, Loader, Center, Group, Badge,
  Modal, TextInput, Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchUsers, createUser } from "@/lib/api";
import type { User, Role } from "@/types";
import { ROLE_LABELS, PROGRAM_AREAS } from "@/types";

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

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Users</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
          Add User
        </Button>
      </Group>

      <Card withBorder p={0}>
        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>School</Table.Th>
                <Table.Th>District</Table.Th>
                <Table.Th>Program Area</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td><Text size="sm" fw={500}>{u.name}</Text></Table.Td>
                  <Table.Td><Badge variant="light">{ROLE_LABELS[u.role]}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.school ?? "—"}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.district ?? "—"}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.programArea ?? "—"}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <Stack gap="md">
          <TextInput label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Role" required data={ROLES} value={form.role} onChange={(v) => setForm({ ...form, role: v ?? "" })} />
          <TextInput label="School" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          <TextInput label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
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
