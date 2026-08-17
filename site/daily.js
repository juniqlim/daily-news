// 파일 이름이 곧 갈래이고 날짜이고 제목이다.
//   2026-08-16.md                    하루치
//   weekly-2026-08-10_2026-08-16.md  한 주치
// 그 밖의 md 는 뉴스가 아니다 — 종목 목록 같은 것들이라 내지 않는다.

const DAY = ['일', '월', '화', '수', '목', '금', '토'];

const parts = (ymd) => ymd.split('-').map(Number);

const weekday = (ymd) => {
  const [y, m, d] = parts(ymd);
  return DAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

export function classify(name) {
  const daily = /^(\d{4})-(\d{2})-(\d{2})\.md$/.exec(name);
  if (daily) {
    const date = name.replace(/\.md$/, '');
    const [y, m, d] = parts(date);
    return { kind: 'daily', date, title: `${y}년 ${m}월 ${d}일 (${weekday(date)})` };
  }

  const weekly = /^weekly-(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.md$/.exec(name);
  if (weekly) {
    const [from, to] = [weekly[1], weekly[2]];
    const [fy, fm, fd] = parts(from);
    const [ty, tm, td] = parts(to);
    // 앞에서 이미 말한 해와 달은 되풀이하지 않는다.
    const tail = ty !== fy ? `${ty}년 ${tm}월 ${td}일` : tm !== fm ? `${tm}월 ${td}일` : `${td}일`;
    return { kind: 'weekly', date: to, title: `${fy}년 ${fm}월 ${fd}일 ~ ${tail}` };
  }

  return null;
}
