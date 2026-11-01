#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

SOURCE = Path("/home/orion/DevTag/Ecom-Builder/data/customer-care/_source.txt")
OUT = Path("/home/orion/DevTag/Ecom-Builder/data/customer-care/pages.json")

PAGES = [
    ("Shipping & Delivery", "shipping-policy"),
    ("Returns & Refunds", "return-and-refund-policy"),
    ("Order Cancellations", "cancellation-policy"),
    ("Payment Options", "payment-policy"),
    ("Buy Now, Pay Later", "buy-now-pay-later"),
    ("Warranty & Support", "warranty"),
    ("Order Help Center", "order-help-center"),
]

H3 = {
    "Processing Delays",
    "Tracking Updates",
    "Incorrect Shipping Addresses",
    "Before Fulfillment",
    "During Fulfillment",
    "After Shipment",
    "Return Shipping Charges",
    "Refund Method",
    "Refund Processing",
    "Payment Authorizations",
    "Afterpay Orders",
    "Affirm Orders",
    "Important BNPL Information",
    "How BNPL Payments Work",
    "Important BNPL Disclosures",
    "Free Standard Shipping",
    "Refund Processing Time",
    "Refunds for BNPL Purchases",
    "Afterpay — Shop Now, Pay Over Time",
    "Affirm — Flexible Financing",
    "How BNPL Refunds Work",
    "Warranty Duration",
    "Manufacturing Defects",
    "Hardware Malfunctions",
    "Defective Components",
    "Product Performance Issues",
    "Your Purchase. Your Peace of Mind.",
    "Technology You Can Choose With Confidence",
    "Your Orders. Your Questions. Our Support.",
    "Track Your Order",
    "Change or Cancel an Order",
    "Shipping and Delivery Help",
    "Returns and Refunds",
    "Payment Assistance",
    "Product and Warranty Support",
    "For Order-Related Questions",
    "For Financing-Related Questions",
}

CONTACT_PREFIXES = (
    "Store Name:",
    "Legal Business Name:",
    "Website URL:",
    "Website:",
    "Shipping Policy URL:",
    "Return Policy URL:",
    "Return and Refund Policy URL:",
    "BNPL Information URL:",
    "Cancellation Policy URL:",
    "Payment Policy URL:",
    "BNPL Information URL:",
    "Warranty Information URL:",
    "Customer Support Email:",
    "Customer Support Phone:",
    "Email:",
    "Phone:",
    "Business Address:",
    "Live Chat Support:",
    "Live Chat:",
    "Business Hours:",
    "Time Zone:",
)

FAQ_TITLES = {
    "18. Frequently Asked Questions",
    "17. Frequently Asked Questions",
    "17. Frequently Asked Order Questions",
}

TABLE_CAPTIONS = {
    "Shipping Cost Summary",
    "Return Policy Summary",
    "Cancellation Policy Summary",
    "Warranty Coverage Summary",
}

SECTION_RE = re.compile(r"^(\d+)\. (.+)$")


def is_section_heading(line: str) -> bool:
    m = SECTION_RE.match(line.strip())
    if not m:
        return False
    title = m.group(2).strip()
    if len(title) > 90:
        return False
    if title.endswith(".") and not title.endswith("?"):
        return False
    # numbered list sentences tend to start lowercase after the number
    if title[:1].islower():
        return False
    return True
SUBNUM_RE = re.compile(r"^(\d+\.\d+)(?:\s+[—-]\s*|\s+)(.+)$")
STEP_RE = re.compile(r"^Step \d+(?:[:—-]|$)")
Q_RE = re.compile(r"^.+\?$")


def slugify(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80]


def split_pages(text: str) -> list[tuple[str, str, list[str]]]:
    text = text.lstrip("\ufeff")
    lines = text.replace("\r\n", "\n").split("\n")
    titles = [t for t, _ in PAGES]
    starts = []
    for i, line in enumerate(lines):
        if line.rstrip() in titles or line.rstrip() + " " == line and line.strip() in titles:
            if line.strip() in titles:
                # only top-level page titles that appear as a lone heading
                if i == 0 or (i > 0 and lines[i - 1].strip() == "" and not SECTION_RE.match(lines[i].strip())):
                    starts.append((i, line.strip()))
    # fallback: find exact titles at beginning of blocks
    starts = []
    wanted = {t: slug for t, slug in PAGES}
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped in wanted:
            prev_blank = i == 0 or not lines[i - 1].strip()
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
            next_is_date = nxt.startswith("Effective Date") or "Your Orders" in nxt
            if prev_blank and (next_is_date or stripped == "Order Help Center"):
                starts.append((i, stripped))
        i += 1
    result = []
    for idx, (start, title) in enumerate(starts):
        end = starts[idx + 1][0] if idx + 1 < len(starts) else len(lines)
        slug = wanted[title]
        result.append((title, slug, lines[start + 1 : end]))
    return result


