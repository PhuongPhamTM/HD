# Plan: Handong Content Hub in Next.js

Rebuild the single-file template `handong-content-studio-2026-jan-oct.html` as a Next.js dashboard app. It uses Tailwind CSS, a light atomic-design structure, semantic class names and a login page in the same style as the template. **The UI is in English** (the template is in Vietnamese). See section 6.

---

## 1. What the template contains

| Area          | In the template                                                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Look**      | CSS variables for light and dark themes (`--bg`, `--card`, `--ink`, `--muted`, `--faint`, `--line`, `--soft`, `--brand #123985`, `--accent`, plus green, amber, red and violet with "soft" versions). Base font is 13px Segoe UI/system-ui, corners are 9px on inputs and 14px on cards. |
| **Shell**     | Fixed 236px sidebar (logo, "＋ Nội dung mới" button, nav with count badges, sync-status footer). Sticky 58px topbar (breadcrumb, mode tag, Sheet sync, theme toggle, create button). Content area up to 1500px wide.                                                                     |
| **Views**     | Tổng quan, Kế hoạch nội dung (table/board), Sản xuất & duyệt, Campaigns, Thư viện thành phẩm, Lịch quay & đăng (week/month, publishing/shooting), Báo cáo, Cài đặt & kết nối                                                                                                             |
| **Data**      | `campaigns`, `content`, `media`, `publications`, `activity`. Status values in `stages` are grouped into 6 phases (`PHASES`), plus `channels`, `pubstates` and the 6 `checkNames`.                                                                                                        |
| **Logic**     | Pure functions you can port as-is: `overdue`, `waiting`, `pubLate`, `readiness`, `phaseOf`, `stats`, `reportData`, the Vietnam-timezone date helpers (`parseVN`, `vnDay`, `rel`, `relTime`), and CSV export                                                                              |
| **Storage**   | localStorage plus an optional Google Apps Script sync. There is no login today.                                                                                                                                                                                                          |
| **Seed data** | `<script id="trackerImport">` holds 3 campaigns, 106 content items and 262 publications (Jan–Oct 2026)                                                                                                                                                                                   |

---

## 2. Stack

- **Next.js 16** (App Router, TypeScript, `src/`). In v16 route protection goes in `proxy.ts`, which replaces `middleware.ts`.
- **Tailwind CSS v4**, with the theme tokens set in CSS through `@theme`
- **next-themes** for dark mode (puts a `.dark` class on `<html>`)
- **Zustand + persist** for the client-side data store, which matches the template's localStorage behaviour in phase 1
- **jose** for a signed httpOnly session cookie (login) and **bcryptjs** for password hashes
- **clsx + tailwind-merge** through a `cn()` helper
- **Vitest** for the ported domain logic
- No chart library: the template draws its trend charts and sparklines by hand in SVG, so they stay as small SVG components
- No component kit: the native `<dialog>` and native drag-and-drop are enough, same as the template

---

## 3. Theme tokens (`src/app/globals.css`)

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --bg: #f5f7fb;
  --card: #fff;
  --ink: #16243d;
  --muted: #66758c;
  --faint: #93a0b4;
  --line: #e3e8f1;
  --soft: #f3f6fb;
  --brand: #123985;
  --brand-text: #123985;
  --brand-soft: #e9effb;
  --accent: #2f62c9;
  --green: #1c7c5f;
  --green-soft: #e3f4ed;
  --amber: #96600c;
  --amber-soft: #fdf0d6;
  --red: #b93a43;
  --red-soft: #fce9ea;
  --violet: #6a4bb0;
  --violet-soft: #efe9fb;
}
.dark {
  --bg: #0f1826;
  --card: #18243a;
  --ink: #e6edf9;
  --muted: #a3b2c9;
  --faint: #7d8ea8;
  --line: #2c3c56;
  --soft: #1e2c45;
  --brand: #2a56b3;
  --brand-text: #a9c4ff;
  --brand-soft: #22355a;
  --accent: #7ea6f5;
  --green: #7fd8b8;
  --green-soft: #1b3d36;
  --amber: #f0c77c;
  --amber-soft: #453a22;
  --red: #ff9aa4;
  --red-soft: #472a35;
  --violet: #c3adf5;
  --violet-soft: #34295a;
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-faint: var(--faint);
  --color-line: var(--line);
  --color-soft: var(--soft);
  --color-brand: var(--brand);
  --color-brand-text: var(--brand-text);
  --color-brand-soft: var(--brand-soft);
  --color-accent: var(--accent);
  --color-success: var(--green);
  --color-success-soft: var(--green-soft);
  --color-warning: var(--amber);
  --color-warning-soft: var(--amber-soft);
  --color-danger: var(--red);
  --color-danger-soft: var(--red-soft);
  --color-violet: var(--violet);
  --color-violet-soft: var(--violet-soft);
  --radius-ctl: 9px;
  --radius-card: 14px;
  --radius-lane: 12px;
  --font-sans: "Segoe UI", system-ui, Arial, sans-serif;
}

