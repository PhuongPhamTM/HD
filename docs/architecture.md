# Component architecture: presentational components and containers

UI components (`src/components/**`) only render what they are given. All app logic lives in a
**container layer** per feature (`src/features/<feature>/`). Pages render containers.

## Layers

| Layer                                     | Folder                                             | May do                                                                                                                                                           | Must not do                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atoms / molecules / organisms / templates | `src/components/**`                                | Render props; call callback props; keep **their own UI state** (open/closed, an input's draft text, hover, pagination of a list they were given, focus handling) | Read or write the store (`useHubStore`, `useOptions`, `useSheetSync`), call server actions (`@/app/actions/*`), use the router or URL (`useRouter`, `useSearchParams`, `usePathname`), `window.confirm`, `window.location`, dispatch or listen to app events, `fetch`, `localStorage`, import from `src/features/**` (except `import type`) |
| Controller hook                           | `src/features/<feature>/use<Feature>Controller.ts` | Everything above: store, server actions, router, URL params, confirmations, app events. Derives view models                                                      | Render JSX                                                                                                                                                                                                                                                                                                                                  |
| Container                                 | `src/features/<feature>/<Feature>Container.tsx`    | `const props = use<Feature>Controller(); return <FeatureView {...props} />` (may compose a few views/dialogs)                                                    | Contain markup/styling of its own beyond composition                                                                                                                                                                                                                                                                                        |
| Page                                      | `src/app/**/page.tsx`                              | Server-side reads (session, role) and rendering a container                                                                                                      | Render organisms that need app data directly                                                                                                                                                                                                                                                                                                |

Pure helpers that are not React (selectors, formatting, domain rules) stay in `src/lib/**` and may be
imported anywhere. Importing **types** from anywhere is fine.

## Conventions

- Views are named `<Feature>View` (or keep their existing organism name) and export a
  `<Feature>ViewProps` interface. The controller hook returns exactly that type.
- Callback props are named `on<Action>` (`onEditContent`, `onStatusChange`, `onRemoveUser`).
- Data props are plain values or view models, not the whole store.
- Confirmations: the view asks through a callback (`onDeleteRequest`), the controller decides
  (it may use `window.confirm` or keep state for a `ConfirmDialog` it passes back as props).
- Opening the content editor: containers call `openContentEditor(id)` / `openNewContentEditor()`
  from `src/features/content-editor/contentEditorEvents.ts`; views receive
  `onEditContent(id)` / `onCreateContent()`.

## Example

`src/features/calendar/`: `usePublishingCalendar.ts` (controller),
`PublishingCalendarContainer.tsx` (container), `calendar.types.ts` (view props), rendering
`src/components/organisms/publishing-calendar/PublishingCalendarView.tsx` (view).
