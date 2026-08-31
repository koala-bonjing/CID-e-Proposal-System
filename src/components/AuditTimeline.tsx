"use client";
import { Timeline, Text, ThemeIcon } from "@mantine/core";
import {
  IconSend, IconCheck, IconArrowBack, IconX, IconRefresh, IconRoute, IconFileCheck,
} from "@tabler/icons-react";
import type { AuditLogEntry, AuditAction } from "@/types";
import { ROLE_LABELS } from "@/types";
import dayjs from "dayjs";

const ACTION_CONFIG: Record<AuditAction, { icon: typeof IconSend; color: string; label: string }> = {
  SUBMITTED: { icon: IconSend, color: "blue", label: "Submitted" },
  APPROVED: { icon: IconCheck, color: "green", label: "Approved" },
  RETURNED_FOR_REVISION: { icon: IconArrowBack, color: "orange", label: "Returned for Revision" },
  REJECTED: { icon: IconX, color: "red", label: "Rejected" },
  RESUBMITTED: { icon: IconRefresh, color: "blue", label: "Resubmitted" },
  ROUTED: { icon: IconRoute, color: "cyan", label: "Routed" },
  FINALIZED: { icon: IconFileCheck, color: "green", label: "Finalized" },
};

interface Props {
  entries: AuditLogEntry[];
  users: Record<string, string>; // id → name map
}

export function AuditTimeline({ entries, users }: Props) {
  return (
    <Timeline active={entries.length - 1} bulletSize={28} lineWidth={2}>
      {entries.map((entry) => {
        const config = ACTION_CONFIG[entry.action];
        const Icon = config.icon;
        return (
          <Timeline.Item
            key={entry.id}
            bullet={
              <ThemeIcon size={28} variant="filled" color={config.color} radius="xl">
                <Icon size={14} />
              </ThemeIcon>
            }
            title={
              <Text size="sm" fw={600}>
                {config.label}
                <Text span size="xs" c="dimmed" ml={8}>
                  by {users[entry.actorId] ?? entry.actorId} ({ROLE_LABELS[entry.actorRole]})
                </Text>
              </Text>
            }
          >
            {entry.comment && (
              <Text size="sm" c="dimmed" mt={4}>
                {entry.comment}
              </Text>
            )}
            <Text size="xs" c="dimmed" mt={4}>
              {dayjs(entry.timestamp).format("MMM D, YYYY h:mm A")}
            </Text>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}
