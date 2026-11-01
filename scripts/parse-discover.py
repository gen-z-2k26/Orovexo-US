#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

SOURCE = Path("/home/orion/DevTag/Ecom-Builder/data/discover/_source.txt")
OUT = Path("/home/orion/DevTag/Ecom-Builder/data/discover/pages.json")

SECTION_RE = re.compile(r"^(\d+)\. (.+)$")
SUBNUM_RE = re.compile(r"^(\d+\.\d+)\s+")
Q_RE = re.compile(r"^.+\?$")

CONTACT_PREFIXES = (
    "Store Name:",
    "Legal Business Name:",
    "Website URL:",
    "Website:",
    "Email:",
    "Call:",
    "Phone:",
    "Business Address:",
    "Live Chat:",
    "Business Hours:",
    "Office Hours:",
)

ABOUT_HEADINGS = [
    "Our Story",
    "What We Offer",
    "Our Mission",
    "Our Vision",
    "Why Shop With Orvexo Electronics?",
    "The Values Behind Orvexo",
    "A Shopping Experience Designed Around You",
    "Proudly Serving Customers Across the United States",
    "Let's Stay Connected",
    "Your Next Technology Discovery Starts Here",
]

ABOUT_SUB = {
    "Built Around a Better Way to Shop",
    "Electronics for the Way You Live",
    "Free Standard Shipping",
    "Flexible Ways to Pay",
    "A Clear 30-Day Return Policy",
    "Customer Support When You Need It",
    "Transparent Shopping Information",
    "Transparency",
    "Customer Focus",
    "Accessibility",
    "Continuous Improvement",
    "Accountability",
    "Discover. Choose. Order. Enjoy.",
}

CONTACT_HEADINGS = [
    "Get in Touch",
    "Our Business Information",
    "How Can We Help You?",
    "Send Us a Message",
    "Customer Support Hours",
    "Frequently Asked Questions",
    "Helpful Links",
    "We're Always Happy to Hear From You",
]

CONTACT_SUB = {
    "Email Support",
    "Phone Support",
    "24/7 Live Chat",
    "Product Questions",
    "Order Status and Tracking",
    "Shipping and Delivery",
    "Returns and Refunds",
    "Payment and Buy Now, Pay Later",
}

COMMIT_SUB = {
    "Know What You're Buying",
    "Clear Pricing and Checkout Information",
    "More Convenience. Fewer Surprises.",
    "Customer Focus",
    "Integrity",
    "Transparency",
    "Responsibility",
    "Accessibility",
    "Progress",
    "Shopping Experience",
    "Product Information",
    "Customer Communication",
    "Payment Convenience",
    "Support Experience",
}


def slugify(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80]


def is_section_heading(line: str) -> bool:
    m = SECTION_RE.match(line.strip())
    if not m:
        return False
    title = m.group(2).strip()
    if len(title) > 90:
        return False
    if title.endswith(".") and not title.endswith("?"):
        return False
    if title[:1].islower():
        return False
    return True


def is_contact_line(line: str) -> bool:
    return any(line.startswith(p) for p in CONTACT_PREFIXES)


def clean_line(line: str) -> str:
    line = re.sub(r"</?text>", "", line)
    return line.rstrip()


def consume_table(lines: list[str], i: int):
    header1 = lines[i].strip()
    header2 = lines[i + 1].lstrip("\t").strip()
    cells = []
    j = i + 2
    while j < len(lines) and lines[j].startswith("\t"):
        cells.append(lines[j].lstrip("\t").strip())
        j += 1
    leftover = None
    if len(cells) % 2 == 1:
        leftover = cells.pop()
    rows = [{"label": cells[k], "value": cells[k + 1]} for k in range(0, len(cells), 2)]
    return {"type": "table", "headers": [header1, header2], "rows": rows}, leftover, j


def parse_blocks(lines: list[str], extra_headings: set[str], faq_mode: bool) -> list[dict]:
    blocks: list[dict] = []
    i = 0
    n = len(lines)

    def push(text: str) -> None:
        t = text.strip()
        if t:
            blocks.append({"type": "paragraph", "text": t})

    while i < n:
        raw = lines[i]
        line = raw.strip()
        if not line or line in ("________________", "-", "https://orvexo.us/home", "https://orvexo.us/shop"):
            i += 1
            continue

        if i + 1 < n and lines[i + 1].startswith("\t") and not raw.startswith("\t") and not line.startswith("*"):
            table, leftover, j = consume_table(lines, i)
            blocks.append(table)
            if leftover:
                push(leftover)
            i = j
            continue

        if line.startswith("* "):
            items = []
            while i < n and lines[i].strip().startswith("* "):
                items.append(lines[i].strip()[2:])
                i += 1
            blocks.append({"type": "bullets", "items": items})
            continue

        if re.match(r"^\d+\. ", line) and not is_section_heading(line) and not faq_mode:
            items = []
            while i < n and re.match(r"^\d+\. ", lines[i].strip()) and not is_section_heading(lines[i]):
                items.append(re.sub(r"^\d+\. ", "", lines[i].strip()))
                i += 1
            blocks.append({"type": "numbered", "items": items})
            continue

        if line in extra_headings or SUBNUM_RE.match(line):
            blocks.append({"type": "heading", "text": line})
            i += 1
            continue

        if faq_mode and Q_RE.match(line):
            q = line
            i += 1
            answers = []
            while i < n:
                nxt = lines[i].strip()
                if not nxt or nxt == "________________":
                    i += 1
                    continue
                if Q_RE.match(nxt) or is_section_heading(nxt) or nxt in extra_headings:
                    break
                answers.append(nxt)
                i += 1
            blocks.append({"type": "faq", "question": q, "answer": " ".join(answers)})
            continue

        if is_contact_line(line):
            fields = []
            while i < n and is_contact_line(lines[i].strip()):
                key, val = lines[i].strip().split(":", 1)
                fields.append({"label": key.strip(), "value": val.strip()})
                i += 1
            blocks.append({"type": "contact", "fields": fields})
            continue

        push(line)
        i += 1
    return blocks