body {
  @apply bg-bg text-ink text-[13px] leading-normal font-sans;
}
:focus-visible {
  @apply outline-2 outline-offset-2 outline-accent;
}
```

This gives you utilities like `bg-card`, `border-line`, `text-brand-text` and `rounded-card`. Each one reads the CSS variable, so dark mode works without adding `dark:` prefixes everywhere.

---

## 4. Naming convention

Every component's root element, and each meaningful part inside it, gets **one semantic class** written in BEM style. That class carries **no styles**. It's there for readability, DevTools, tests and analytics. Tailwind does all the styling.

```tsx
const toneBorder = {
  danger: "border-l-danger  [&_.stat-tile__value]:text-danger",
  warning: "border-l-[#d79a2b] [&_.stat-tile__value]:text-warning",
  ok: "[&_.stat-tile__value]:text-faint",
};

export function StatTile({ label, value, cta, tone = "ok", className }: StatTileProps) {
  return (
    <article
      className={cn(
        "stat-tile grid gap-0.5 rounded-card border border-line border-l-4 bg-card px-4 py-3.5 text-left",
        toneBorder[tone],
        className,
      )}
    >
      <span className="stat-tile__label text-[11.5px] text-muted">{label}</span>
      <strong className="stat-tile__value text-[28px] font-semibold leading-tight tabular-nums">
        {value}
      </strong>
      <span className="stat-tile__link text-[11px] text-brand-text">{cta}</span>
    </article>
  );
}
```

Rules:

- Root: `block-name` (kebab-case, matches the component name: `StatTile` → `stat-tile`)
- Parts: `block-name__part`
- State/variant: `block-name--variant` (only when it helps debugging, e.g. `ticket--late`)
- Variants come from a plain object lookup in the same file. No `cva`.

---

## 5. Folder structure (atomic, kept shallow)

```
src/
├─ app/
│  ├─ (auth)/
│  │  ├─ layout.tsx                    # AuthShell
│  │  └─ login/page.tsx
│  ├─ (dashboard)/
│  │  ├─ layout.tsx                    # DashboardShell
│  │  ├─ page.tsx                      # Tổng quan
│  │  ├─ content/page.tsx              # ?view=table|board&phase=&campaign=&owner=&q=
│  │  ├─ production/page.tsx
│  │  ├─ campaigns/page.tsx
│  │  ├─ media/page.tsx
│  │  ├─ calendar/page.tsx             # ?scope=publishing|shooting&mode=week|month
│  │  ├─ reports/page.tsx
│  │  └─ settings/page.tsx
│  ├─ actions/auth.ts                  # login / logout server actions
│  ├─ layout.tsx                       # <html lang="en">, ThemeProvider
│  └─ globals.css
├─ components/
│  ├─ atoms/
│  │  Button, Input, Select, Textarea, Checkbox, Tag, Avatar, ProgressBar,
│  │  CountBadge, Swatch, BrandMark, Sparkline
│  ├─ molecules/
│  │  FormField, ProgressFraction, DueLabel, PersonChip, StatTile, MetricCard,
│  │  FilterChip, SegmentedControl, SearchField, NavItem, Breadcrumb,
│  │  Card (+CardHeader/CardBody), ActivityItem, CalendarEvent, ContentThumb,
│  │  MediaCover, Legend, Toast
│  ├─ organisms/
│  │  Sidebar, Topbar, PageHeader, FilterChipBar, ContentToolbar, ContentTable,
│  │  KanbanBoard (Lane, Ticket), PipelineFlow, WeekStrip, MonthCalendar,
│  │  CampaignList, MediaGrid, QueuePanel, TrendChart, ChannelBreakdown,
│  │  ActivityFeed, EntityDialog, LoginForm
│  └─ templates/
│     DashboardShell, AuthShell
├─ lib/
│  ├─ domain/
│  │  types.ts        # Campaign, Content, Media, Publication, Activity
│  │  constants.ts    # stages, PHASES, channels, pubstates, checkNames, navs (English labels)
│  │  legacy-map.ts   # Vietnamese status values → English enum keys (used on import)
│  │  selectors.ts    # overdue, waiting, pubLate, readiness, phaseOf, stats, contentPubs
│  │  dates.ts        # parseVN, vnDay, dayAdd, rel, relTime (Asia/Ho_Chi_Minh, en-US formats)
│  │  reports.ts      # reportData, delta
│  │  csv.ts          # planCSV, reportCSV
│  ├─ store/useHubStore.ts             # Zustand + persist, mutations + activity log
│  ├─ auth/session.ts                  # jose sign / verify, cookie helpers
│  ├─ auth/users.ts                    # users from env
│  └─ cn.ts
├─ data/tracker-2026-jan-oct.json      # extracted from <script id="trackerImport">
└─ proxy.ts                            # sends unauthenticated users to /login
```

**Where things go:**

| Layer         | Rule                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **Atoms**     | No domain knowledge. Pure UI with variants.                             |
| **Molecules** | Combine atoms. Get data through props, never from the store.            |
| **Organisms** | Can read the store and the domain selectors. One per page section.      |
| **Templates** | Page frames (shell, auth layout). No data.                              |
| **Pages**     | Compose organisms and read `searchParams`. As little logic as possible. |

### How template classes map to components

| Template class                            | Component                     | Layer    |
| ----------------------------------------- | ----------------------------- | -------- |
| `button`, `.primary`, `.ghost`, `.danger` | `Button` (variant)            | atom     |
| `.tag.green/orange/red/blue/violet`       | `Tag` (tone)                  | atom     |
| `.av` (hue from name hash)                | `Avatar`                      | atom     |
| `.bar`                                    | `ProgressBar`                 | atom     |
| `.count`, `.navcount`                     | `CountBadge`                  | atom     |
| `.symbol`                                 | `BrandMark`                   | atom     |
| `.spark`                                  | `Sparkline`                   | atom     |
| `.field`                                  | `FormField`                   | molecule |
| `.frac`                                   | `ProgressFraction`            | molecule |
| `.due`                                    | `DueLabel`                    | molecule |
| `.tile`                                   | `StatTile`                    | molecule |
| `.metric`                                 | `MetricCard`                  | molecule |
| `.chip`                                   | `FilterChip`                  | molecule |
| `.seg`                                    | `SegmentedControl`            | molecule |
| `.card` / `.cardhead` / `.cardbody`       | `Card`                        | molecule |
| `.act`                                    | `ActivityItem`                | molecule |
| `.ev`                                     | `CalendarEvent`               | molecule |
| `.mini` / `.cover`                        | `ContentThumb` / `MediaCover` | molecule |
| `.sidebar` / `.topbar`                    | `Sidebar` / `Topbar`          | organism |
| `.pagehead`                               | `PageHeader`                  | organism |
| `table` in content view                   | `ContentTable`                | organism |
| `.kanban` / `.lane` / `.ticket`           | `KanbanBoard`                 | organism |
| `.flow`                                   | `PipelineFlow`                | organism |
| `.week` / `.calendar`                     | `WeekStrip` / `MonthCalendar` | organism |
| `.camprow`                                | `CampaignList`                | organism |
| `.queues` / `.qitem`                      | `QueuePanel`                  | organism |
| `.chartsvg`                               | `TrendChart`                  | organism |
| `dialog#modal`                            | `EntityDialog`                | organism |

