"use client";

import { SettingsPanel } from "@/components/organisms/SettingsPanel";
import { UsersContainer } from "./UsersContainer";
import { useSettingsController } from "./useSettingsController";

export function SettingsContainer({ isAdmin }: { isAdmin: boolean }) {
  const settingsViewProps = useSettingsController(isAdmin);

  return <SettingsPanel {...settingsViewProps} usersSlot={<UsersContainer />} />;
}
