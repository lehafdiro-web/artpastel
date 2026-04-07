from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

import fitz


SECTION_TITLES = ("BIO", "Образование", "Членство", "Выставки", "Публикации")
SIZE_RE = re.compile(r"\b\d+\s*[xх×XХ]\s*\d+\b")


CYRILLIC_TO_LATIN = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "yo",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
    "қ": "q",
    "ғ": "g",
    "ң": "n",
    "ә": "a",
    "ө": "o",
    "ұ": "u",
    "ү": "u",
    "һ": "h",
    "і": "i",
}


@dataclass
class MemberRecord:
    id: str
    name: str
    bio: str
    image: str


@dataclass
class CatalogRecord:
    id: str
    title: str
    author: str
    image: str
    description: str


def slugify(value: str) -> str:
    transliterated = "".join(CYRILLIC_TO_LATIN.get(char.lower(), char.lower()) for char in value)
    transliterated = re.sub(r"[^a-z0-9]+", "-", transliterated)
    transliterated = re.sub(r"-{2,}", "-", transliterated).strip("-")
    return transliterated or "item"


def normalize_spaces(value: str) -> str:
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"([A-Za-zА-Яа-яЁёҚқҒғҢңӘәӨөҰұҮүҺһІі])\s+-\s+([A-Za-zА-Яа-яЁёҚқҒғҢңӘәӨөҰұҮүҺһІі])", r"\1-\2", value)
    return value.strip()


