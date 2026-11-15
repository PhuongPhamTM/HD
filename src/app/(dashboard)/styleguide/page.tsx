import { PageHeader } from "@/components/organisms/PageHeader";
import {
  Avatar,
  BrandMark,
  Button,
  Checkbox,
  Input,
  ProgressBar,
  Select,
  Tag,
  Textarea,
} from "@/components/atoms/ui";
import {
  Card,
  CardBody,
  CardHeader,
  FormField,
  MetricCard,
  PersonChip,
  StatTile,
} from "@/components/molecules/ui";
export default function Page() {
  return (
    <div className="styleguide">
      <PageHeader
        eyebrow="DESIGN SYSTEM"
        title="UI Styleguide"
        description="Theme tokens, controls and content components used throughout the hub."
      />
      <div className="grid gap-4">
        <Card>
          <CardHeader title="Color tokens" />
          <CardBody className="grid grid-cols-5 gap-3 max-[700px]:grid-cols-2">
            {[
              ["Brand", "bg-brand"],
              ["Accent", "bg-accent"],
              ["Success", "bg-success"],
              ["Warning", "bg-warning"],
              ["Danger", "bg-danger"],
              ["Violet", "bg-violet"],
              ["Surface", "bg-card"],
              ["Soft", "bg-soft"],
              ["Ink", "bg-ink"],
              ["Muted", "bg-muted"],
            ].map(([n, c]) => (
              <div key={n}>
                <div className={`h-14 rounded-ctl border border-line ${c}`} />
                <div className="mt-1 text-[10px] text-muted">{n}</div>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Atoms" />
          <CardBody className="grid gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <BrandMark />
              <Button variant="primary">Primary</Button>
              <Button>Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag tone="blue">Planning</Tag>
              <Tag tone="green">Approved</Tag>
              <Tag tone="amber">In review</Tag>
              <Tag tone="red">Overdue</Tag>
              <Tag tone="violet">Editing</Tag>
              <Avatar name="Phương Đào" />
              <PersonChip name="Content Team" />
            </div>
            <div className="grid max-w-xl grid-cols-2 gap-3">
              <FormField label="Text input">
                <Input placeholder="Content title" />
              </FormField>
              <FormField label="Select">
                <Select>
                  <option>Option one</option>
                </Select>
              </FormField>
              <div className="col-span-2">
                <FormField label="Textarea">
                  <Textarea placeholder="Write a note…" />
                </FormField>
              </div>
              <Checkbox label="Checklist item" />
              <ProgressBar value={68} />
            </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-4 gap-3 max-[800px]:grid-cols-2">
          <StatTile label="Active content" value="106" cta="Across all phases" tone="brand" />
          <StatTile label="Waiting" value="8" cta="Needs attention" tone="warning" />
          <StatTile label="Overdue" value="3" cta="Past due" tone="danger" />
          <MetricCard label="Published" value="262" delta="+18%" />
        </div>
      </div>
    </div>
  );
}
