import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteUrl } from '../site/render.js';

test('루트에 있는 노트는 경로에 빈 칸이 끼지 않는다', () => {
  assert.equal(noteUrl({ path: '2026-08-19.md' }), 'notes/2026-08-19.html');
});

test('하위 폴더 노트는 폴더를 그대로 지난다', () => {
  assert.equal(noteUrl({ path: 'programming/here.md' }), 'notes/programming/here.html');
});
