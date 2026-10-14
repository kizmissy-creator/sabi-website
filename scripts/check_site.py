#!/usr/bin/env python3
"""Offline baseline for tracked static pages; never executes website scripts."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.scripts, self.problems = [], [], [], []
        self.lang = self.viewport = False
        self.title = ''
        self.in_title = False
        self.script = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'html':
            self.lang = bool(a.get('lang', '').strip())
        if tag == 'meta' and a.get('name', '').lower() == 'viewport':
            self.viewport = bool(a.get('content'))
        if tag == 'title':
            self.in_title = True
        if tag == 'img' and 'alt' not in a:
            self.problems.append('image missing alt attribute')
        for attr in ('src', 'href', 'poster'):
            if a.get(attr):
                self.refs.append(a[attr])
        if tag == 'script':
            kind = a.get('type', '').lower()
            if not a.get('src') and kind in ('', 'text/javascript', 'application/javascript', 'module'):
                self.script = {'type': kind, 'text': ''}

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.script is not None:
            self.script['text'] += data

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if tag == 'script' and self.script is not None:
            self.scripts.append(self.script)
            self.script = None


def main():
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    files = [ROOT / p for p in tracked if p]
    pages = {p.resolve(): Page(p.read_text(encoding='utf-8')) for p in files if p.suffix == '.html'}
    failures = []
    scripts = []
    for path, page in pages.items():
        name = str(path.relative_to(ROOT))
        problems = list(page.problems)
        if not page.lang:
            problems.append('missing document language')
        if not page.title.strip():
            problems.append('missing page title')
        if not page.viewport:
            problems.append('missing viewport metadata')
        problems.extend(f'duplicate id: {key}' for key, count in Counter(page.ids).items() if count > 1)
        for ref in page.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            target = ((ROOT / unquote(url.path.lstrip('/'))) if url.path.startswith('/') else (path.parent / unquote(url.path))).resolve() if url.path else path
            if not target.is_relative_to(ROOT):
                problems.append(f'local reference escapes publish root: {ref}')
                continue
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                problems.append(f'missing local target: {ref}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                problems.append(f'missing anchor: {ref}')
        failures.extend(f'{name}: {p}' for p in problems)
        for index, script in enumerate(page.scripts, 1):
            scripts.append((f'{name} inline script {index}', script['text'], '.mjs' if script['type'] == 'module' else '.js'))
    for path in files:
        if path.suffix in ('.js', '.mjs', '.cjs', '.gs'):
            scripts.append((str(path.relative_to(ROOT)), path.read_text(encoding='utf-8'), '.mjs' if path.suffix == '.mjs' else '.js'))
    with tempfile.TemporaryDirectory() as temporary:
        for index, (name, code, extension) in enumerate(scripts):
            candidate = Path(temporary) / f'script-{index}{extension}'
            candidate.write_text(code, encoding='utf-8')
            result = subprocess.run(['node', '--check', str(candidate)], capture_output=True, text=True)
            if result.returncode:
                failures.append(f'{name}: JavaScript syntax error\n{result.stderr}')
    if not pages:
        failures.append('no tracked HTML pages found')
    for failure in failures:
        print(f'FAIL {failure}', file=sys.stderr)
    print(f'Checked {len(pages)} HTML pages and {len(scripts)} scripts; {len(failures)} failures. No network requests made.')
    return bool(failures)

if __name__ == '__main__':
    sys.exit(main())
