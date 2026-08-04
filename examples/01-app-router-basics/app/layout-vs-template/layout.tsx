import { MountStamp } from "@/components/mount-stamp";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ border: "2px solid var(--success)", borderRadius: 12, padding: 16 }}
    >
      <p className="muted" style={{ marginTop: 0 }}>
        ⬇ 이 초록 테두리는 <code>layout.tsx</code>입니다.
      </p>
      <MountStamp label="layout.tsx (레이아웃)" />
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}
