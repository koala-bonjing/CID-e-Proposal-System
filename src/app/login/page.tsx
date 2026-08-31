"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container, Title, Text, SimpleGrid, Card, Group, Avatar, Badge, Stack, Loader, Center, Image,
} from "@mantine/core";
import { useAuthStore } from "@/lib/auth-store";
import { fetchUsers } from "@/lib/api";
import type { User, Role } from "@/types";
import { ROLE_LABELS } from "@/types";

const ROLE_ORDER: Role[] = [
  "PROPONENT", "PRINCIPAL", "PSDS", "COORDINATOR_EPS",
  "CID_CHIEF", "ASDS", "SDS", "ADMIN",
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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then((data) => { setUsers(data); setLoading(false); });
  }, []);

  const handleLogin = (user: User) => {
    login(user);
    const route = user.role === "PROPONENT"
      ? "/proponent/dashboard"
      : user.role === "ADMIN"
        ? "/admin/users"
        : "/reviewer/queue";
    router.push(route);
  };

  if (loading) {
    return <Center h="100vh"><Loader size="lg" /></Center>;
  }

  // Group users by role
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    users: users.filter((u) => u.role === role),
  })).filter((g) => g.users.length > 0);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xs" mb="xl" ta="center" align="center">
        <Image
          src="/logo.png"
          alt="DepEd Schools Division of Sorsogon"
          w={84}
          h={84}
          fit="contain"
        />
        <Title order={1}>
          <Text span c="blue" inherit>CID e-Proposal System</Text>
        </Title>
        <Text size="lg" c="dimmed">
          Proposal Management & Approval System
        </Text>
        <Text size="sm" c="dimmed">
          Schools Division Office of Sorsogon — Select a user to log in
        </Text>
      </Stack>

      {grouped.map(({ role, users: roleUsers }) => (
        <div key={role}>
          <Group mb="xs" mt="lg">
            <Badge color={ROLE_COLORS[role]} variant="filled" size="lg">
              {ROLE_LABELS[role]}
            </Badge>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {roleUsers.map((user) => (
              <Card
                key={user.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
                onClick={() => handleLogin(user)}
              >
                <Group>
                  <Avatar color={ROLE_COLORS[role]} radius="xl" size="md">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </Avatar>
                  <div>
                    <Text fw={600} size="sm">{user.name}</Text>
                    {user.school && (
                      <Text size="xs" c="dimmed">{user.school}</Text>
                    )}
                    {user.district && (
                      <Text size="xs" c="dimmed">District: {user.district}</Text>
                    )}
                    {user.programArea && (
                      <Text size="xs" c="dimmed">Area: {user.programArea}</Text>
                    )}
                  </div>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </div>
      ))}
    </Container>
  );
}
