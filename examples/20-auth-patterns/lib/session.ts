import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

// 데모용 세션 관리. 실제 서비스에서는 Auth.js 같은 검증된 라이브러리와
// 제대로 된 비밀 키 관리를 사용하세요.
const SECRET = process.env.SESSION_SECRET ?? "nextjs-lab-demo-secret";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type SessionPayload = {
  user: SessionUser;
  exp: number; // 만료 시각 (ms)
};

export const SESSION_COOKIE = "session";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

// payload를 base64url로 직렬화하고 HMAC 서명을 붙입니다.
// (구조가 JWT와 비슷하지만, 데모를 위해 최소 구현입니다.)
export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    user,
    exp: Date.now() + 1000 * 60 * 60, // 1시간
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(
  token: string | undefined,
): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(encoded);

  // 상수 시간 비교로 타이밍 공격 방지
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8"),
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// 데모용 사용자 목록. 실제로는 DB 조회.
const DEMO_USERS = [
  { email: "admin@example.com", password: "admin123", name: "관리자" },
  { email: "dev@example.com", password: "dev123", name: "개발자" },
];

export function authenticate(
  email: string,
  password: string,
): SessionUser | null {
  const found = DEMO_USERS.find(
    (u) => u.email === email && u.password === password,
  );
  if (!found) return null;
  return { id: randomUUID(), email: found.email, name: found.name };
}
