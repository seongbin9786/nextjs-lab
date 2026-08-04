import Link from "next/link";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="breadcrumb">
        <Link href="/">홈</Link> <span>/</span> <span>reports</span>
      </nav>
      {children}
    </>
  );
}
