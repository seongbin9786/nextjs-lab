import Image from "next/image";
import Link from "next/link";

const blur =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAKCAIAAAAy3EnLAAABcklEQVR4nAXBEROAMBQA4H7JOB4/7obBKBqEu/HDrhsMBo+6YDB8FwXJMAzDMAzTqO+rBHw1vBIegLuBq4Wzg6OH3UFBWEfgCHmCOQMtEDYYKqG+Wr1SPaDuRl2tOjt19Gp3qqBaR8VR5UnNWdGiwqaGSuiv1q/UD+i70Verz04fvd6dLqjXUXPUedJz1rTosOmhEuarzSvNA+ZuzNWaszNHb3ZnCpp1NBxNnsycDS0mbGaohP1q+0r7gL0be7X27OzR293ZgnYdLUebJztnS4sNmx0qgV+Nr8QH8G7wavHs8Ohxd1gQ1xE5Yp5wzkgLhg2HSviv9q/0D/i78Vfrz84fvd+dL+jX0XP0efJz9rT4sPmhEvTV9Ep6gO6GrpbOjo6edkcFaR2JI+WJ5ky0UNhoqET66vTK9EC6m3S16ezS0afdpYJpHRPHlKc050RLClsaKsFfza/kB/hu+Gr57PjoeXdckNeROXKeeM5MC4eNhx+Jxf7FAQoKkQAAAABJRU5ErkJggg==";

export default function PropsPage() {
  return (
    <div className="container">
      <h1>주요 props</h1>

      <h2>fill + sizes</h2>
      <p>
        부모 요소(<code>position: relative</code>)를 가득 채웁니다.{" "}
        <code>sizes</code>는 뷰포트별 표시 크기를 선언해서 올바른 해상도를
        고르게 합니다.
      </p>
      <div style={{ position: "relative", aspectRatio: "16 / 9" }}>
        <Image
          src="/images/hero.jpg"
          alt="fill 모드 이미지"
          fill
          sizes="(max-width: 780px) 100vw, 780px"
        />
      </div>

      <h2>width/height</h2>
      <p>크기를 정확히 알 때는 숫자로 지정합니다.</p>
      <Image
        src="/images/thumb.png"
        alt="고정 크기 이미지"
        width={200}
        height={150}
        style={{ borderRadius: 8 }}
      />

      <h2>placeholder=&quot;blur&quot;</h2>
      <p>
        로드 중 흐릿한 미리보기(아래는 16x10짜리 초소형 PNG)를 보여줍니다.
        정적 import 이미지를 쓰면 blurDataURL이 자동으로 생성됩니다.
      </p>
      <Image
        src="/images/hero.jpg"
        alt="블러 플레이스홀더 이미지"
        width={400}
        height={267}
        placeholder="blur"
        blurDataURL={blur}
        style={{ borderRadius: 8, maxWidth: "100%", height: "auto" }}
      />

      <h2>정리</h2>
      <table>
        <thead>
          <tr>
            <th>prop</th>
            <th>역할</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>fill</code></td>
            <td>부모 채움. 반드시 aspect-ratio/고정 높이 컨테이너와 함께</td>
          </tr>
          <tr>
            <td><code>sizes</code></td>
            <td>뷰포트별 렌더링 너비 선언 → srcset 선택 기준</td>
          </tr>
          <tr>
            <td><code>priority</code></td>
            <td>지연 로딩 해제 + preload. LCP 이미지에만</td>
          </tr>
          <tr>
            <td><code>quality</code></td>
            <td>1~100 (기본 75). Next 16부터 qualities 허용 목록에 맞춰 보정</td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td>empty(기본) / blur / svg 데이터 URI</td>
          </tr>
        </tbody>
      </table>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
