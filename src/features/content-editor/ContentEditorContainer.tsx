"use client";

import { EntityDialog } from "@/components/organisms/EntityDialog";
import { useContentEditorController } from "./useContentEditorController";

export function ContentEditorContainer() {
  const contentEditorProps = useContentEditorController();

  return <EntityDialog {...contentEditorProps} />;
}
