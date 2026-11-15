"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { Button, Input, ProgressBar, Tag } from "@/components/atoms/ui";
import { Card, CardBody, EmptyState, FormField, PersonChip } from "@/components/molecules/ui";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import type { CampaignListProps, CampaignViewModel } from "@/features/campaigns/campaigns.types";

function CampaignFields({ campaign }: { campaign?: CampaignViewModel }) {
  return (
    <>
      <FormField label="Campaign name">
        <Input name="title" required autoFocus defaultValue={campaign?.title} />
      </FormField>
      <FormField label="Owner">
        <Input name="owner" defaultValue={campaign?.owner} />
      </FormField>
      <FormField label="Goal">
        <Input name="goal" defaultValue={campaign?.goal} />
      </FormField>
      <FormField label="Starts">
        <Input type="date" name="start" defaultValue={campaign?.start} />
      </FormField>
      <FormField label="Ends">
        <Input type="date" name="end" defaultValue={campaign?.end} />
      </FormField>
    </>
  );
}

export function CampaignList({
  campaigns,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
}: CampaignListProps) {
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignPendingDeletion, setCampaignPendingDeletion] = useState<CampaignViewModel | null>(
    null,
  );
  function createCampaign(formData: FormData) {
    onCreateCampaign(formData);
    setIsCampaignFormOpen(false);
  }
  function saveCampaign(formData: FormData) {
    if (!editingCampaignId) return;
    onUpdateCampaign(editingCampaignId, formData);
    setEditingCampaignId(null);
  }
  return (
    <div className="campaign-list">
      <PageHeader
        title="Campaigns"
        description="Group work around launches, initiatives and long-running stories."
        actions={
          <Button variant="primary" onClick={() => setIsCampaignFormOpen(!isCampaignFormOpen)}>
            ＋ New campaign
          </Button>
        }
      />
      {isCampaignFormOpen && (
        <Card className="mb-4">
          <form
            action={createCampaign}
            className="grid grid-cols-[1.2fr_1fr_1.5fr_140px_140px_auto] items-end gap-3 p-4 max-[1000px]:grid-cols-2"
          >
            <CampaignFields />
            <Button type="submit" variant="primary">
              Create
            </Button>
          </form>
        </Card>
      )}
      <div className="campaign-list__grid grid grid-cols-2 gap-4 max-[850px]:grid-cols-1">
        {campaigns.map((campaign) => {
          const { completedContentCount, completionPercentage: campaignCompletionPercentage } =
            campaign;
          if (editingCampaignId === campaign.id) {
            return (
              <Card key={campaign.id} className="campaign-card">
                <CardBody>
                  <form action={saveCampaign} className="grid grid-cols-2 items-end gap-3">
                    <CampaignFields campaign={campaign} />
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingCampaignId(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary">
                        Save
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            );
          }
          return (
            <Card key={campaign.id} className="campaign-card">
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Tag tone="blue">Active campaign</Tag>
                    <h2 className="mb-1 mt-2 text-[17px] font-semibold">{campaign.title}</h2>
                    <p className="m-0 min-h-5 text-[11px] text-muted">
                      {campaign.goal || "Content imported from the 2026 tracker."}
                    </p>
                  </div>
                  <ActionMenu
                    label={`Actions for ${campaign.title}`}
                    items={[
                      {
                        key: "edit",
                        label: "Edit",
                        icon: "edit",
                        onSelect: () => setEditingCampaignId(campaign.id),
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        icon: "trash",
                        tone: "danger",
                        onSelect: () => setCampaignPendingDeletion(campaign),
                      },
                    ]}
                  />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-4 text-center">
                  <div>
                    <strong className="block text-xl">{campaign.contentCount}</strong>
                    <span className="text-[9px] uppercase text-muted">Content</span>
                  </div>
                  <div>
                    <strong className="block text-xl">{completedContentCount}</strong>
                    <span className="text-[9px] uppercase text-muted">Complete</span>
                  </div>
                  <div>
                    <strong className="block text-xl">{campaign.publicationCount}</strong>
                    <span className="text-[9px] uppercase text-muted">Posts</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[10px] text-muted">
                    <span>Completion</span>
                    <b>{campaignCompletionPercentage}%</b>
                  </div>
                  <ProgressBar value={campaignCompletionPercentage} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {campaign.owner ? (
                    <PersonChip name={campaign.owner} />
                  ) : (
                    <span className="text-[10px] text-faint">No owner assigned</span>
                  )}
                  <Link
                    href={`/content?campaign=${campaign.id}`}
                    className="text-[11px] font-semibold text-brand-text"
                  >
                    View content →
                  </Link>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      {!campaigns.length && (
        <Card>
          <EmptyState title="No campaigns yet" body="Create one to group related content." />
        </Card>
      )}
      <ConfirmDialog
        open={campaignPendingDeletion !== null}
        tone="danger"
        title="Delete campaign?"
        description={
          campaignPendingDeletion && (
            <>
              <p className="m-0">
                <strong className="text-ink">{campaignPendingDeletion.title}</strong> will be
                permanently removed.
              </p>
              {campaignPendingDeletion.contentCount > 0 && (
                <p className="m-0 mt-2">
                  Its {campaignPendingDeletion.contentCount} content{" "}
                  {campaignPendingDeletion.contentCount === 1 ? "item" : "items"} will be kept but
                  no longer linked to a campaign.
                </p>
              )}
            </>
          )
        }
        confirmLabel="Delete campaign"
        onConfirm={() => {
          if (campaignPendingDeletion) onDeleteCampaign(campaignPendingDeletion.id);
          setCampaignPendingDeletion(null);
        }}
        onCancel={() => setCampaignPendingDeletion(null)}
      />
    </div>
  );
}
