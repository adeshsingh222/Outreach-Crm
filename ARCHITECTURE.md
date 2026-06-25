# OutreachCRM Architecture Plan

## Tech Stack Alignment
*Note: To align perfectly with the AI Studio environment and its required routing/build constraints, the application uses a React + Vite SPA with an Express backend, rather than Next.js. This guarantees stability and Hot-Module-like speed in this workspace while retaining the exact same full-stack capabilities, clean architecture, and requested feature set.*

- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui, Recharts, Zustand, React Hook Form, TanStack Table
- **Backend:** Express.js, TypeScript, Prisma ORM
- **Database:** SQLite (local development)

## Folder Structure
```text
/
├── prisma/
│   ├── schema.prisma       # Database schema definition (Created)
│   └── dev.db              # SQLite database (Will be generated)
├── src/
│   ├── api/                # Express API Routes (Backend)
│   │   ├── routes/         # API endpoint definitions (companies, activities, etc.)
│   │   └── services/       # Business logic and Prisma access
│   ├── components/         # Reusable React Components
│   │   ├── ui/             # Generic shadcn/ui components
│   │   ├── layout/         # Sidebar, Topbar, AppShell
│   │   └── shared/         # Common app-specific components
│   ├── features/           # Feature-based Frontend Modules
│   │   ├── dashboard/      # Dashboard charts and metrics
│   │   ├── companies/      # TanStack Table, company details
│   │   ├── import/         # PapaParse CSV logic
│   │   └── resumes/        # Resume management
│   ├── lib/                # Utilities and shared configurations
│   │   ├── utils.ts        # Tailwind cn() helper
│   │   ├── prisma.ts       # Prisma client instance (Server-side)
│   │   └── store.ts        # Zustand global state
│   ├── App.tsx             # Main React Router setup
│   └── main.tsx            # React entry point
├── server.ts               # Express Server Entry Point (combines API and Vite middleware)
├── package.json
└── vite.config.ts
```

## Routing Plan

### Frontend Routes (React Router)
- `/` : Dashboard (Metrics, Funnel Charts, Follow-up Reminders, Timeline)
- `/companies` : Companies Table (Search, Sort, Filter, Pagination)
- `/companies/:id` : Company Details (Info, Timeline, Notes, Documents)
- `/import` : CSV Import Page (Column mapping, Outscraper support, PapaParse)
- `/resumes` : Resume Management

### Backend API Routes (Express)
- `GET /api/companies` : List companies with pagination and filters
- `POST /api/companies` : Create a new company
- `POST /api/companies/import` : Batch import companies (Handles Outscraper mapping & deduplication)
- `GET /api/companies/:id` : Get company details with relations
- `PATCH /api/companies/:id` : Update company status/priority
- `POST /api/companies/:id/notes` : Add a markdown-supported note
- `POST /api/companies/:id/activities` : Add an activity timeline entry
- `GET /api/dashboard/stats` : Get aggregated metrics (Funnel, Conversions, Chart data)
- `GET /api/reminders` : Get due/overdue follow-ups based on `nextFollowUp` date
- `GET /api/resumes` : List stored resumes

## Key Architectural Decisions
1. **Data Layer (Prisma + SQLite):** Strongly typed database access. The schema supports complex relations (Companies -> Notes, Activities, Tags, Documents) required by the CRM.
2. **API Layer (Express):** RESTful endpoints handling validation, business logic, and database operations. Prevents exposing database logic to the client.
3. **State Management (Zustand):** Zustand for local UI state (e.g., sidebar toggle, theme).
4. **UI Layer (shadcn/ui + Tailwind):** Component-driven, accessible, and responsive interfaces following the provided visual reference.
5. **Feature Modules:** Logic is split by feature (`dashboard`, `companies`, etc.) to keep the codebase highly scalable, maintainable, and avoid bloated components.
