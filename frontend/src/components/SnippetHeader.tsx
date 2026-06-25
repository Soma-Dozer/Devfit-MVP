/**
 * 코드 조각 카드의 헤더.
 * - 큰 제목: 이 diff의 핵심을 한 줄로 요약한 한글 제목(AI 생성). 없으면 원본 커밋 메시지.
 * - 아래: 원본 커밋 메시지 / 커밋 해시 / 작성자 / 커밋 날짜를 라벨과 함께 명확히 표시.
 */
export default function SnippetHeader({
  title,
  commitMessage,
  shortSha,
  authorName,
  date,
  htmlUrl,
}: {
  title?: string;
  commitMessage: string;
  shortSha: string;
  authorName: string;
  date: string;
  htmlUrl?: string;
}) {
  const heading = title && title.trim() ? title : commitMessage;
  const day = date ? date.slice(0, 10) : "";

  return (
    <div>
      <h3 className="text-[17px] font-extrabold leading-snug tracking-tight text-slate-900">
        {heading}
      </h3>

      <div className="mt-2.5 space-y-1.5 text-[12.5px]">
        <Row label="원본 커밋 메시지">
          <span className="text-slate-700">{commitMessage}</span>
        </Row>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <Row label="커밋 해시">
            {htmlUrl ? (
              <a href={htmlUrl} target="_blank" rel="noreferrer"
                className="font-mono text-indigo-600 hover:underline">
                {shortSha} ↗
              </a>
            ) : (
              <span className="font-mono text-slate-700">{shortSha}</span>
            )}
          </Row>
          {authorName && (
            <Row label="작성자"><span className="text-slate-700">{authorName}</span></Row>
          )}
          {day && (
            <Row label="커밋 날짜"><span className="text-slate-700">{day}</span></Row>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="shrink-0 font-semibold text-slate-400">{label}</span>
      {children}
    </div>
  );
}
