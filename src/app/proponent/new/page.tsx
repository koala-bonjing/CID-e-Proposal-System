"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Title, TextInput, Textarea, Select, NumberInput, Button, Group, Stack,
  Card, Table, ActionIcon, Text, Alert, Stepper, Divider, Center, Loader,
  SimpleGrid, Progress, Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { createProposal, fetchProposal, resubmitProposal } from "@/lib/api";
import { PROGRAM_AREAS } from "@/types";
import type { FundingSource } from "@/types";

const PROPOSAL_STEPS = [
  { label: "Project Info", description: "Basic details" },
  { label: "Content", description: "Rationale, objectives, outputs" },
  { label: "Implementation", description: "Plan & budget" },
  { label: "Other Details", description: "Funding, participants, attachments" },
  { label: "Review & Submit", description: "Final check" },
];

const FUNDING_SOURCES: FundingSource[] = ["School MOOE", "Division MOOE", "LGU", "Partner", "Other"];
const ORIGIN_TYPES = [
  { value: "TEACHER", label: "Teacher" },
  { value: "SCHOOL_HEAD", label: "School Head" },
  { value: "DISTRICT", label: "District" },
];

interface ImplementationRow {
  activity: string; date: string; responsible: string; output: string;
}
interface BudgetRow {
  particular: string; qty: number; unitCost: number;
}

function NewProposalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const resubmitId = searchParams.get("resubmit");

  const [active, setActive] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [originType, setOriginType] = useState("TEACHER");
  const [programArea, setProgramArea] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [venue, setVenue] = useState("");
  const [rationale, setRationale] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [expectedOutputs, setExpectedOutputs] = useState("");
  const [implPlan, setImplPlan] = useState<ImplementationRow[]>([
    { activity: "", date: "", responsible: "", output: "" },
  ]);
  const [budget, setBudget] = useState<BudgetRow[]>([
    { particular: "", qty: 1, unitCost: 0 },
  ]);
  const [fundingSource, setFundingSource] = useState<FundingSource | "">("");
  const [targetParticipants, setTargetParticipants] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  // Load existing data for resubmission
  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (resubmitId) {
      fetchProposal(resubmitId).then((data) => {
        const latestVersion = data.versions[data.versions.length - 1];
        if (latestVersion) {
          setTitle(data.title);
          setOriginType(data.originType);
          setProgramArea(data.programArea);
          setRationale(latestVersion.rationale);
          setObjectives(latestVersion.objectives);
          setExpectedOutputs(latestVersion.expectedOutputs);
          setImplPlan(latestVersion.implementationPlan);
          setBudget(latestVersion.budget);
          setFundingSource(latestVersion.fundingSource);
          setTargetParticipants(latestVersion.targetParticipants);
          setProposedDate(latestVersion.proposedDate);
          setVenue(latestVersion.venue);
          setAttachments(latestVersion.attachments);
        }
      });
    }
  }, [user, resubmitId, router]);

  const budgetTotal = budget.reduce((sum, row) => sum + row.qty * row.unitCost, 0);

  const validate = (): string[] => {
    const missing: string[] = [];
    if (!title.trim()) missing.push("Title");
    if (!programArea) missing.push("Program Area");
    if (!rationale.trim()) missing.push("Rationale");
    if (!objectives.some((o) => o.trim())) missing.push("Objectives");
    if (!expectedOutputs.trim()) missing.push("Expected Outputs");
    if (!implPlan.some((r) => r.activity.trim())) missing.push("Implementation Plan");
    if (!budget.some((r) => r.particular.trim())) missing.push("Budget");
    if (!fundingSource) missing.push("Funding Source");
    if (!targetParticipants.trim()) missing.push("Target Participants");
    if (!proposedDate) missing.push("Proposed Date");
    if (!venue.trim()) missing.push("Venue");
    return missing;
  };

  const handleSubmit = async () => {
    const missing = validate();
    if (missing.length > 0) {
      setErrors(missing);
      setActive(4); // jump to review step
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title, originType, programArea, rationale,
        objectives: objectives.filter((o) => o.trim()),
        expectedOutputs,
        implementationPlan: implPlan.filter((r) => r.activity.trim()),
        budget: budget.filter((r) => r.particular.trim()),
        fundingSource, targetParticipants, proposedDate, venue, attachments,
        proponentId: user!.id,
        school: user!.school ?? "",
        district: user!.district ?? "",
      };

      if (resubmitId) {
        await resubmitProposal(resubmitId, payload);
        notifications.show({ title: "Resubmitted", message: "Proposal resubmitted successfully", color: "green", icon: <IconCheck size={16} /> });
      } else {
        await createProposal(payload);
        notifications.show({ title: "Submitted", message: "Proposal submitted successfully", color: "green", icon: <IconCheck size={16} /> });
      }
      router.push("/proponent/dashboard");
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Stack gap="md">
      <Title order={2}>{resubmitId ? "Resubmit Proposal" : "New Proposal"}</Title>

      {/* Mobile Progress Bar Card (hidden on desktop) */}
      <Card withBorder p="sm" radius="md" hiddenFrom="sm" bg="var(--mantine-color-gray-0)">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Badge color="blue" variant="filled" size="sm">
                Step {active + 1} of {PROPOSAL_STEPS.length}
              </Badge>
              <Text size="sm" fw={700}>
                {PROPOSAL_STEPS[active].label}
              </Text>
            </Group>
            <Text size="xs" fw={600} c="dimmed">
              {Math.round(((active + 1) / PROPOSAL_STEPS.length) * 100)}%
            </Text>
          </Group>

          <Progress
            value={((active + 1) / PROPOSAL_STEPS.length) * 100}
            size="sm"
            radius="xl"
            color="blue"
          />

          <Text size="xs" c="dimmed">
            {PROPOSAL_STEPS[active].description}
          </Text>

          {/* Quick-jump numbered buttons for mobile */}
          <Group gap={6} justify="center" mt={4}>
            {PROPOSAL_STEPS.map((s, idx) => (
              <Button
                key={idx}
                size="compact-xs"
                variant={active === idx ? "filled" : idx < active ? "light" : "subtle"}
                color={idx <= active ? "blue" : "gray"}
                onClick={() => setActive(idx)}
                radius="xl"
                styles={{ root: { minWidth: 28, height: 26, padding: "0 6px", fontSize: 12 } }}
              >
                {idx + 1}
              </Button>
            ))}
          </Group>
        </Stack>
      </Card>

      <Stepper active={active} onStepClick={setActive} size="sm" className="proposal-stepper" wrap={false}>
        <Stepper.Step label="Project Info" description="Basic details">
          <Card withBorder p="lg" mt="md">
            <Stack gap="md">
              <TextInput label="Project Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Select
                  label="Origin Type"
                  data={ORIGIN_TYPES}
                  value={originType}
                  onChange={(v) => v && setOriginType(v)}
                />
                <Select
                  label="Program Area"
                  required
                  data={PROGRAM_AREAS.map((a) => ({ value: a, label: a }))}
                  value={programArea}
                  onChange={(v) => v && setProgramArea(v)}
                  searchable
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput label="Proposed Date" type="date" required value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} />
                <TextInput label="Venue" required value={venue} onChange={(e) => setVenue(e.target.value)} />
              </SimpleGrid>
              <TextInput label="School" value={user.school ?? ""} disabled />
              <TextInput label="District" value={user.district ?? ""} disabled />
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Content" description="Rationale, objectives, outputs">
          <Card withBorder p="lg" mt="md">
            <Stack gap="md">
              <Textarea label="Rationale" required minRows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} />

              <div>
                <Text size="sm" fw={500} mb={4}>Objectives *</Text>
                {objectives.map((obj, i) => (
                  <Group key={i} mb="xs">
                    <TextInput
                      style={{ flex: 1 }}
                      placeholder={`Objective ${i + 1}`}
                      value={obj}
                      onChange={(e) => {
                        const newObj = [...objectives];
                        newObj[i] = e.target.value;
                        setObjectives(newObj);
                      }}
                    />
                    {objectives.length > 1 && (
                      <ActionIcon color="red" variant="light" onClick={() => setObjectives(objectives.filter((_, j) => j !== i))}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}
                <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setObjectives([...objectives, ""])}>
                  Add Objective
                </Button>
              </div>

              <Textarea label="Expected Outputs" required minRows={3} value={expectedOutputs} onChange={(e) => setExpectedOutputs(e.target.value)} />
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Implementation" description="Plan & budget">
          <Card withBorder p="lg" mt="md">
            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb={8}>Implementation Plan *</Text>
                <Table.ScrollContainer minWidth={600}>
                  <Table withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Activity</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Responsible</Table.Th>
                        <Table.Th>Output</Table.Th>
                        <Table.Th w={40}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {implPlan.map((row, i) => (
                        <Table.Tr key={i}>
                          <Table.Td><TextInput size="xs" value={row.activity} onChange={(e) => { const r = [...implPlan]; r[i] = { ...r[i], activity: e.target.value }; setImplPlan(r); }} /></Table.Td>
                          <Table.Td><TextInput size="xs" type="date" value={row.date} onChange={(e) => { const r = [...implPlan]; r[i] = { ...r[i], date: e.target.value }; setImplPlan(r); }} /></Table.Td>
                          <Table.Td><TextInput size="xs" value={row.responsible} onChange={(e) => { const r = [...implPlan]; r[i] = { ...r[i], responsible: e.target.value }; setImplPlan(r); }} /></Table.Td>
                          <Table.Td><TextInput size="xs" value={row.output} onChange={(e) => { const r = [...implPlan]; r[i] = { ...r[i], output: e.target.value }; setImplPlan(r); }} /></Table.Td>
                          <Table.Td>
                            {implPlan.length > 1 && (
                              <ActionIcon size="sm" color="red" variant="light" onClick={() => setImplPlan(implPlan.filter((_, j) => j !== i))}>
                                <IconTrash size={12} />
                              </ActionIcon>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                <Button variant="light" size="xs" mt="xs" leftSection={<IconPlus size={14} />} onClick={() => setImplPlan([...implPlan, { activity: "", date: "", responsible: "", output: "" }])}>
                  Add Row
                </Button>
              </div>

              <Divider />

              <div>
                <Text size="sm" fw={500} mb={8}>Budget *</Text>
                <Table.ScrollContainer minWidth={550}>
                  <Table withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Particular</Table.Th>
                        <Table.Th>Qty</Table.Th>
                        <Table.Th>Unit Cost (₱)</Table.Th>
                        <Table.Th>Total</Table.Th>
                        <Table.Th w={40}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {budget.map((row, i) => (
                        <Table.Tr key={i}>
                          <Table.Td><TextInput size="xs" value={row.particular} onChange={(e) => { const r = [...budget]; r[i] = { ...r[i], particular: e.target.value }; setBudget(r); }} /></Table.Td>
                          <Table.Td><NumberInput size="xs" min={1} value={row.qty} onChange={(v) => { const r = [...budget]; r[i] = { ...r[i], qty: Number(v) || 1 }; setBudget(r); }} /></Table.Td>
                          <Table.Td><NumberInput size="xs" min={0} value={row.unitCost} onChange={(v) => { const r = [...budget]; r[i] = { ...r[i], unitCost: Number(v) || 0 }; setBudget(r); }} /></Table.Td>
                          <Table.Td><Text size="sm">₱{(row.qty * row.unitCost).toLocaleString()}</Text></Table.Td>
                          <Table.Td>
                            {budget.length > 1 && (
                              <ActionIcon size="sm" color="red" variant="light" onClick={() => setBudget(budget.filter((_, j) => j !== i))}>
                                <IconTrash size={12} />
                              </ActionIcon>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    <Table.Tfoot>
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text fw={600} ta="right">Grand Total</Text></Table.Td>
                        <Table.Td><Text fw={600}>₱{budgetTotal.toLocaleString()}</Text></Table.Td>
                        <Table.Td></Table.Td>
                      </Table.Tr>
                    </Table.Tfoot>
                  </Table>
                </Table.ScrollContainer>
                <Button variant="light" size="xs" mt="xs" leftSection={<IconPlus size={14} />} onClick={() => setBudget([...budget, { particular: "", qty: 1, unitCost: 0 }])}>
                  Add Row
                </Button>
              </div>
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Other Details" description="Funding, participants, attachments">
          <Card withBorder p="lg" mt="md">
            <Stack gap="md">
              <Select
                label="Funding Source"
                required
                data={FUNDING_SOURCES.map((f) => ({ value: f, label: f }))}
                value={fundingSource}
                onChange={(v) => v && setFundingSource(v as FundingSource)}
              />
              <Textarea label="Target Participants" required minRows={2} value={targetParticipants} onChange={(e) => setTargetParticipants(e.target.value)} />
              <div>
                <Text size="sm" fw={500} mb={4}>Attachments (mock filenames)</Text>
                {attachments.map((att, i) => (
                  <Group key={i} mb="xs">
                    <TextInput
                      style={{ flex: 1 }}
                      placeholder="filename.pdf"
                      value={att}
                      onChange={(e) => {
                        const newAtt = [...attachments];
                        newAtt[i] = e.target.value;
                        setAttachments(newAtt);
                      }}
                    />
                    <ActionIcon color="red" variant="light" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setAttachments([...attachments, ""])}>
                  Add Attachment
                </Button>
              </div>
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Review & Submit" description="Final check">
          <Card withBorder p="lg" mt="md">
            <Stack gap="md">
              {errors.length > 0 && (
                <Alert icon={<IconAlertCircle size={16} />} title="Missing Required Fields" color="red">
                  <Text size="sm">Please complete the following fields before submitting:</Text>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                    {errors.map((e) => <li key={e}><Text size="sm">{e}</Text></li>)}
                  </ul>
                </Alert>
              )}

              <div>
                <Text fw={600} mb={4}>Summary</Text>
                <Table withTableBorder>
                  <Table.Tbody>
                    <Table.Tr><Table.Td fw={500}>Title</Table.Td><Table.Td>{title || "—"}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Program Area</Table.Td><Table.Td>{programArea || "—"}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Origin Type</Table.Td><Table.Td>{originType}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Proposed Date</Table.Td><Table.Td>{proposedDate || "—"}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Venue</Table.Td><Table.Td>{venue || "—"}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Budget Total</Table.Td><Table.Td>₱{budgetTotal.toLocaleString()}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Funding Source</Table.Td><Table.Td>{fundingSource || "—"}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td fw={500}>Objectives</Table.Td><Table.Td>{objectives.filter(o => o.trim()).length} item(s)</Table.Td></Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>

              <Group justify="flex-end">
                <Button
                  size="lg"
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  {resubmitId ? "Resubmit Proposal" : "Submit Proposal"}
                </Button>
              </Group>
            </Stack>
          </Card>
        </Stepper.Step>
      </Stepper>

      <Group justify="space-between" mt="md">
        <Button variant="default" disabled={active === 0} onClick={() => setActive(active - 1)}>
          Back
        </Button>
        <Button variant="light" disabled={active === 4} onClick={() => setActive(active + 1)}>
          Next
        </Button>
      </Group>
    </Stack>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<Center h={400}><Loader /></Center>}>
      <NewProposalContent />
    </Suspense>
  );
}
