"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container, Title, Text, SimpleGrid, Card, Group, Avatar, Badge, Stack, Loader, Center, Image,
  TextInput, PasswordInput, Button, Checkbox, Divider, SegmentedControl, Alert, Box, Paper, Select,
} from "@mantine/core";
import {
  IconLock, IconUser, IconArrowRight, IconShieldCheck, IconInfoCircle, IconUsers, IconLogin,
} from "@tabler/icons-react";
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
  const [viewMode, setViewMode] = useState<"standard" | "picker">("standard");

  // Standard login form state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("••••••••");
  const [rememberMe, setRememberMe] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data);
      if (data.length > 0) {
        // default to first proponent for convenience
        const proponent = data.find((u) => u.role === "PROPONENT") ?? data[0];
        setSelectedUserId(proponent.id);
      }
      setLoading(false);
    });
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

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Please select an account to sign in.");
      return;
    }
    const targetUser = users.find((u) => u.id === selectedUserId);
    if (!targetUser) {
      setError("User account not found.");
      return;
    }
    setError(null);
    setLoggingIn(true);
    setTimeout(() => {
      handleLogin(targetUser);
    }, 400);
  };

  if (loading) {
    return <Center h="100vh"><Loader size="lg" /></Center>;
  }

  // Group users by role for the role picker
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    users: users.filter((u) => u.role === role),
  })).filter((g) => g.users.length > 0);

  const selectedUserObj = users.find((u) => u.id === selectedUserId);

  return (
    <Box py="xl" style={{ minHeight: "100vh", backgroundColor: "var(--mantine-color-gray-0)" }}>
      <Container size={viewMode === "standard" ? "xs" : "lg"}>
        {/* Top View Toggle */}
        <Group justify="center" mb="lg">
          <SegmentedControl
            value={viewMode}
            onChange={(val) => setViewMode(val as "standard" | "picker")}
            data={[
              { label: "🔐 DepEd Portal Sign In", value: "standard" },
              { label: "👥 Demo Role Picker (1-Click)", value: "picker" },
            ]}
            size="sm"
            radius="md"
          />
        </Group>

        {viewMode === "standard" ? (
          /* STANDARD FORM LOGIN */
          <Paper withBorder shadow="md" p="xl" radius="lg" bg="white">
            <Stack gap="sm" align="center" ta="center" mb="md">
              <Image
                src="/logo.png"
                alt="DepEd Schools Division of Sorsogon Logo"
                w={76}
                h={76}
                fit="contain"
              />
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
                  Republic of the Philippines • DepEd
                </Text>
                <Text size="xs" c="dimmed" fw={500}>
                  Schools Division Office of Sorsogon
                </Text>
                <Title order={2} mt={2}>
                  <Text span c="blue" inherit>CID e-Proposal System</Text>
                </Title>
                <Text size="xs" c="dimmed" mt={1}>
                  Curriculum Implementation Division (DP-MAS)
                </Text>
              </div>
            </Stack>

            <Divider mb="lg" label="Sign in to your account" labelPosition="center" />

            {error && (
              <Alert color="red" icon={<IconInfoCircle size={16} />} mb="md">
                {error}
              </Alert>
            )}

            <form onSubmit={handleStandardSubmit}>
              <Stack gap="md">
                <Select
                  label="Select DepEd Account / User"
                  placeholder="Choose an account"
                  required
                  leftSection={<IconUser size={18} />}
                  data={users.map((u) => ({
                    value: u.id,
                    label: `${u.name} — ${ROLE_LABELS[u.role]}${u.programArea ? ` (${u.programArea})` : u.school ? ` (${u.school})` : u.district ? ` (${u.district})` : ""}`,
                  }))}
                  value={selectedUserId}
                  onChange={(val) => {
                    setSelectedUserId(val ?? "");
                    setError(null);
                  }}
                  searchable
                />

                {selectedUserObj && (
                  <Card withBorder p="xs" radius="md" bg="var(--mantine-color-blue-0)">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Avatar size="sm" color={ROLE_COLORS[selectedUserObj.role]} radius="xl">
                          {selectedUserObj.name.charAt(0)}
                        </Avatar>
                        <div>
                          <Text size="xs" fw={600}>{selectedUserObj.name}</Text>
                          <Text size="xs" c="dimmed">
                            {selectedUserObj.school || selectedUserObj.district || selectedUserObj.programArea || "Division Office"}
                          </Text>
                        </div>
                      </Group>
                      <Badge color={ROLE_COLORS[selectedUserObj.role]} variant="light" size="xs">
                        {ROLE_LABELS[selectedUserObj.role]}
                      </Badge>
                    </Group>
                  </Card>
                )}

                <PasswordInput
                  label="DepEd Password"
                  placeholder="Enter your password"
                  leftSection={<IconLock size={18} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  description="Demo mode: Any password accepted"
                />

                <Group justify="space-between" mt={-4}>
                  <Checkbox
                    label="Remember this device"
                    size="xs"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  />
                  <Text size="xs" c="blue" style={{ cursor: "pointer" }}>
                    Forgot password?
                  </Text>
                </Group>

                <Button
                  type="submit"
                  size="md"
                  fullWidth
                  loading={loggingIn}
                  rightSection={<IconArrowRight size={18} />}
                >
                  Sign In to DP-MAS
                </Button>
              </Stack>
            </form>

            <Divider my="lg" />

            <Stack gap="xs" ta="center">
              <Group justify="center" gap={4}>
                <IconShieldCheck size={16} color="var(--mantine-color-teal-6)" />
                <Text size="xs" c="dimmed">
                  Official SDO Sorsogon Curriculum Proposal Portal
                </Text>
              </Group>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconUsers size={14} />}
                onClick={() => setViewMode("picker")}
              >
                Or explore roles via the 1-Click Role Switcher
              </Button>
            </Stack>
          </Paper>
        ) : (
          /* QUICK DEMO ROLE PICKER */
          <Stack gap="md">
            <Stack gap="xs" mb="sm" ta="center" align="center">
              <Image
                src="/logo.png"
                alt="DepEd Schools Division of Sorsogon"
                w={72}
                h={72}
                fit="contain"
              />
              <Title order={1}>
                <Text span c="blue" inherit>CID e-Proposal System</Text>
              </Title>
              <Text size="md" c="dimmed">
                Demo Role Picker — Click any user profile to instantly sign in
              </Text>
            </Stack>

            {grouped.map(({ role, users: roleUsers }) => (
              <div key={role}>
                <Group mb="xs" mt="md">
                  <Badge color={ROLE_COLORS[role]} variant="filled" size="lg">
                    {ROLE_LABELS[role]}
                  </Badge>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                  {roleUsers.map((user) => (
                    <Card
                      key={user.id}
                      shadow="sm"
                      padding="md"
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
                        <div style={{ flex: 1 }}>
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
                        <IconArrowRight size={16} color="var(--mantine-color-gray-5)" />
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              </div>
            ))}

            <Center mt="xl">
              <Button
                variant="light"
                leftSection={<IconLogin size={16} />}
                onClick={() => setViewMode("standard")}
              >
                Back to Standard DepEd Portal Login
              </Button>
            </Center>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
