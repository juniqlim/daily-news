import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../site/daily.js';

test('하루치는 날짜와 요일을 제목으로 삼는다', () => {
  const n = classify('2026-08-16.md');
  assert.equal(n.kind, 'daily');
  assert.equal(n.date, '2026-08-16');
  assert.equal(n.title, '2026년 8월 16일 (일)');
});

test('한 주치는 시작과 끝을 제목으로 삼는다', () => {
  const n = classify('weekly-2026-08-10_2026-08-16.md');
  assert.equal(n.kind, 'weekly');
  assert.equal(n.title, '2026년 8월 10일 ~ 16일');
});

test('한 주가 달을 넘으면 끝날에도 달을 적는다', () => {
  assert.equal(classify('weekly-2026-07-27_2026-08-02.md').title, '2026년 7월 27일 ~ 8월 2일');
});

test('한 주가 해를 넘으면 끝날에도 해를 적는다', () => {
  assert.equal(classify('weekly-2025-12-29_2026-01-04.md').title, '2025년 12월 29일 ~ 2026년 1월 4일');
});

// 줄 세우기는 날짜가 맡는다. 한 주치는 그 주의 끝날에 놓인다 —
// 시작날에 놓으면 그 주의 하루치들 위로 올라가 버린다.
test('한 주치의 날짜는 끝날이다', () => {
  assert.equal(classify('weekly-2026-08-10_2026-08-16.md').date, '2026-08-16');
});

test('뉴스가 아닌 파일은 내지 않는다', () => {
  assert.equal(classify('daily-news-check.md'), null);
  assert.equal(classify('README.md'), null);
});
