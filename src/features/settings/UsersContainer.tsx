"use client";

import { UsersCard } from "@/components/organisms/UsersCard";
import { useUsersController } from "./useUsersController";

export function UsersContainer() {
  const usersViewProps = useUsersController();

  return <UsersCard {...usersViewProps} />;
}
