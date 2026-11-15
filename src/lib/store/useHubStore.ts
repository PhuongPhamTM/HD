"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import raw from "@/data/tracker-2026-jan-oct.json";
import {
  loadWorkspace,
  replaceSheetData,
  saveChanges,
  setupSheet,
  type ActionResult,
  type SheetState,
} from "@/app/actions/hub";
import { normalizeChecks, normalizeLegacyData } from "@/lib/domain/legacy-map";
import { DEFAULT_OPTIONS, type HubOptions } from "@/lib/domain/options";
import type {
  Activity,
  Campaign,
  ContentItem,
  HubData,
  Media,
  Publication,
} from "@/lib/domain/types";
import type { HubChanges } from "@/lib/sheets/repository";

const initialHubDataSnapshot = normalizeLegacyData(raw as unknown as HubData);
type RemovableEntityCollection = "content" | "campaigns" | "media" | "publications";

/**
 * Google Sheets is the source of truth. The store applies every change locally first
 * (so the UI stays instant), then saves just the changed rows to the Sheet in order.
 * If a save fails, the store reloads from the Sheet so the screen matches what is stored.
 * localStorage is only a cache for a fast first paint and for working without a Sheet.
 */
export interface SyncStatus {
  /** "unknown" until the first load answers. */
  state: SheetState | "unknown";
  message: string;
  /** The last failed save, shown until dismissed. */
  error: string;
  sheetUrl: string;
  pendingWrites: number;
  loading: boolean;
  lastLoadedAt: number;
}
interface HubState extends HubData {
  hydrated: boolean;
  options: HubOptions;
  sync: SyncStatus;
  actorName: string;
  setHydrated(isHydrated: boolean): void;
  setActorName(actorName: string): void;
  dismissSyncError(): void;
  loadFromSheet(): Promise<void>;
  setupSheet(): Promise<ActionResult>;
  uploadToSheet(): Promise<ActionResult>;
  addContent(contentItem: ContentItem): void;
  updateContent(contentId: string, contentPatch: Partial<ContentItem>): void;
  moveContent(contentId: string, targetStatus: ContentItem["status"]): void;
  /** Deletes a content item together with its publications, and unlinks its media. */
  removeContent(contentId: string): void;
  addCampaign(campaign: Campaign): void;
  updateCampaign(campaignId: string, campaignPatch: Partial<Campaign>): void;
  /** Deletes a campaign and unlinks its content items (the content itself is kept). */
  removeCampaign(campaignId: string): void;
  addPublication(publication: Publication): void;
  updatePublication(publicationId: string, publicationPatch: Partial<Publication>): void;
  importData(importedHubData: HubData): Promise<ActionResult>;
  resetData(): Promise<ActionResult>;
  remove(entityCollection: RemovableEntityCollection, entityId: string): void;
}

const initialSync: SyncStatus = {
  state: "unknown",
  message: "",
  error: "",
  sheetUrl: "",
  pendingWrites: 0,
  loading: false,
  lastLoadedAt: 0,
};
const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
const pickHubData = (state: HubData): HubData => ({
  campaigns: state.campaigns,
  content: state.content,
  media: state.media,
  publications: state.publications,
  activity: state.activity,
});

/** Saves run one after another so a create always reaches the Sheet before its update. */
let writeQueue: Promise<void> = Promise.resolve();
/** Bumped on every queued save, so a load that overlapped a save can be discarded. */
let writeSequence = 0;
let activeLoad: Promise<void> | null = null;

