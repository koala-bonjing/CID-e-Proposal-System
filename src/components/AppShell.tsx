"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  AppShell as MantineAppShell,
  Group,
  Text,
  NavLink,
  Button,
  Menu,
  Avatar,
  Badge,
  UnstyledButton,
  Box,
  Burger,
  Image,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconFileText,
  IconPlus,
  IconChecklist,
  IconChartBar,
  IconRoute,
  IconUsers,
  IconSwitchHorizontal,
  IconLogout,
  IconLogin,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABELS } from "@/types";
import type { Role } from "@/types";

const NAV_ITEMS: { label: string; href: string; icon: typeof IconFileText; roles: Role[] | "all" }[] = [
  { label: "My Proposals", href: "/proponent/dashboard", icon: IconFileText, roles: ["PROPONENT"] },
  { label: "New Proposal", href: "/proponent/new", icon: IconPlus, roles: ["PROPONENT"] },
  { label: "Review Queue", href: "/reviewer/queue", icon: IconChecklist, roles: ["PRINCIPAL", "PSDS", "COORDINATOR_EPS", "CID_CHIEF", "ASDS", "SDS"] },
  { label: "Management Dashboard", href: "/dashboard/management", icon: IconChartBar, roles: ["CID_CHIEF", "ASDS", "SDS", "ADMIN"] },
  { label: "Routing Matrix", href: "/admin/routing-matrix", icon: IconRoute, roles: ["ADMIN"] },
  { label: "Users", href: "/admin/users", icon: IconUsers, roles: ["ADMIN"] },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [opened, { toggle }] = useDisclosure(true);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const visibleNav = user
    ? NAV_ITEMS.filter((item) => item.roles === "all" || item.roles.includes(user.role))
    : [];

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            {user && (
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                aria-label="Toggle navigation"
              />
            )}
            <Group
              gap="xs"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(user ? getHomeRoute(user.role) : "/login")}
            >
              <Image
                src="/logo.png"
                alt="DepEd Sorsogon Logo"
                w={36}
                h={36}
                fit="contain"
              />
              <div>
                <Text fw={700} size="md" lh={1.1}>
                  <Text span c="blue" inherit>CID e-Proposal System</Text>
                </Text>
                <Text size="xs" c="dimmed" lh={1}>
                  SDO Sorsogon
                </Text>
              </div>
            </Group>
          </Group>

          <Group gap="xs">
            {user ? (
              <Group gap="xs">
                <Badge variant="light" size="md">
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Group
                  gap={6}
                  px="xs"
                  py={4}
                  style={{
                    borderRadius: 6,

                  }}
                >
                  <Avatar size="sm" color="blue" radius="xl">
                    {user.name.charAt(0)}
                  </Avatar>
                  <Text size="sm" fw={600}>{user.name}</Text>
                </Group>

                <Tooltip label="Switch user / role">
                  <Button
                    variant="subtle"
                    color="blue"
                    size="xs"
                    leftSection={<IconSwitchHorizontal size={14} />}
                    onClick={() => router.push("/login")}
                  >
                    Switch User
                  </Button>
                </Tooltip>

                <Tooltip label="Logout">
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<IconLogout size={14} />}
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                  >
                    Logout
                  </Button>
                </Tooltip>
              </Group>
            ) : (
              <Button
                variant="light"
                leftSection={<IconLogin size={16} />}
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
            )}
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="xs">
        {visibleNav.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={pathname === item.href}
            onClick={() => router.push(item.href)}
            variant="light"
            mb={4}
          />
        ))}
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Box maw={1200} mx="auto">
          {children}
        </Box>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}

function getHomeRoute(role: Role): string {
  switch (role) {
    case "PROPONENT": return "/proponent/dashboard";
    case "ADMIN": return "/admin/users";
    default: return "/reviewer/queue";
  }
}