---

## 6. UI language: English

The template's UI and data are in Vietnamese. The new app shows everything in English.

**Approach (no i18n library)**

- All UI text is written in English directly in components. Shared labels (nav, statuses, phases, channels, checklist items) live in `lib/domain/constants.ts`.
- Statuses are stored as **English enum keys** (`"idea"`, `"in_review"`, `"published"`…), not display text. The label comes from a lookup, so wording can change without touching data.
- `lib/domain/legacy-map.ts` converts the Vietnamese values in the seed JSON and in Google Sheet pulls into these keys. Push to Sheet converts back, so the existing Sheet keeps working.
- User-entered content (titles, captions, owners, locations, hashtags) stays as written. It is not translated.
- Dates and numbers use `en-US` formats (e.g. "Nov 14", "2 days overdue", "3 hours ago"). The timezone stays `Asia/Ho_Chi_Minh`.
- `<html lang="en">`, and CSV export headers are in English.

**Navigation**

| Route         | Template label      | English label            |
| ------------- | ------------------- | ------------------------ |
| `/`           | Tổng quan           | Overview                 |
| `/content`    | Kế hoạch nội dung   | Content Plan             |
| `/production` | Sản xuất & duyệt    | Production & Review      |
| `/campaigns`  | Campaigns           | Campaigns                |
| `/media`      | Thư viện thành phẩm | Asset Library            |
| `/calendar`   | Lịch quay & đăng    | Shoot & Publish Calendar |
| `/reports`    | Báo cáo             | Reports                  |
| `/settings`   | Cài đặt & kết nối   | Settings & Integrations  |

**Content statuses → phases**

