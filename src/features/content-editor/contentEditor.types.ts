import type { ContentItem, ContentStatus } from "@/lib/domain/types";

export interface ContentEditorOption {
  value: string;
  label: string;
}

/** What the content dialog's form submits. */
export interface ContentEditorFormValues {
  title: string;
  campaign: string;
  owner: string;
  location: string;
  status: ContentStatus;
  shoot: string;
  due: string;
  script: string;
  format: string;
  priority: string;
  /** Cover image URL for the Asset Library card; "" for none. */
  thumbnail: string;
}

export interface ContentEditorViewProps {
  open: boolean;
  /** Changes every time the dialog is (re)opened, so the form resets. */
  sessionKey: number;
  /** The item being edited; undefined in create mode. */
  editingContent: ContentItem | undefined;
  /** Title to prefill when the dialog opens. */
  initialTitle: string;
  campaigns: ContentEditorOption[];
  statusOptions: ContentEditorOption[];
  /** Saves the form. Returns an error message to show in the dialog, or null when saved. */
  onSave(formValues: ContentEditorFormValues): string | null;
  onClose(): void;
}
