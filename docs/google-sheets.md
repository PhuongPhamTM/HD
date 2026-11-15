# Google Sheets data store

The Content Hub stores its data in one Google Sheet. The Next.js server reads and writes that Sheet
with a Google **service account** (a robot Google account). Browsers never see the Google credentials.

## One-time setup

1. **Create a Google Cloud project** at https://console.cloud.google.com (or reuse one).
2. **Enable the Google Sheets API**: _APIs & Services → Library → Google Sheets API → Enable_.
3. **Create a service account**: _APIs & Services → Credentials → Create credentials → Service
   account_. It does not need any project roles.
4. **Create a key for it**: open the service account → _Keys → Add key → Create new key → JSON_.
   A `.json` file downloads. Treat it like a password.
5. **Create the Sheet** in Google Drive (an empty spreadsheet is fine) and copy its id from the URL:
   `https://docs.google.com/spreadsheets/d/<THIS PART>/edit`.
6. **Share the Sheet** with the service account's `client_email` (from the JSON file) as **Editor**.
7. **Add three variables** to `.env.local` (and to your hosting provider's environment):

   ```bash
   GOOGLE_SHEETS_ID=1AbC...xyz
   GOOGLE_SERVICE_ACCOUNT_EMAIL=content-hub@your-project.iam.gserviceaccount.com
   # The "private_key" value from the JSON file, on one line, keeping the \n sequences:
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

8. Restart the app, sign in and open **Settings → Google Sheets → Set up Sheet**. This creates the
   tabs, formats them and copies the data in your browser into the empty tabs.

## Tabs

| Tab              | One row per      | Notes                                                              |
| ---------------- | ---------------- | ------------------------------------------------------------------ |
| **Campaigns**    | campaign         |                                                                    |
| **Content**      | content item     | `campaign` holds a Campaigns `id`. `checks` lists done check keys. |
| **Media**        | asset            | `content` holds a Content `id`.                                    |
| **Publications** | scheduled/posted | `content` holds a Content `id`. `channel` is the channel name.     |
| **Activity**     | log entry        | Append-only; the app writes the signed-in user as `actor`.         |
| **Options**      | dropdown choice  | See below.                                                         |

- Row 1 is the header. Columns are matched **by name**, so you can reorder them or add your own
  columns (the app ignores columns it does not know).
- Every record needs a unique `id`. Rows with an empty `id` are ignored.
- Cells are formatted as plain text. Write dates as `2026-11-15` and times as `14:30`.
- `extra` holds imported fields that have no column of their own (JSON). Leave it alone.
- `status` cells have a dropdown of the valid keys.

## Options tab

Columns: `group`, `key`, `label`, `order`, `active`, `stages`.

| group                | What you can do                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `channel`            | Add, rename, reorder or deactivate freely. The `label` is what gets stored.                |
| `check`              | Add, rename, reorder or deactivate freely. Keep `key` the same when renaming.              |
| `phase`              | Board lanes. `stages` is a comma-separated list of stage keys (at least one).              |
| `stage`              | Relabel, reorder or deactivate only. New keys are ignored (the app has no logic for them). |
| `publication_status` | Same as `stage`.                                                                           |

- To remove an option, set `active` to `FALSE` instead of deleting the row. Records that already use
  it keep their label, and it disappears from the pickers.
- A group with no rows falls back to the built-in defaults in `src/lib/domain/constants.ts`.

## Users and sign-in

There are two kinds of accounts, and both can sign in at the same time:

- **Root admins** are listed in `HUB_USERS` in the server environment. They are always admins,
  always work (even when the Sheet is unreachable) and are never stored in the Sheet. They show in
  Settings → Users as read-only "root admin" rows; change them in the environment and restart.
- **Users** live in the **Users** tab (`email`, `name`, `passwordHash`, `role`, `active`, `createdAt`,
  `updatedAt`). Admins add and edit them in **Settings → Users**; nobody needs to touch the tab or
  generate hashes by hand.

Details:

- **Roles:** `admin` manages users and can set up, replace or reset the Sheet's data. `editor` works on
  content only.
- **No accounts at all** (empty `HUB_USERS` and no Users rows) means nobody can sign in. There is no
  built-in demo account.
- A Users-tab row that reuses a root admin's email is ignored; the root admin wins.
- **Deactivating** a user (or changing their role) takes effect within 30 seconds, even for sessions
  that are already open. There must always be at least one active admin (root admins count).
- **Who can grant access:** anyone who can edit the Sheet can edit the Users tab, so share the
  Sheet only with people you would trust as admins. Root admins cannot be changed from the Sheet.

## What stays in the environment

`SESSION_SECRET` (signs login cookies; anyone who has it could forge a login) and the three
`GOOGLE_*` values (needed to open the Sheet in the first place). `HUB_USERS` holds the root admins.

## How syncing works

- The app loads the Sheet when you sign in, and again when you return to the browser tab after 30s.
  Edits made directly in the Sheet show up then (or via **Reload from Sheet**).
- Each change in the app writes only the affected rows, straight away. If a write fails, the app shows
  an error in the sidebar and reloads the Sheet so the screen matches what is stored.
- Two people editing the **same record** at the same moment: the last save wins.
- Google limits the API to about 60 requests per minute per user. Normal use is far below this.
