"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listUsers,
  removeUser,
  saveUser,
  type ManagedUser,
  type UserListResult,
} from "@/app/actions/users";
import type { UserDraft } from "@/components/organisms/UserDialog";
import type { UsersCardNotice, UsersCardProps } from "@/components/organisms/UsersCard";
import { generatePassword } from "@/lib/auth/password";

const EMPTY_DRAFT: UserDraft = { email: "", name: "", role: "editor", active: true, password: "" };

export function useUsersController(): UsersCardProps {
  const router = useRouter();
  const [userList, setUserList] = useState<UserListResult | null>(null);
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<UsersCardNotice | null>(null);
  /** Save errors are shown inside the dialog, next to the form. */
  const [dialogError, setDialogError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userPendingRemoval, setUserPendingRemoval] = useState<ManagedUser | null>(null);

  const refresh = useCallback(async () => setUserList(await listUsers()), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  function startAdding() {
    // With no admin anywhere yet, the first account has to be one.
    const hasAdmin =
      userList?.ok && userList.users.some((user) => user.role === "admin" && user.active);
    setEditingEmail(null);
    setDraft({ ...EMPTY_DRAFT, role: hasAdmin ? "editor" : "admin", password: generatePassword() });
    setDialogError("");
    setNotice(null);
  }

  function startEditing({ email, name, role, active }: ManagedUser) {
    setEditingEmail(email);
    setDraft({ email, name, role, active, password: "" });
    setDialogError("");
    setNotice(null);
  }

  async function submitDraft() {
    if (!draft) return;
    setIsSaving(true);
    setDialogError("");
    try {
      const result = await saveUser({ ...draft, password: draft.password || undefined });
      if (!result.ok) {
        setDialogError(result.message);
        return;
      }
      if (result.signInAgain) {
        window.location.assign("/logout?reason=inactive");
        return;
      }
      setNotice({
        tone: "green",
        text: draft.password
          ? `${result.message} Share the password with them securely; it is not shown again.`
          : result.message,
      });
      setDraft(null);
      await refresh();
      // Role or name changes of the signed-in admin show up in the shell.
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmRemoval() {
    const user = userPendingRemoval;
    if (!user) return;
    setUserPendingRemoval(null);
    const result = await removeUser(user.email);
    setNotice({ tone: result.ok ? "green" : "red", text: result.message });
    if (result.ok) await refresh();
  }

  return {
    userList,
    notice,
    draft,
    editingEmail,
    dialogError,
    isSaving,
    userPendingRemoval,
    onAddUser: startAdding,
    onEditUser: startEditing,
    onRemoveRequest: setUserPendingRemoval,
    onRemoveConfirm: () => void confirmRemoval(),
    onRemoveCancel: () => setUserPendingRemoval(null),
    onDraftChange: (patch) =>
      setDraft((currentDraft) => (currentDraft ? { ...currentDraft, ...patch } : currentDraft)),
    onDraftSubmit: () => void submitDraft(),
    onDialogClose: () => setDraft(null),
  };
}