| Key              | Vietnamese (legacy) | English label  | Phase               |
| ---------------- | ------------------- | -------------- | ------------------- |
| `idea`           | Ý tưởng             | Idea           | Idea                |
| `writing`        | Đang viết           | Writing        | Script              |
| `ready_to_shoot` | Sẵn sàng quay       | Ready to shoot | Shoot               |
| `shot`           | Đã quay             | Shot           | Edit                |
| `editing`        | Đang dựng           | Editing        | Edit                |
| `needs_changes`  | Cần chỉnh sửa       | Needs changes  | Edit                |
| `in_review`      | Chờ duyệt           | In review      | Review              |
| `approved`       | Đã duyệt            | Approved       | Publish             |
| `published`      | Đã xuất bản         | Published      | Publish             |
| `paused`         | Tạm dừng            | Paused         | (hidden from board) |
| `cancelled`      | Hủy                 | Cancelled      | (hidden from board) |

**Publication statuses:** Dự kiến → Planned, Đã lên lịch → Scheduled, Đã đăng → Posted, Đăng lỗi → Failed, Hủy → Cancelled. Derived filter "Trễ lịch" → Late.

**Checklist:** Script locked, Shot, Edit approved, Cover ready, Caption locked, Scheduled.

**Asset approval:** Chờ duyệt → In review, Đã duyệt → Approved. Derived filter "Sẵn sàng, chưa có lịch" → Ready, not scheduled.

---

## 7. Login page

**Layout**

- Split screen. The left panel uses the template's cover gradient (`linear-gradient(130deg,#123985,#3a6aa8)`) with the "H" `BrandMark`, "Handong / CONTENT HUB" and a short tagline.
- The right side is a centered `bg-card rounded-card border border-line` form:
  - Email and password fields (`FormField`, styled like the template's `.field`)
  - "Remember me" checkbox
  - Full-width primary `Button`
  - Error message styled like the template's `.notice`
- On mobile the gradient panel collapses into a compact header.
- Respects the same light/dark setting and has a theme toggle in the corner.

**How it works**

1. The `login` server action checks the credentials against users from env (bcrypt hashes).
2. On success it sets a session cookie signed with `jose` (httpOnly, `sameSite=lax`, 7 days) and redirects to `/` or `?next=`.
3. `proxy.ts` checks the cookie on every route except `/login` and static assets.
4. The topbar gets a user avatar menu with sign-out (server action `logout` clears the cookie).

**Semantic classes:** `auth-shell`, `auth-shell__brand-panel`, `auth-shell__form-panel`, `login-form`, `login-form__title`, `login-form__error`, `login-form__submit`

---

## 8. Build phases

| #   | Phase                   | Output                                                                                                                                                                                                                                                               | Time       |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **Scaffold**            | Run `create-next-app`. Add the Tailwind v4 tokens, next-themes and `cn()`. Build a `/styleguide` page to check the colours against the template.                                                                                                                     | ½ day      |
| 2   | **Domain port**         | Pull the JSON snapshot out into `data/` and convert its Vietnamese status values to English keys with `legacy-map.ts`. Write the TypeScript types and port the selectors, date helpers and reports. Add Vitest tests for the date, overdue and legacy-mapping logic. | 1 day      |
| 3   | **Atoms and molecules** | All components on the styleguide page, checked in both themes                                                                                                                                                                                                        | 1–1.5 days |
| 4   | **Shell and auth**      | DashboardShell (Sidebar with live counts, Topbar, theme toggle), the login page, session handling and `proxy.ts`                                                                                                                                                     | 1 day      |
| 5   | **Views**               | Overview → Content Plan (table, then board with drag-and-drop) → Production & Review → Campaigns → Asset Library → Calendar → Reports                                                                                                                                | 4–5 days   |
| 6   | **Editing**             | EntityDialog for content, campaigns, media and publications. Status changes, activity log, toasts.                                                                                                                                                                   | 1–1.5 days |
| 7   | **Settings**            | JSON import/export, backup restore, CSV export, Apps Script URL and push/pull (reusing the template's GAS code)                                                                                                                                                      | 1 day      |
| 8   | **Polish**              | Responsive breakpoints at 1180px and 760px, print styles, accessibility (focus rings, `aria-pressed`, keyboard support on the board), empty states                                                                                                                   | 1 day      |

**Total: roughly 11–13 working days.**

### Definition of done for each view

- Matches the template's layout and spacing in light and dark mode
- Filters live in the URL (`searchParams`), so links can be shared and Back works
- Every component's root has a semantic class
- Empty and loading states are handled
- Works at 1180px and 760px

---

## 9. Decisions

**Decided**

- **Language:** English UI (see section 6).

**Open (default in bold)**

1. **Login:** **email and password checked against users in env**, or Google sign-in through Auth.js (fits well since the team already uses Google Sheets)?
2. **Where data lives:** **in the browser (localStorage) plus Google Sheet sync like now**, or a shared database (Postgres + Drizzle) so the whole team sees the same data?
3. **Roles:** **everyone can see and edit everything**, or a separate approver role for "In review → Approved"?