export const useHubStore = create<HubState>()(
  persist(
    (set, get) => {
      const createActivityEntry = (message: string): Activity => ({
        id: crypto.randomUUID(),
        message,
        at: new Date().toISOString(),
        actor: get().actorName || "Content team",
      });
      const patchSync = (patch: Partial<SyncStatus>) =>
        set((currentState) => ({ sync: { ...currentState.sync, ...patch } }));

      /** Queues a save; skipped when the Sheet is known to be unavailable. */
      function saveToSheet(changes: HubChanges) {
        const { state } = get().sync;
        if (state !== "connected" && state !== "unknown") return;
        writeSequence += 1;
        set((currentState) => ({
          sync: { ...currentState.sync, pendingWrites: currentState.sync.pendingWrites + 1 },
        }));
        writeQueue = writeQueue.then(async () => {
          const result = await saveChanges(changes).catch((error): ActionResult => ({
            ok: false,
            message: errorText(error),
          }));
          set((currentState) => ({
            sync: { ...currentState.sync, pendingWrites: currentState.sync.pendingWrites - 1 },
          }));
          if (!result.ok && get().sync.state === "connected") {
            patchSync({
              error: `Could not save to Google Sheets: ${result.message} The latest Sheet data was reloaded.`,
            });
            // Not awaited: the reload waits for this queue, which this task is part of.
            void get().loadFromSheet();
          }
        });
      }
      /** Applies a local change, records it in the activity log and saves it to the Sheet. */
      function commit(
        localChange: (currentState: HubState) => Partial<HubData>,
        changes: HubChanges,
        activityMessage: string,
      ) {
        const activityEntry = createActivityEntry(activityMessage);
        set((currentState) => ({
          ...localChange(currentState),
          activity: [activityEntry, ...currentState.activity],
        }));
        saveToSheet({ ...changes, upsert: { ...changes.upsert, activity: [activityEntry] } });
      }
      const findContent = (contentId: string) =>
        get().content.find((contentItem) => contentItem.id === contentId);

      async function replaceEverywhere(hubData: HubData, activityMessage: string) {
        const activityEntry = createActivityEntry(activityMessage);
        const nextData = { ...hubData, activity: [activityEntry, ...hubData.activity] };
        if (get().sync.state !== "connected") {
          set(nextData);
          return { ok: true, message: "Saved in this browser only." } satisfies ActionResult;
        }
        await writeQueue;
        const result = await replaceSheetData(nextData).catch((error): ActionResult => ({
          ok: false,
          message: errorText(error),
        }));
        if (result.ok) set(nextData);
        await get().loadFromSheet();
        return result;
      }

      return {
        ...initialHubDataSnapshot,
        hydrated: false,
        options: DEFAULT_OPTIONS,
        sync: initialSync,
        actorName: "",
        setHydrated: (hydrated) => set({ hydrated }),
        setActorName: (actorName) => set({ actorName }),
        dismissSyncError: () => patchSync({ error: "" }),

        loadFromSheet() {
          activeLoad ??= (async () => {
            patchSync({ loading: true });
            try {
              // Retry when a save happened during the read, so it never overwrites newer edits.
              for (let attempt = 0; attempt < 3; attempt += 1) {
                await writeQueue;
                const sequenceAtStart = writeSequence;
                const result = await loadWorkspace().catch((error) => ({
                  state: "error" as const,
                  message: errorText(error),
                  sheetUrl: undefined,
                }));
                if (sequenceAtStart !== writeSequence) continue;
                if (result.state === "connected") {
                  set({
                    ...result.data,
                    options: result.options,
                    sync: {
                      ...get().sync,
                      state: "connected",
                      message: "",
                      sheetUrl: result.sheetUrl,
                      lastLoadedAt: Date.now(),
                    },
                  });
                } else {
                  patchSync({
                    state: result.state,
                    message: result.message,
                    sheetUrl: result.sheetUrl ?? "",
                    lastLoadedAt: Date.now(),
                  });
                }
                return;
              }
            } finally {
              patchSync({ loading: false });
              activeLoad = null;
            }
          })();
          return activeLoad;
        },
        async setupSheet() {
          const result = await setupSheet(pickHubData(get())).catch((error): ActionResult => ({
            ok: false,
            message: errorText(error),
          }));
          await get().loadFromSheet();
          return result;
        },
        async uploadToSheet() {
          await writeQueue;
          const result = await replaceSheetData(pickHubData(get())).catch(
            (error): ActionResult => ({ ok: false, message: errorText(error) }),
          );
          await get().loadFromSheet();
          return result;
        },

        addContent: (contentItem) =>
          commit(
            (currentState) => ({ content: [contentItem, ...currentState.content] }),
            { upsert: { content: [contentItem] } },
            `Created “${contentItem.title}”`,
          ),
        updateContent(contentId, contentPatch) {
          const existing = findContent(contentId);
          if (!existing) return;
          const updated = { ...existing, ...contentPatch };
          commit(
            (currentState) => ({
              content: currentState.content.map((contentItem) =>
                contentItem.id === contentId ? updated : contentItem,
              ),
            }),
            { upsert: { content: [updated] } },
            `Updated “${existing.title}”`,
          );
        },
        moveContent(contentId, targetStatus) {
          const existing = findContent(contentId);
          if (!existing || existing.status === targetStatus) return;
          const updated = { ...existing, status: targetStatus };
          commit(
            (currentState) => ({
              content: currentState.content.map((contentItem) =>
                contentItem.id === contentId ? updated : contentItem,
              ),
            }),
            { upsert: { content: [updated] } },
            `Moved “${existing.title}” to ${targetStatus.replaceAll("_", " ")}`,
          );
        },
        removeContent(contentId) {
          const { publications, media } = get();
          const removedPublicationIds = publications
            .filter((publication) => publication.content === contentId)
            .map((publication) => publication.id);
          const unlinkedMedia: Media[] = media
            .filter((mediaItem) => mediaItem.content === contentId)
            .map((mediaItem) => ({ ...mediaItem, content: undefined }));
          commit(
            (currentState) => ({
              content: currentState.content.filter((contentItem) => contentItem.id !== contentId),
              publications: currentState.publications.filter(
                (publication) => publication.content !== contentId,
              ),
              media: currentState.media.map(
                (mediaItem) =>
                  unlinkedMedia.find((unlinked) => unlinked.id === mediaItem.id) ?? mediaItem,
              ),
            }),
            {
              upsert: { media: unlinkedMedia },
              remove: { content: [contentId], publications: removedPublicationIds },
            },
            `Deleted “${findContent(contentId)?.title ?? "content"}”`,
          );
        },
        addCampaign: (campaign) =>
          commit(
            (currentState) => ({ campaigns: [campaign, ...currentState.campaigns] }),
            { upsert: { campaigns: [campaign] } },
            `Created campaign “${campaign.title}”`,
          ),
        updateCampaign(campaignId, campaignPatch) {
          const existing = get().campaigns.find((campaign) => campaign.id === campaignId);
          if (!existing) return;
          const updated = { ...existing, ...campaignPatch, id: campaignId };
          commit(
            (currentState) => ({
              campaigns: currentState.campaigns.map((campaign) =>
                campaign.id === campaignId ? updated : campaign,
              ),
            }),
            { upsert: { campaigns: [updated] } },
            `Updated campaign “${updated.title}”`,
          );
        },
        removeCampaign(campaignId) {
          const existing = get().campaigns.find((campaign) => campaign.id === campaignId);
          if (!existing) return;
          const unlinkedContent: ContentItem[] = get()
            .content.filter((contentItem) => contentItem.campaign === campaignId)
            .map((contentItem) => ({ ...contentItem, campaign: "" }));
          commit(
            (currentState) => ({
              campaigns: currentState.campaigns.filter((campaign) => campaign.id !== campaignId),
              content: currentState.content.map(
                (contentItem) =>
                  unlinkedContent.find((unlinked) => unlinked.id === contentItem.id) ?? contentItem,
              ),
            }),
            {
              upsert: { content: unlinkedContent },
              remove: { campaigns: [campaignId] },
            },
            `Deleted campaign “${existing.title}”`,
          );
        },
        addPublication: (publication) =>
          commit(
            (currentState) => ({ publications: [publication, ...currentState.publications] }),
            { upsert: { publications: [publication] } },
            `Scheduled ${publication.channel} publication`,
          ),
        updatePublication(publicationId, publicationPatch) {
          const existing = get().publications.find(
            (publication) => publication.id === publicationId,
          );
          if (!existing) return;
          const updated = { ...existing, ...publicationPatch };
          commit(
            (currentState) => ({
              publications: currentState.publications.map((publication) =>
                publication.id === publicationId ? updated : publication,
              ),
            }),
            { upsert: { publications: [updated] } },
            `Updated ${existing.channel || "publication"} schedule`,
          );
        },
        remove: (entityCollection, entityId) =>
          commit(
            (currentState) =>
              ({
                [entityCollection]: (currentState[entityCollection] as { id: string }[]).filter(
                  (entityItem) => entityItem.id !== entityId,
                ),
              }) as Partial<HubData>,
            { remove: { [entityCollection]: [entityId] } },
            `Removed an item from ${entityCollection}`,
          ),
        importData: (importedHubData) =>
          replaceEverywhere(
            { ...normalizeLegacyData(importedHubData), activity: importedHubData.activity ?? [] },
            "Imported a data backup",
          ),
        resetData: () =>
          replaceEverywhere(
            { ...initialHubDataSnapshot, activity: [] },
            "Restored the original tracker snapshot",
          ),
      };
    },
    {
      name: "handong-content-hub",
      version: 2,
      partialize: ({ campaigns, content, media, publications, activity, options }) => ({
        campaigns,
        content,
        media,
        publications,
        activity,
        options,
      }),
      // v1 stored checks as a positional boolean[] and kept an Apps Script URL.
      migrate: (persistedState) => {
        const { gasUrl: _gasUrl, ...state } = (persistedState ?? {}) as Partial<HubState> & {
          gasUrl?: string;
        };
        return {
          ...state,
          content: (state.content ?? []).map((contentItem) => ({
            ...contentItem,
            checks: normalizeChecks(contentItem.checks),
          })),
        } as HubState;
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
export const initialHubData = initialHubDataSnapshot;
