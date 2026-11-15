"use client";
import { Button, Tag } from "@/components/atoms/ui";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/molecules/ui";
import type { ManagedUser, UserListResult } from "@/app/actions/users";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { UserDialog, type UserDraft } from "./UserDialog";

export interface UsersCardNotice {
  tone: "green" | "red";
  text: string;
}

export interface UsersCardProps {
  /** `null` while loading. */
  userList: UserListResult | null;
  notice: UsersCardNotice | null;
  /** The add/edit dialog is open while there is a draft. */
  draft: UserDraft | null;
  editingEmail: string | null;
  /** Save errors are shown inside the dialog, next to the form. */
  dialogError: string;
  isSaving: boolean;
  userPendingRemoval: ManagedUser | null;
  onAddUser(): void;
  onEditUser(user: ManagedUser): void;
  onRemoveRequest(user: ManagedUser): void;
  onRemoveConfirm(): void;
  onRemoveCancel(): void;
  onDraftChange(patch: Partial<UserDraft>): void;
  onDraftSubmit(): void;
  onDialogClose(): void;
}

export function UsersCard({
  userList,
  notice,
  draft,
  editingEmail,
  dialogError,
  isSaving,
  userPendingRemoval,
  onAddUser,
  onEditUser,
  onRemoveRequest,
  onRemoveConfirm,
  onRemoveCancel,
  onDraftChange,
  onDraftSubmit,
  onDialogClose,
}: UsersCardProps) {
  return (
    <Card className="users-card">
      <CardHeader
        title="Users"
        subtitle="Who can sign in to the dashboard"
        action={
          userList?.ok && userList.canManage ? (
            <Button variant="primary" onClick={onAddUser}>
              ＋ Add user
            </Button>
          ) : undefined
        }
      />
      <CardBody>
        {notice && (
          <p
            role="status"
            className={`mt-0 rounded-ctl p-3 text-[11px] ${notice.tone === "green" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
          >
            {notice.text}
          </p>
        )}
        {!userList && <p className="m-0 text-[11px] text-muted">Loading users…</p>}
        {userList && !userList.ok && (
          <p className="m-0 text-[11px] text-danger">{userList.message}</p>
        )}
        {userList?.ok && (
          <>
            <p className="mt-0 text-[11px] text-muted">
              <strong>Root admins</strong> come from <code>HUB_USERS</code> in the server
              environment: they always can sign in and are not stored in the Sheet. Everyone else is
              saved in the Users tab of the Google Sheet.
              {!userList.canManage &&
                " Connect Google Sheets and run “Set up Sheet” to add users here."}
            </p>
            {userList.users.length === 0 && (
              <EmptyState
                title="No users yet"
                body="Add a root admin to HUB_USERS, or add the first admin here."
              />
            )}
            {userList.users.length > 0 && (
              <ul className="users-card__list m-0 grid list-none divide-y divide-line p-0">
                {userList.users.map((user) => (
                  <li key={user.email} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold">
                        {user.name}
                        {user.email === userList.currentEmail && (
                          <span className="ml-1 font-normal text-muted">(you)</span>
                        )}
                      </div>
                      <div className="truncate text-[10.5px] text-muted">{user.email}</div>
                    </div>
                    <Tag tone={user.root ? "amber" : user.role === "admin" ? "violet" : "blue"}>
                      {user.root ? "root admin" : user.role}
                    </Tag>
                    {!user.active && <Tag tone="gray">inactive</Tag>}
                    {user.root ? (
                      <span
                        className="w-[52px] text-center text-[10px] text-faint"
                        title="Managed in HUB_USERS on the server"
                      >
                        env
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        <Button onClick={() => onEditUser(user)}>Edit</Button>
                        {/* Admins (and yourself) cannot be removed; demote to editor first. */}
                        {user.role !== "admin" && user.email !== userList.currentEmail && (
                          <Button
                            variant="danger"
                            onClick={() => onRemoveRequest(user)}
                            aria-label={`Remove ${user.name}`}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
      <ConfirmDialog
        open={userPendingRemoval !== null}
        title="Remove user?"
        description={
          userPendingRemoval && (
            <>
              <strong>{userPendingRemoval.name}</strong> ({userPendingRemoval.email}) will be
              deleted from the Users tab and can no longer sign in. Their open sessions end within
              30 seconds. To keep their account but block access, deactivate it instead.
            </>
          )
        }
        confirmLabel="Remove user"
        tone="danger"
        onConfirm={onRemoveConfirm}
        onCancel={onRemoveCancel}
      />
      <UserDialog
        draft={draft}
        editingEmail={editingEmail}
        error={dialogError}
        isSaving={isSaving}
        onChange={onDraftChange}
        onSubmit={onDraftSubmit}
        onClose={onDialogClose}
      />
    </Card>
  );
}
