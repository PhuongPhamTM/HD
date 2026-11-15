"use client";

import { useEffect, useState } from "react";
import { selectableOptions } from "@/lib/domain/options";
import { parseThumbnailUrl } from "@/lib/domain/thumbnail";
import { useOptions } from "@/lib/hooks/useOptions";
import { useHubStore } from "@/lib/store/useHubStore";
import type { ContentItem } from "@/lib/domain/types";
import { subscribeToContentEditor } from "./contentEditorEvents";
import type { ContentEditorFormValues, ContentEditorViewProps } from "./contentEditor.types";

export function useContentEditorController(): ContentEditorViewProps {
  const campaigns = useHubStore((hubState) => hubState.campaigns);
  const contentItems = useHubStore((hubState) => hubState.content);
  const addContent = useHubStore((hubState) => hubState.addContent);
  const updateContent = useHubStore((hubState) => hubState.updateContent);
  const { stages } = useOptions();
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [initialTitle, setInitialTitle] = useState("");
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const editingContent = editingContentId
    ? contentItems.find((contentItem) => contentItem.id === editingContentId)
    : undefined;

  useEffect(
    () =>
      subscribeToContentEditor({
        onCreate() {
          setEditingContentId(null);
          setInitialTitle("");
          setSessionKey((key) => key + 1);
          setOpen(true);
        },
        onEdit(contentId) {
          const contentItem = useHubStore.getState().content.find((item) => item.id === contentId);
          if (!contentItem) return;
          setEditingContentId(contentItem.id);
          setInitialTitle(contentItem.title);
          setSessionKey((key) => key + 1);
          setOpen(true);
        },
      }),
    [],
  );

  function saveContentItem(rawValues: ContentEditorFormValues): string | null {
    const thumbnail = parseThumbnailUrl(rawValues.thumbnail);
    if (!thumbnail.ok) return thumbnail.message;
    const formValues = { ...rawValues, thumbnail: thumbnail.url };
    if (editingContent) {
      updateContent(editingContent.id, { ...formValues });
      setOpen(false);
      return null;
    }

    const newContentItem: ContentItem = {
      id: crypto.randomUUID(),
      title: formValues.title,
      campaign: formValues.campaign,
      owner: formValues.owner,
      location: formValues.location,
      status: formValues.status,
      shoot: formValues.shoot,
      edit: "",
      due: formValues.due,
      script: formValues.script,
      format: formValues.format,
      priority: formValues.priority,
      thumbnail: formValues.thumbnail,
      pillar: "",
      checks: [],
      createdAt: new Date().toISOString(),
    };
    addContent(newContentItem);
    setOpen(false);
    return null;
  }

  return {
    open,
    sessionKey,
    editingContent,
    initialTitle,
    campaigns: campaigns.map((campaign) => ({ value: campaign.id, label: campaign.title })),
    statusOptions: selectableOptions(stages, editingContent?.status).map((contentStage) => ({
      value: contentStage.key,
      label: contentStage.label,
    })),
    onSave: saveContentItem,
    onClose: () => setOpen(false),
  };
}
