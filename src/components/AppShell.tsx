"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  AppShell as MantineAppShell,
  Group,
  Text,
  NavLink,
  Button,
  Avatar,
  Badge,
  Box,
  Burger,
  Image,
  Tooltip,
  ActionIcon,
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
  const [opened, { toggle, close }] = useDisclosure(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const visibleNav = user
    ? NAV_ITEMS.filter((item) => item.roles === "all" || item.roles.includes(user.role))
    : [];

  const handleNavClick = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding={{ base: "xs", sm: "md" }}
    >
      <MantineAppShell.Header>
        <Group h="100%" px={{ base: "xs", sm: "md" }} justify="space-between" wrap="nowrap">
          {/* Left: Burger + Branding */}
          <Group gap="xs" wrap="nowrap">
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
              wrap="nowrap"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(user ? getHomeRoute(user.role) : "/login")}
            >
              <Image
                src="/logo.png"
                alt="DepEd Sorsogon Logo"
                w={34}
                h={34}
                fit="contain"
              />
              <Box>
                <Text fw={700} size="sm" lh={1.1} lineClamp={1}>
                  <Text span c="blue" inherit>CID e-Proposal</Text>
                </Text>
                <Text size="xs" c="dimmed" lh={1} visibleFrom="xs">
                  SDO Sorsogon
                </Text>
              </Box>
            </Group>
          </Group>

          {/* Right: User profile & actions */}
          <Group gap="xs" wrap="nowrap">
            {user ? (
              <Group gap="xs" wrap="nowrap">
                <Badge variant="light" size="sm" visibleFrom="sm">
                  {ROLE_LABELS[user.role]}
                </Badge>

                {/* User avatar + name */}
                <Group
                  gap={6}
                  px={{ base: 4, sm: 8 }}
                  py={3}
                  wrap="nowrap"
                  style={{
                    borderRadius: 6,
                    backgroundColor: "var(--mantine-color-gray-1)",
                  }}
                >
                  <Avatar size="sm" color="blue" radius="xl">
                    {user.name.charAt(0)}
                  </Avatar>
                  <Text size="xs" fw={600} visibleFrom="md" lineClamp={1}>
                    {user.name}
                  </Text>
                </Group>

                {/* Desktop Buttons */}
                <Box visibleFrom="sm">
                  <Group gap={6} wrap="nowrap">
                    <Tooltip label="Switch user or demo role">
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
                </Box>

                {/* Mobile Icon-only Buttons */}
                <Box hiddenFrom="sm">
                  <Group gap={4} wrap="nowrap">
                    <Tooltip label="Switch user">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        onClick={() => router.push("/login")}
                      >
                        <IconSwitchHorizontal size={15} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Logout">
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => {
                          logout();
                          router.push("/login");
                        }}
                      >
                        <IconLogout size={15} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Box>
              </Group>
            ) : (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconLogin size={14} />}
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
            onClick={() => handleNavClick(item.href)}
            variant="light"
            mb={4}
          />
        ))}
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Box maw={1200} mx="auto" px={{ base: 0, sm: "xs" }}>
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