def x_overlap(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> float:
    return max(0.0, min(a[2], b[2]) - max(a[0], b[0]))


def ts_quote(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    return f"`{escaped}`"


def find_artist_pages(doc: fitz.Document) -> list[tuple[int, str]]:
    artist_pages: list[tuple[int, str]] = []
    for page_index in range(doc.page_count):
        text = doc.load_page(page_index).get_text("text")
        if "BIO" not in text:
            continue
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        artist_name = next(
            (
                line
                for line in lines
                if line not in SECTION_TITLES
                and not line.startswith(("Телефон:", "E-mail:", "Е-mail:", "https://", "@"))
            ),
            "",
        )
        if artist_name:
            artist_pages.append((page_index, artist_name))
    return artist_pages


def section_text(lines: list[str], title: str) -> str:
    if title not in lines:
        return ""
    start = lines.index(title) + 1
    end = len(lines)
    for candidate in SECTION_TITLES:
        if candidate == title or candidate not in lines:
            continue
        idx = lines.index(candidate)
        if idx > start:
            end = min(end, idx)
    return normalize_spaces(" ".join(lines[start:end]))


def build_bio(lines: list[str]) -> str:
    parts: list[str] = []
    bio_text = section_text(lines, "BIO")
    education = section_text(lines, "Образование")
    membership = section_text(lines, "Членство")
    exhibitions = section_text(lines, "Выставки")

    if bio_text:
        parts.append(bio_text)
    if education:
        parts.append(f"Образование: {education}")
    if membership:
        parts.append(f"Членство: {membership}")
    if exhibitions:
        parts.append(f"Выставки: {exhibitions}")

    return normalize_spaces(" ".join(parts))


def save_image(image_bytes: bytes, ext: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)


def parse_member(page: fitz.Page, member_index: int, members_dir: Path) -> MemberRecord:
    text = page.get_text("text")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = next(
        (
            line
            for line in lines
            if line not in SECTION_TITLES
            and not line.startswith(("Телефон:", "E-mail:", "Е-mail:", "https://", "@"))
        ),
        f"Artist {member_index + 1}",
    )
    image_blocks = [block for block in page.get_text("dict")["blocks"] if block["type"] == 1]
    portrait = image_blocks[0]
    slug = slugify(name)
    portrait_filename = f"{member_index + 1:02d}-{slug}.{portrait['ext']}"
    save_image(portrait["image"], portrait["ext"], members_dir / portrait_filename)

    return MemberRecord(
        id=f"member-{member_index + 1:02d}",
        name=name,
        bio=build_bio(lines),
        image=f"/imported/members/{portrait_filename}",
    )


def line_entries(page: fitz.Page, artist_name: str) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block.get("lines", []):
            text = normalize_spaces(" ".join(span["text"] for span in line.get("spans", [])))
            if not text or text == artist_name:
                continue
            entries.append({"bbox": line["bbox"], "text": text})
    return entries


def parse_caption(caption_lines: list[dict[str, object]]) -> tuple[str, str]:
    ordered = sorted(caption_lines, key=lambda item: (item["bbox"][1], item["bbox"][0]))  # type: ignore[index]
    title_parts: list[str] = []
    size = ""

    for line in ordered:
        text = str(line["text"])
        match = SIZE_RE.search(text)
        if match and text == match.group(0):
            size = text
            continue

        cleaned = normalize_spaces(SIZE_RE.sub("", text).strip(" ."))
        if cleaned:
            title_parts.append(cleaned)
        if match and not size:
            size = match.group(0)

    title = normalize_spaces(" ".join(title_parts))
    return title, size


def parse_works_for_page(
    page: fitz.Page,
    artist_name: str,
    artist_slug: str,
    work_index_start: int,
    works_dir: Path,
) -> tuple[list[CatalogRecord], int]:
    image_blocks = [block for block in page.get_text("dict")["blocks"] if block["type"] == 1]
    text_lines = line_entries(page, artist_name)

    works: list[CatalogRecord] = []
    work_index = work_index_start

    for image_block in sorted(image_blocks, key=lambda block: (block["bbox"][1], block["bbox"][0])):
        bbox = image_block["bbox"]
        candidate_lines = [
            line
            for line in text_lines
            if line["bbox"][1] >= bbox[3] - 5  # type: ignore[index]
            and line["bbox"][1] <= bbox[3] + 80  # type: ignore[index]
            and x_overlap(bbox, line["bbox"]) > 10  # type: ignore[arg-type]
        ]
        title, size = parse_caption(candidate_lines)
        if not title:
            title = f"Работа {work_index + 1}"

        work_filename = f"{work_index + 1:03d}-{artist_slug}.{image_block['ext']}"
        save_image(image_block["image"], image_block["ext"], works_dir / work_filename)

        works.append(
            CatalogRecord(
                id=f"catalog-{work_index + 1:03d}",
                title=title,
                author=artist_name,
                image=f"/imported/works/{work_filename}",
                description=size,
            )
        )
        work_index += 1

    return works, work_index


def build_typescript(members: list[MemberRecord], works: list[CatalogRecord]) -> str:
    member_rows = ",\n".join(
        f"  {{ id: {ts_quote(item.id)}, name: {ts_quote(item.name)}, bio: {ts_quote(item.bio)}, image: {ts_quote(item.image)} }}"
        for item in members
    )
    work_rows = ",\n".join(
        f"  {{ id: {ts_quote(item.id)}, title: {ts_quote(item.title)}, author: {ts_quote(item.author)}, image: {ts_quote(item.image)}, description: {ts_quote(item.description)} }}"
        for item in works
    )

    return (
        "import type { CatalogItem, Member } from '../store';\n\n"
        f"export const importedMembers: Member[] = [\n{member_rows}\n];\n\n"
        f"export const importedCatalog: CatalogItem[] = [\n{work_rows}\n];\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    args = parser.parse_args()

    pdf_path = args.pdf.resolve()
    repo_path = args.repo.resolve()

    doc = fitz.open(pdf_path)
    artist_pages = find_artist_pages(doc)

    members_dir = repo_path / "public" / "imported" / "members"
    works_dir = repo_path / "public" / "imported" / "works"
    data_file = repo_path / "src" / "data" / "importedPortfolio.ts"
    data_file.parent.mkdir(parents=True, exist_ok=True)

    members: list[MemberRecord] = []
    works: list[CatalogRecord] = []

    ranges: list[tuple[str, int, int]] = []
    for index, (start_page, artist_name) in enumerate(artist_pages):
        end_page = artist_pages[index + 1][0] - 1 if index + 1 < len(artist_pages) else doc.page_count - 1
        ranges.append((artist_name, start_page, end_page))

    work_index = 0
    for member_index, (artist_name, start_page, end_page) in enumerate(ranges):
        member = parse_member(doc.load_page(start_page), member_index, members_dir)
        members.append(member)
        artist_slug = slugify(artist_name)

        for page_index in range(start_page + 1, end_page + 1):
            page_works, work_index = parse_works_for_page(
                doc.load_page(page_index),
                artist_name,
                artist_slug,
                work_index,
                works_dir,
            )
            works.extend(page_works)

    data_file.write_text(build_typescript(members, works), encoding="utf-8")
    print(f"Imported {len(members)} members and {len(works)} works from {pdf_path.name}")


if __name__ == "__main__":
    main()
