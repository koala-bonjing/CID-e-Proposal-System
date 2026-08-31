# DP-MAS — Proposal Management and Approval System (Prototype)

A working prototype of the **Curriculum Implementation Division Proposal Management and Approval System**, built for the DepEd Schools Division Office of Sorsogon. Replaces a paper-based proposal approval process — submission, routing, review, revision, final approval, and archiving — with a single digital workflow.

> This is a **mock/prototype build**: no real authentication, no real database, no real PDF/e-signature/SMS. The workflow logic itself (routing, versioning, status transitions, role-based access) is fully functional so the whole approval chain can be demoed end-to-end.

## Core Concept

> The system, rather than people carrying documents, manages the movement of proposals. Approvers primarily make decisions; the system handles routing, notifications, status tracking, version control, and document management.

A proposal is a stateful digital record — at any moment it has exactly one assigned reviewer, a full version history, and a complete audit trail of who did what and when.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
| UI | Tailwind CSS + Mantine UI |
| Data fetching | TanStack Query |
| Client state | Zustand (current logged-in mock user) |
| "Backend" | Next.js API routes over an in-memory store seeded from `data/seed.json` |

The mock store is shaped like real database tables on purpose — typed arrays, only ever touched through the API routes — so swapping in Drizzle/Supabase later is a data-layer change, not a rewrite.

## Roles

| Role | Responsibility |
|---|---|
| Proponent | Creates and submits proposals; tracks status; resubmits after revision |
| Principal | School-level approval |
| PSDS | District-level approval |
| Coordinator / EPS | Technical review within their assigned program area |
| CID Chief | Management-level approval |
| ASDS | Management-level approval |
| SDS | Final approving authority |
| Admin | Manages users, the routing matrix, and program areas |

Principal, PSDS, Coordinator/EPS, CID Chief, ASDS, and SDS all share **one reviewer queue page**, filtered by whichever role is logged in — not six separate builds.

## Features

**Proponent**
- Standardized submission form (proponent info, project info, rationale, objectives, expected outputs, implementation plan, budget with auto-total, funding source, attachments)
- Completeness check blocks submission until all required fields are filled
- "My Proposals" dashboard — status, current assignee, revision comments, download

**Reviewers**
- Filtered queue — only proposals currently assigned to you
- Approve / Return for Revision / Reject, with optional comment
- Full version history and audit trail per proposal (Mantine `Timeline`)
- Chain position shown via a `Stepper`

**Admin**
- Edit the routing matrix (program area → assigned Coordinator/EPS) without touching code
- Manage mock users and roles

**Management Dashboard**
- Totals, pending-by-stage counts, approved vs. rejected/withdrawn

## Project Structure

```
app/
  login/                      role/user picker (fake login)
  proponent/
    dashboard/                "My Proposals"
    new/                      submission form
  reviewer/
    queue/                    shared queue, filtered by role
    [proposalId]/             approve / return / reject screen
  dashboard/
    management/               aggregate stats
  admin/
    routing-matrix/
    users/
  proposals/
    [id]/final/                final generated document view
  api/
    proposals/
    proposals/[id]/
    proposals/[id]/decision/
    proposals/[id]/audit-log/
    routing-matrix/
    users/
data/
  seed.json                   seeded users, proposals, versions, routing matrix
lib/
  mock-db.ts                  in-memory store, seeded from data/seed.json
  workflow.ts                 approval-chain, routing, versioning, status logic
```

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login` and pick any seeded user to log in as that role. Use the "Switch user" control in the header to jump between roles without logging out — the seed data is pre-loaded mid-workflow, so every role has something in their queue immediately.

## Workflow Logic

**Approval chain** depends on who originates the proposal:

- Teacher-originated: Principal → PSDS → Coordinator/EPS → CID Chief → ASDS → SDS
- School Head-originated: PSDS → Coordinator/EPS → CID Chief → ASDS → SDS
- District-originated: PSDS → Coordinator/EPS → CID Chief → ASDS → SDS

**Control number** — format `SDO-SOR-{year}-{6-digit sequential}`, generated once on first submission, and never changes across revisions.

**Automatic routing** — once a proposal clears school/district approval, its `programArea` is looked up in the routing matrix to assign the correct Coordinator/EPS. Editable data, not hardcoded logic.

**Revision loop** — a returned proposal goes back to the proponent; resubmission creates a new version under the same control number and routes back to whichever stage returned it. Prior versions are never deleted.

**Audit trail** — every submit, approve, return, reject, resubmit, and route action is logged with actor, role, comment, and timestamp.

## API Routes

| Route | Purpose |
|---|---|
| `GET/POST /api/proposals` | List (filtered by role/assignee) / create |
| `GET /api/proposals/[id]` | Full detail — versions + audit log |
| `POST /api/proposals/[id]/decision` | Drives all status transitions |
| `GET/PUT /api/routing-matrix` | Read/edit program-area → coordinator mapping |
| `GET/POST /api/users` | Mock user directory |
| `GET /api/proposals/[id]/audit-log` | Full action history |

## What's Mocked

- Authentication — fake login, no passwords or sessions
- Database — in-memory store seeded from JSON
- Final document — a styled read-only page, not a real PDF
- Signatures — none
- Notifications — in-app list only, no email/SMS
- QR verification — static placeholder block, doesn't resolve anywhere

## Roadmap (matching the original system design)

- **Phase 1 — Digital Workflow** *(this prototype)*: submission, control numbers, approval routing, notifications, status tracking, audit trail
- **Phase 2 — Document Automation**: real PDF generation, working QR verification, signed-document upload
- **Phase 3 — Management Information System**: turnaround-time analytics, program-area analytics, trend reports, integration with other SDO systems

---

*Based on the Curriculum Implementation Division Proposal Management and Approval System (CID-PMAS) concept document, Schools Division Office of Sorsogon.*
