"""Keeps README.md's hand-written Guardrails list in step with the sections of .claude/harness-rules.md.

Each README bullet summarizes one rules section and records a fingerprint of that section's text. When a
section changes, its fingerprint no longer matches, so bin/ci fails until someone re-reads the summary and
runs bin/sync-readme. Agents never read these summaries: they live only in README.md.
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
RULES_PATH = ".claude/harness-rules.md"
START_MARKER = "<!-- guardrails:start (one bullet per .claude/harness-rules.md section; see bin/sync-readme) -->"
END_MARKER = "<!-- guardrails:end -->"
SECTIONS_LEFT_OUT = {"This repo's additions"}
PLACEHOLDER = "TODO: summarize this section for README readers."
_BULLET = re.compile(r"^- \*\*\[(?P<heading>.+?)\]\(.+?\)\*\*: (?P<summary>.*?) <!-- rules-fingerprint: (?P<fingerprint>\w+) -->$")


def strip_fenced_code_blocks(text: str) -> str:
    """Drop ```...``` blocks so example headings/links inside them aren't mistaken for real ones."""
    return re.sub(r"```.*?```", "", text, flags=re.DOTALL)


def heading_anchor(heading: str) -> str:
    """GitHub-style heading slug: lowercase, drop punctuation, spaces to hyphens."""
    return re.sub(r"\s+", "-", re.sub(r"[^\w\s-]", "", heading.lower()).strip())


def rules_sections(rules_text: str) -> list[tuple[str, str]]:
    sections = re.split(r"(?m)^## +(.+?)\s*$", strip_fenced_code_blocks(rules_text))[1:]
    return [(heading, body) for heading, body in zip(sections[0::2], sections[1::2]) if heading not in SECTIONS_LEFT_OUT]


def section_fingerprint(body: str) -> str:
    return hashlib.sha256(" ".join(body.split()).encode()).hexdigest()[:12]


def _split_readme(readme_text: str) -> tuple[str, str, str]:
    before, start, rest = readme_text.partition(START_MARKER)
    block, end, after = rest.partition(END_MARKER)
    if not start or not end:
        raise ValueError(f"README.md is missing the {START_MARKER!r} / {END_MARKER!r} markers")
    return before, block, after


def _readme_bullets(block: str) -> dict[str, re.Match]:
    return {match["heading"]: match for match in map(_BULLET.match, block.strip().splitlines()) if match}


def synced_readme(readme_text: str, rules_text: str) -> str:
    """One bullet per rules section, in rules order, keeping existing summaries and refreshing fingerprints."""
    before, block, after = _split_readme(readme_text)
    existing = _readme_bullets(block)
    bullets = []
    for heading, body in rules_sections(rules_text):
        summary = existing[heading]["summary"] if heading in existing else PLACEHOLDER
        bullets.append(
            f"- **[{heading}]({RULES_PATH}#{heading_anchor(heading)})**: {summary} "
            f"<!-- rules-fingerprint: {section_fingerprint(body)} -->"
        )
    return f"{before}{START_MARKER}\n" + "\n".join(bullets) + f"\n{END_MARKER}{after}"


def guardrails_problems(readme_text: str, rules_text: str) -> list[str]:
    before, block, after = _split_readme(readme_text)
    existing = _readme_bullets(block)
    problems = []
    for heading, body in rules_sections(rules_text):
        bullet = existing.get(heading)
        if bullet is None:
            problems.append(f"no README summary for rules section {heading!r}: run bin/sync-readme, then write it")
        elif bullet["summary"] == PLACEHOLDER:
            problems.append(f"README summary for {heading!r} is still the placeholder: write it")
        elif bullet["fingerprint"] != section_fingerprint(body):
            problems.append(f"rules section {heading!r} changed since its README summary was written: re-read the summary, then run bin/sync-readme")
    if not problems and synced_readme(readme_text, rules_text) != readme_text:
        problems.append("README Guardrails list doesn't match the rules sections (order, removed section, or stray line): run bin/sync-readme")
    return problems
