#!/usr/bin/env node
// md → docs/ 정적 사이트. 의존성 없음. 실행: node build.js
//
// note 저장소의 빌더를 가져와 이 저장소에 맞춘 것이다. 다른 점은 하나다 —
// 거기서는 include 에 적은 것만 냈지만, 여기서는 배치가 매일 파일을 하나씩
// 놓고 간다. 사람이 목록을 손보게 두면 언젠가 빠뜨린다. 그래서 이름이
// 뉴스인 것은 다 낸다 (site/daily.js).
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseNote, blocksToText } from './site/md.js';
import { readHistory } from './site/history.js';
import { classify } from './site/daily.js';
import { renderHome, renderChanges, renderNote, noteUrl } from './site/render.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'docs');

const cfg = JSON.parse(await readFile(path.join(root, 'site.json'), 'utf8'));
const labelOf = (label) => label;
const labels = new Map(cfg.folders.map((f) => [f.kind, f.label]));

// 쓴 날·고친 날은 git 이 안다. quotePath 를 끄지 않으면 한글 경로가 \xxx 로 나온다.
let history = new Map();
try {
  history = readHistory(execFileSync('git',
    ['-c', 'core.quotePath=false', 'log', '--format=%cs', '--name-status', '--reverse', '-M'],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
} catch {
  console.warn('git 이력을 읽지 못했다 — 날짜 없이 낸다.');
}

// 뉴스는 저장소 바로 아래에 하루에 하나씩 쌓인다. 하위 폴더는 훑지 않는다.
const found = (await readdir(root, { withFileTypes: true }))
  .filter((e) => e.isFile() && e.name.endsWith('.md'))
  .map((e) => e.name.normalize('NFC'));

const notes = [];
for (const p of found.sort()) {
  const kind = classify(p);
  if (!kind) continue;
  const note = parseNote(p, await readFile(path.join(root, p), 'utf8'));
  const when = history.get(p) || {};
  note.folder = labels.get(kind.kind);
  note.slug = '';
  // 뉴스에는 제목 줄이 없다. 그날의 날짜가 제목이다 —
  // 그냥 두면 목록이 온통 "진짜 알아야됨" 이 된다.
  note.title = kind.title;
  note.date = kind.date;
  note.updated = when.updated && when.updated !== kind.date ? when.updated : '';
  note.text = blocksToText(note.blocks);
  notes.push(note);
}
// 뉴스는 최근 것부터 본다. 지난달 것을 먼저 읽을 일은 없다.
notes.sort((a, b) => b.date.localeCompare(a.date));

// 백링크 — 여기 낸 노트끼리만 센다.
const back = new Map();
for (const n of notes) {
  for (const t of n.links) {
    if (!back.has(t)) back.set(t, []);
    if (!back.get(t).includes(n.path)) back.get(t).push(n.path);
  }
}
const known = new Set(notes.map((n) => n.path));
for (const n of notes) n.backlinks = (back.get(n.path) || []).filter((p) => known.has(p));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const write = async (rel, html) => {
  const dest = path.join(out, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, html, 'utf8');
};

await write('index.html', renderHome({ site: cfg.site, folders: cfg.folders, notes, base: '' }));
await write('changes.html', renderChanges({ site: cfg.site, notes, labelOf, base: '' }));

for (const note of notes) {
  const rel = decodeURIComponent(noteUrl(note));
  const base = '../'.repeat(rel.split('/').length - 1);
  await write(rel, renderNote({ site: cfg.site, note, notes, labelOf, base }));
}

// 검색 색인
await write('search.json', JSON.stringify(notes.map((n) => ({
  url: noteUrl(n),
  title: n.title,
  folder: labelOf(n.folder),
  summary: n.summary,
  text: n.text.replace(/\s+/g, ' ').slice(0, 4000),
}))));

await cp(path.join(root, 'site/style.css'), path.join(out, 'style.css'));
await cp(path.join(root, 'site/app.js'), path.join(out, 'app.js'));

// 빌드가 docs/를 지우므로 Pages 커스텀 도메인 표시를 매번 다시 쓴다.
if (cfg.site.domain) await writeFile(path.join(out, 'CNAME'), cfg.site.domain + '\n');

console.log('docs/ 생성 완료 — 뉴스 ' + notes.length + '편');