def split_named(lines: list[str], headings: list[str]) -> tuple[list[str], list[tuple[str, list[str]]]]:
    heading_set = set(headings)
    intro: list[str] = []
    i = 0
    while i < len(lines) and lines[i].strip() not in heading_set:
        if lines[i].strip() and lines[i].strip() not in ("________________", "-"):
            intro.append(lines[i].strip())
        i += 1
    sections = []
    while i < len(lines):
        title = lines[i].strip()
        if title not in heading_set:
            i += 1
            continue
        i += 1
        chunk = []
        while i < len(lines) and lines[i].strip() not in heading_set:
            chunk.append(lines[i])
            i += 1
        sections.append((title, chunk))
    return intro, sections


def split_numbered(lines: list[str]) -> tuple[list[str], list[tuple[str, list[str]]]]:
    intro: list[str] = []
    i = 0
    while i < len(lines) and not is_section_heading(lines[i]):
        s = lines[i].strip()
        if s and s not in ("________________", "-"):
            intro.append(s)
        i += 1
    sections = []
    while i < len(lines):
        if not is_section_heading(lines[i]):
            i += 1
            continue
        m = SECTION_RE.match(lines[i].strip())
        title = f"{m.group(1)}. {m.group(2)}"
        i += 1
        chunk = []
        while i < len(lines) and not is_section_heading(lines[i]):
            chunk.append(lines[i])
            i += 1
        sections.append((title, chunk))
    return intro, sections


def make_page(slug: str, title: str, tagline: str, intro: list[str], sections: list[tuple[str, list[str]]], extra: set[str], faq: bool) -> dict:
    parsed = []
    for sec_title, chunk in sections:
        parsed.append(
            {
                "id": slugify(sec_title),
                "title": sec_title,
                "blocks": parse_blocks(chunk, extra, faq_mode=faq or "Frequently Asked" in sec_title),
            }
        )
    description = intro[0] if intro else title
    return {
        "slug": slug,
        "title": title,
        "effectiveDate": "",
        "tagline": tagline,
        "intro": intro,
        "description": description,
        "sections": parsed,
    }


def extract_ranges(lines: list[str]) -> dict[str, list[str]]:
    markers = []
    for i, line in enumerate(lines):
        s = line.strip()
        if s == "About Orvexo Electronics":
            markers.append((i, "about-us"))
        elif s == "Contact Us" and i > 0:
            markers.append((i, "contact-us"))
        elif s == "FAQs":
            markers.append((i, "faqs"))
        elif s == "Our Commitment":
            markers.append((i, "our-commitment"))
    out = {}
    for idx, (start, slug) in enumerate(markers):
        end = markers[idx + 1][0] if idx + 1 < len(markers) else len(lines)
        chunk = lines[start + 1 : end]
        if slug == "faqs":
            chunk = [ln for ln in chunk if "orvexo.us/shop" not in ln.lower()]
        out[slug] = chunk
    return out


def main() -> None:
    raw = SOURCE.read_text(encoding="utf-8").lstrip("\ufeff")
    lines = [clean_line(ln) for ln in raw.replace("\r\n", "\n").split("\n")]
    ranges = extract_ranges(lines)
    pages = []

    about_body = ranges["about-us"]
    tagline = ""
    rest = about_body
    if rest and rest[0].strip().startswith("Technology for Everyday"):
        tagline = rest[0].strip()
        rest = rest[1:]
    intro, secs = split_named(rest, ABOUT_HEADINGS)
    pages.append(make_page("about-us", "About Us", tagline, intro, secs, ABOUT_SUB, False))

    contact_body = ranges["contact-us"]
    tagline = ""
    rest = contact_body
    if rest and "Here to Help" in rest[0]:
        tagline = rest[0].strip()
        rest = rest[1:]
    intro, secs = split_named(rest, CONTACT_HEADINGS)
    pages.append(make_page("contact-us", "Contact Us", tagline, intro, secs, CONTACT_SUB, False))

    faq_body = ranges["faqs"]
    intro, secs = split_numbered(faq_body)
    tagline = ""
    if intro and intro[0].startswith("Everything You Need"):
        tagline = intro.pop(0)
    pages.append(make_page("faqs", "FAQs", tagline, intro, secs, set(), True))

    commit_body = ranges["our-commitment"]
    tagline = ""
    rest = commit_body
    if rest and rest[0].strip().startswith("Better Technology"):
        tagline = rest[0].strip()
        rest = rest[1:]
    intro, secs = split_numbered(rest)
    pages.append(make_page("our-commitment", "Our Commitment", tagline, intro, secs, COMMIT_SUB, False))

    for p in pages:
        print(p["slug"], "sec", len(p["sections"]), "intro", len(p["intro"]), "tagline", p["tagline"][:50] if p["tagline"] else "")
    OUT.write_text(json.dumps({"pages": pages}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
