"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/blog", label: "블로그" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/layout-vs-template", label: "layout vs template" },
];

// 현재 경리에 따라 활성 링크를 표시합니다.
// usePathname()은 클라이언트 훅이므로 이 컴포넌트는 'use client'입니다.
export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="topnav">
      <strong>App Router 기본기</strong>
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "active" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
