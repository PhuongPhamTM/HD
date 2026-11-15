"use client";
import { useEffect, useRef } from "react";
import { Button, Checkbox, Input, Select } from "@/components/atoms/ui";
import { FormField } from "@/components/molecules/ui";
import { generatePassword } from "@/lib/auth/password";
import { USER_ROLES, type UserRole } from "@/lib/auth/roles";

export interface UserDraft {
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  password: string;
}

/** Modal form for adding a user or editing one (`editingEmail` set). */
export function UserDialog({
  draft,
  editingEmail,
  error,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}: {
  /** The dialog is open while there is a draft. */
  draft: UserDraft | null;
  editingEmail: string | null;
  error: string;
  isSaving: boolean;
  onChange(patch: Partial<UserDraft>): void;
  onSubmit(): void;
  onClose(): void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = draft !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const close = () => {
    if (!isSaving) onClose();
  };
  const title = editingEmail ? "Edit user" : "Add user";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="user-dialog-title"
      // Escape or a click on the backdrop closes it (not while saving).
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="user-dialog m-auto w-[min(560px,calc(100%-28px))] rounded-card border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-[#071120]/55"
    >
      {draft && (
        <form
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            onSubmit();
          }}
        >
          <div className="user-dialog__header flex items-start justify-between border-b border-line px-6 py-4">
            <div>
              <h2 id="user-dialog-title" className="m-0 text-lg font-semibold">
                {title}
              </h2>
              <p className="mb-0 mt-1 text-[11px] text-muted">
                {editingEmail
                  ? editingEmail
                  : "They can sign in as soon as you add them. Share the password securely."}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mr-2 grid size-8 place-items-center rounded-full text-lg text-muted hover:bg-soft hover:text-ink"
            >
              ×
            </button>
          </div>

          <div className="user-dialog__body grid grid-cols-2 gap-4 px-6 py-5 max-[560px]:grid-cols-1">
            {error && (
              <p
                role="alert"
                className="col-span-full m-0 rounded-ctl bg-danger-soft px-3 py-2 text-[11px] text-danger"
              >
                {error}
              </p>
            )}
            <FormField label="Email">
              <Input
                type="email"
                required
                autoFocus={!editingEmail}
                value={draft.email}
                readOnly={Boolean(editingEmail)}
                onChange={(inputEvent) => onChange({ email: inputEvent.target.value })}
              />
            </FormField>
            <FormField label="Name">
              <Input
                required
                autoFocus={Boolean(editingEmail)}
                value={draft.name}
                onChange={(inputEvent) => onChange({ name: inputEvent.target.value })}
              />
            </FormField>
            <FormField label="Role" hint="Admins manage users and can replace the Sheet's data.">
              <Select
                className="w-full"
                value={draft.role}
                onChange={(selectEvent) => onChange({ role: selectEvent.target.value as UserRole })}
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role === "admin" ? "Admin" : "Editor"}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label={editingEmail ? "New password" : "Password"}
              hint={
                editingEmail
                  ? "Leave empty to keep the current password."
                  : "At least 8 characters."
              }
            >
              <div className="flex gap-2">
                <Input
                  type="text"
                  autoComplete="new-password"
                  spellCheck={false}
                  required={!editingEmail}
                  minLength={8}
                  value={draft.password}
                  onChange={(inputEvent) => onChange({ password: inputEvent.target.value })}
                />
                <Button type="button" onClick={() => onChange({ password: generatePassword() })}>
                  Generate
                </Button>
              </div>
            </FormField>
            <div className="col-span-full">
              <Checkbox
                label="Active (can sign in)"
                checked={draft.active}
                onChange={(checkboxEvent) => onChange({ active: checkboxEvent.target.checked })}
              />
            </div>
          </div>

          <div className="user-dialog__footer flex justify-end gap-2 border-t border-line px-6 py-4">
            <Button type="button" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving…" : editingEmail ? "Save changes" : "Add user"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
