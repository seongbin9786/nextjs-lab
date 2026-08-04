import { MountStamp } from "@/components/mount-stamp";

export default function DemoTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "2px dashed var(--warning)",
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
      }}
    >
      <p className="muted" style={{ marginTop: 0 }}>
        ⬇ 이 주황 점선 테두리는 <code>template.tsx</code>입니다.
      </p>
      <MountStamp label="template.tsx (템플릿)" />
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}
