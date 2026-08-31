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
                  <Text span c="blue" inherit>DP-MAS</Text>
                </Text>
                <Text size="xs" c="dimmed" lh={1}>
                  SDO Sorsogon
                </Text>
              </div>
            </Group>
          </Group>

          <Group gap="sm">
            {user ? (
              <>
                <Badge variant="light" size="lg">
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap="xs">
                        <Avatar size="sm" color="blue" radius="xl">
                          {user.name.charAt(0)}
                        </Avatar>
                        <Text size="sm" fw={500}>{user.name}</Text>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconSwitchHorizontal size={14} />}
                      onClick={() => router.push("/login")}
                    >
                      Switch User
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconLogout size={14} />}
                      color="red"
                      onClick={() => { logout(); router.push("/login"); }}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
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
