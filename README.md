# dp-mas-Deped-Proposal

**Curriculum Implementation Division Proposal Management and Approval System (DP-MAS)** for DepEd Schools Division Office of Sorsogon.

A full-featured workflow prototype built with Next.js App Router, Mantine UI v7, Tailwind CSS, TanStack Query, and Zustand.

---

## 🚀 Features

- **8 Distinct Roles & Access**: Proponent, Principal, PSDS, Coordinator/EPS, CID Chief, ASDS, SDS, and Admin.
- **Workflow & Approval Chains**:
  - `TEACHER`: Principal → PSDS → Coordinator/EPS → CID Chief → ASDS → SDS
  - `SCHOOL_HEAD`: PSDS → Coordinator/EPS → CID Chief → ASDS → SDS
  - `DISTRICT`: PSDS → Coordinator/EPS → CID Chief → ASDS → SDS
- **Completeness Check Gate**: Blocks submission when required fields (Sections A–I) are missing.
- **Automatic SDO Routing**: Resolves EPS assignment dynamically using a configurable routing matrix.
- **Revision Loop & Versioning**: Return for revision creates new version on resubmission while preserving prior version history.
- **Audit Trail**: Every action (submit, approve, return, reject, resubmit, finalize) is logged with actor, role, comment, and timestamp.
- **Shared Reviewer Queue**: One unified queue page taking the user's role and server-side filtering pending proposals.
- **Management Dashboard**: Visual aggregate metrics, stage distribution, and program area breakdown.
- **Official Final Document**: Formatted read-only proposal sheet with DepEd header, QR placeholder, and approval metadata.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Components**: [Mantine UI v7](https://mantine.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [@tabler/icons-react](https://tabler.io/icons)
- **Data Fetching**: [@tanstack/react-query](https://tanstack.com/query)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) (with cookie persistence for quick role switching)
- **Mock Store**: In-memory store seeded from JSON with Drizzle-ready schema layout

---

## 💻 Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run the development server:**
   ```bash
   pnpm dev
   ```

3. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) and pick any role from the mock login page to test their workflow.