def is_contact_line(line: str) -> bool:
    return any(line.startswith(p) for p in CONTACT_PREFIXES)


def consume_table(lines: list[str], i: int) -> tuple[dict, int]:
    header1 = lines[i]
    header2 = lines[i + 1].lstrip("\t")
    cells: list[str] = []
    j = i + 2
    while j < len(lines) and lines[j].startswith("\t"):
        cells.append(lines[j].lstrip("\t"))
        j += 1
    leftover = None
    if len(cells) % 2 == 1:
        leftover = cells.pop()
    rows = [{"label": cells[k], "value": cells[k + 1]} for k in range(0, len(cells), 2)]
    table = {"type": "table", "headers": [header1, header2], "rows": rows}
    return table, leftover, j


def parse_blocks(lines: list[str], faq_mode: bool = False) -> list[dict]:
    blocks: list[dict] = []
    i = 0
    n = len(lines)

    def push_para(text: str) -> None:
        if text.strip():
            blocks.append({"type": "paragraph", "text": text.strip()})

    while i < n:
        raw = lines[i]
        line = raw.strip()
        if not line or line == "________________" or line == "-":
            i += 1
            continue

        if line in TABLE_CAPTIONS:
            blocks.append({"type": "caption", "text": line})
            i += 1
            continue

        if (
            i + 1 < n
            and lines[i + 1].startswith("\t")
            and not raw.startswith("\t")
            and not line.startswith("*")
            and not SECTION_RE.match(line)
        ):
            table, leftover, j = consume_table(lines, i)
            blocks.append(table)
            if leftover:
                push_para(leftover)
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
            # Could be a numbered list if next similar or body doesn't look like heading
            # Section headers are handled at section split time.
            items = []
            while i < n and re.match(r"^\d+\. ", lines[i].strip()) and not is_section_heading(lines[i]):
                item = re.sub(r"^\d+\. ", "", lines[i].strip())
                items.append(item)
                i += 1
            blocks.append({"type": "numbered", "items": items})
            continue

        if SUBNUM_RE.match(line) or STEP_RE.match(line) or line in H3:
            blocks.append({"type": "heading", "text": line})
            i += 1
            continue

        if faq_mode and Q_RE.match(line) and not line.startswith("Need "):
            q = line
            i += 1
            answers = []
            while i < n:
                nxt = lines[i].strip()
                if not nxt:
                    i += 1
                    continue
                if Q_RE.match(nxt) or is_section_heading(nxt) or nxt in H3:
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

        push_para(line)
        i += 1
    return blocks


def parse_page(title: str, slug: str, body_lines: list[str]) -> dict:
    # trim trailing blanks
    while body_lines and not body_lines[-1].strip():
        body_lines.pop()
    lines = [ln.rstrip() for ln in body_lines]

    effective = ""
    intro: list[str] = []
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].startswith("Effective Date:"):
        effective = lines[i].strip()
        i += 1
    # tagline for help center
    tagline = ""
    if slug == "order-help-center" and i < len(lines):
        if "Your Orders" in lines[i]:
            tagline = lines[i].strip()
            i += 1

    while i < len(lines) and not is_section_heading(lines[i]):
        if lines[i].strip() and lines[i].strip() not in ("________________", "-"):
            intro.append(lines[i].strip())
        i += 1

    sections = []
    while i < len(lines):
        m = SECTION_RE.match(lines[i].strip())
        if not m or not is_section_heading(lines[i]):
            i += 1
            continue
        sec_title = f"{m.group(1)}. {m.group(2)}"
        i += 1
        chunk = []
        while i < len(lines) and not is_section_heading(lines[i]):
            chunk.append(lines[i])
            i += 1
        faq_mode = "Frequently Asked" in sec_title
        sections.append(
            {
                "id": slugify(sec_title),
                "title": sec_title,
                "blocks": parse_blocks(chunk, faq_mode=faq_mode),
            }
        )

    # trailing copyright / tagline after last section may be in last section already
    description = intro[0] if intro else title
    return {
        "slug": slug,
        "title": title,
        "effectiveDate": effective,
        "tagline": tagline,
        "intro": intro,
        "description": description,
        "sections": sections,
    }


def main() -> None:
    text = SOURCE.read_text(encoding="utf-8")
    pages = []
    for title, slug, body in split_pages(text):
        pages.append(parse_page(title, slug, body))
        print(slug, "sections", len(pages[-1]["sections"]), "intro", len(pages[-1]["intro"]))
    OUT.write_text(json.dumps({"pages": pages}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
