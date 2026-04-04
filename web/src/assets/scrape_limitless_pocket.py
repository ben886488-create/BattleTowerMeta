#!/usr/bin/env python3
# pip install requests beautifulsoup4

import argparse
import html as html_lib
import json
import re
import time
import os
import uuid
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://pocket.limitlesstcg.com"
SETS_URL = f"{BASE_URL}/cards"

DATE_RE = re.compile(r"^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}$")
COUNT_RE = re.compile(r"^\d+$")
TITLE_RE = re.compile(
    r"^(?P<name>.+?)\s+•\s+(?P<set_name>.+?)(?:\s+\((?P<set_code>[^)]+)\))?\s+#(?P<number>\d+)\b"
)
POKEMON_HEADER_RE = re.compile(r"^(?P<name>.+?) - (?P<card_type>.+?) - (?P<hp>\d+) HP$")
ATTACK_RE = re.compile(r"^(?P<cost>[A-Z0]+)\s+(?P<name>.+?)(?:\s+(?P<damage>\d+(?:[+x-])?))?$")
WEAKNESS_RE = re.compile(r"^Weakness:\s*(.*)$", re.I)
RETREAT_RE = re.compile(r"^Retreat:\s*(.*)$", re.I)
ILLUS_RE = re.compile(r"^Illustrated by\s*(.*)$", re.I)
EX_RULE_RE = re.compile(r"^e\s*x\s+rule\s*:\s*(.*)$", re.I)
RARITY_RE = re.compile(r"^(?:[◊☆]+|Crown Rare)$", re.I)
VERSION_RE = re.compile(r"^(?P<set_name>.+?)\s+#(?P<number>\d+)\s*(?P<rest>.*)$")

NOISE_STOP_LINES = {
    "Limitless TCG",
    "About",
    "Contact",
    "Privacy Policy",
    "Site Notice",
    "Manage Cookies",
}


def clean(text):
    return re.sub(r"\s+", " ", (text or "").strip())


def unique_preserve(items):
    out = []
    seen = set()
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def make_session():
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": BASE_URL + "/",
        }
    )

    retry = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=1.0,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=frozenset(["GET"]),
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def sleep_delay(delay):
    if delay > 0:
        time.sleep(delay)


def fetch_text(session, url, delay=0.15, timeout=30):
    sleep_delay(delay)
    resp = session.get(url, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def save_json(path, data, retries=6, retry_delay=0.4):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=2)

    for attempt in range(retries):
        tmp = path.with_name(path.name + f".{uuid.uuid4().hex}.tmp")
        try:
            tmp.write_text(payload, encoding="utf-8")
            os.replace(tmp, path)
            return
        except PermissionError:
            try:
                if tmp.exists():
                    tmp.unlink()
            except OSError:
                pass
            time.sleep(retry_delay * (attempt + 1))

    # 最後退回直接寫入，若還被鎖住就給明確錯誤
    try:
        path.write_text(payload, encoding="utf-8")
    except PermissionError as e:
        raise PermissionError(
            f"{path} is locked by another program. "
            f"Close the file and retry."
        ) from e


def load_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def parse_sets_page(html_text):
    soup = BeautifulSoup(html_text, "html.parser")
    groups = OrderedDict()

    for a in soup.find_all("a", href=True):
        href = urljoin(BASE_URL, a["href"])
        m = re.fullmatch(re.escape(BASE_URL) + r"/cards/([^/?#]+)", href)
        if not m:
            continue
        code = m.group(1)
        if code.lower() == "cards":
            continue
        text = clean(" ".join(a.stripped_strings))
        if not text:
            continue
        groups.setdefault(code, []).append(text)

    sets = []
    for index, (code, raw_parts) in enumerate(groups.items(), start=1):
        parts = unique_preserve(raw_parts)

        release_date = next((p for p in parts if DATE_RE.fullmatch(p)), None)
        card_count = next((int(p) for p in parts if COUNT_RE.fullmatch(p)), None)

        name_candidates = [p for p in parts if not DATE_RE.fullmatch(p) and not COUNT_RE.fullmatch(p)]
        set_name = None

        for p in name_candidates:
            if p.endswith(code):
                set_name = p[: -len(code)].strip(" -")
                break

        if not set_name and name_candidates:
            set_name = max(name_candidates, key=len).strip()

        if card_count is None:
            raise ValueError(f"Could not parse card count for set {code}: {parts}")

        sets.append(
            {
                "set_code": code,
                "set_name": set_name or code,
                "release_date": release_date,
                "cards_in_set": card_count,
                "set_url": f"{BASE_URL}/cards/{code}",
                "index_order": index,
            }
        )

    return sets


def extract_image_url(soup, raw_html):
    candidates = []

    for tag in soup.find_all(True):
        for attr in ("href", "src", "data-src", "data-lazy-src", "content", "srcset"):
            val = tag.get(attr)
            if not val:
                continue

            if attr == "srcset":
                pieces = [part.strip().split(" ")[0] for part in val.split(",")]
            else:
                pieces = [val]

            for piece in pieces:
                piece = html_lib.unescape(piece.strip())
                if not piece:
                    continue
                full = urljoin(BASE_URL, piece)
                if "/pocket/" in full and full.lower().endswith((".webp", ".png", ".jpg", ".jpeg")):
                    candidates.append(full)

    if not candidates:
        candidates.extend(
            re.findall(
                r"https?://[^\s\"'>]+/pocket/[^\s\"'>]+\.(?:webp|png|jpe?g)",
                raw_html,
                flags=re.I,
            )
        )

    candidates = unique_preserve(candidates)
    candidates.sort(
        key=lambda u: (
            "digitaloceanspaces.com" not in u,
            "_EN" not in u,
            not u.lower().endswith(".webp"),
            len(u),
        )
    )
    return candidates[0] if candidates else None





def normalize_meta_text(text):
    text = clean(text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    text = re.sub(r"#\s+(\d+)", r"#\1", text)
    return text


def extract_text_lines(soup):
    soup = BeautifulSoup(str(soup), "html.parser")
    for bad in soup(["script", "style", "noscript"]):
        bad.decompose()

    # 不要只抓 <main>；新版卡頁有些資訊不一定都在 main 裡
    root = soup.body or soup

    lines = []
    prev = None

    for raw in root.get_text("\n").splitlines():
        line = normalize_meta_text(html_lib.unescape(raw))
        if not line:
            continue
        if line == prev:
            continue
        lines.append(line)
        prev = line

    return lines


def is_footer_line(line):
    return (
        line in NOISE_STOP_LINES
        or line.startswith("The literal and graphical information presented on this website")
    )


def looks_like_current_print_line(text, set_name, set_code, number):
    text = normalize_meta_text(text)
    patterns = [
        rf"{re.escape(set_name)}\s*(?:\(\s*{re.escape(set_code)}\s*\))?\s*#\s*{number}\b",
        rf"{re.escape(set_name)}\s*#\s*{number}\b",
    ]
    return any(re.search(p, text, flags=re.I) for p in patterns)


def find_versions_idx(lines, start_idx):
    for i in range(start_idx + 1, len(lines)):
        if lines[i] == "Versions":
            return i
        if is_footer_line(lines[i]):
            break
    return None


def find_current_page_line(lines, start_idx, end_idx, set_name, set_code, number):
    # 先試單行
    for i in range(start_idx + 1, end_idx):
        if looks_like_current_print_line(lines[i], set_name, set_code, number):
            return i, i + 1, normalize_meta_text(lines[i])

    # 再試被 get_text("\n") 拆開的多行
    for i in range(start_idx + 1, end_idx):
        buf = []
        for j in range(i, min(i + 8, end_idx)):
            if lines[j] == "Versions" or is_footer_line(lines[j]):
                break
            buf.append(lines[j])
            joined = normalize_meta_text(" ".join(buf))
            if looks_like_current_print_line(joined, set_name, set_code, number):
                return i, j + 1, joined

    return None, None, None


def is_attack_header(line):
    m = ATTACK_RE.match(line)
    if not m:
        return False
    cost = m.group("cost")
    return bool(cost) and all(ch.isupper() or ch.isdigit() for ch in cost)


def is_structured_line(line):
    return (
        bool(WEAKNESS_RE.match(line))
        or bool(RETREAT_RE.match(line))
        or bool(ILLUS_RE.match(line))
        or bool(EX_RULE_RE.match(line))
        or line.startswith("Ability:")
        or line.startswith("Pokémon -")
        or line.startswith("Trainer -")
        or is_attack_header(line)
        or line == "Versions"
    )


def parse_page_badges(line):
    parts = [clean(p) for p in line.split("·") if clean(p)]
    badges = parts[1:] if len(parts) > 1 else []
    rarity = next((b for b in badges if RARITY_RE.fullmatch(b)), None)
    other_labels = [b for b in badges if b != rarity]
    return {
        "raw": line,
        "badges": badges,
        "rarity": rarity,
        "labels": other_labels,
    }


def parse_version_line(line):
    line = clean(line)
    m = VERSION_RE.match(line)
    if not m:
        return {"raw": line}

    rest = clean(m.group("rest"))
    rarity = rest if RARITY_RE.fullmatch(rest) else None

    return {
        "raw": line,
        "set_name": clean(m.group("set_name")),
        "number": int(m.group("number")),
        "badge_text": rest or None,
        "rarity": rarity,
    }


def parse_card_page(raw_html, detail_url):
    soup = BeautifulSoup(raw_html, "html.parser")
    image_url = extract_image_url(soup, raw_html)

    title_text = clean(soup.title.get_text(" ", strip=True) if soup.title else "")
    title_match = TITLE_RE.search(title_text)
    if not title_match:
        raise ValueError(f"Could not parse title: {title_text!r}")

    title_info = title_match.groupdict()
    name = clean(title_info["name"])
    set_name = clean(title_info["set_name"])
    set_code = clean(title_info.get("set_code") or "")
    number = int(title_info["number"])

    lines = extract_text_lines(soup)

    start_idx = None
    for i, line in enumerate(lines):
        if line == name or line.startswith(name + " - "):
            start_idx = i
            break
    if start_idx is None:
        raise ValueError(f"Could not find start of card section for {detail_url}")

    versions_idx = find_versions_idx(lines, start_idx)
    if versions_idx is not None:
        end_idx = versions_idx
    else:
        end_idx = next(
            (i for i in range(start_idx + 1, len(lines)) if is_footer_line(lines[i])),
            len(lines),
        )

    cur_start, cur_end, current_page_line = find_current_page_line(
        lines, start_idx, end_idx, set_name, set_code, number
    )

    page_badges = (
        parse_page_badges(current_page_line)
        if current_page_line
        else {
            "raw": None,
            "badges": [],
            "rarity": None,
            "labels": [],
        }
    )

    skip_range = set(range(cur_start, cur_end)) if cur_start is not None else set()

    section = [
        line
        for idx, line in enumerate(lines[start_idx:end_idx], start=start_idx)
        if idx not in skip_range
    ]

    card = {
        "id": f"{set_code or set_name}-{number}",
        "name": name,
        "set_name": set_name,
        "set_code": set_code or None,
        "number": number,
        "detail_url": detail_url,
        "image_url": image_url,
        "page_line": current_page_line,
        "rarity": page_badges["rarity"],
        "source_labels": page_badges["labels"],
        "page_badges": page_badges["badges"],
        "supertype": None,
        "subtypes": [],
        "stage": None,
        "display_type": None,
        "hp": None,
        "evolves_from": None,
        "abilities": [],
        "attacks": [],
        "effect_text": None,
        "extra_text": None,
        "weakness": None,
        "retreat": None,
        "rule_box": None,
        "illustrator": None,
        "flavor_text": None,
        "versions": [],
    }

    i = 0
    if section:
        first_line = section[0]
        m = POKEMON_HEADER_RE.match(first_line)
        if m and clean(m.group("name")) == name:
            card["display_type"] = clean(m.group("card_type"))
            card["hp"] = int(m.group("hp"))
            i = 1

    if i < len(section):
        class_line = section[i]
        if class_line.startswith("Pokémon -") or class_line.startswith("Trainer -"):
            parts = [clean(p) for p in class_line.split(" - ") if clean(p)]
            card["supertype"] = parts[0]
            card["subtypes"] = parts[1:]
            if card["supertype"] == "Pokémon":
                for p in parts[1:]:
                    if p.startswith("Evolves from "):
                        card["evolves_from"] = p.split("Evolves from ", 1)[1].strip()
                    elif card["stage"] is None:
                        card["stage"] = p
            i += 1

    body = section[i:]
    after_illustrator = False
    current_obj = None
    trainer_effect_lines = []
    misc_lines = []
    flavor_lines = []

    idx = 0
    while idx < len(body):
        line = body[idx]

        illus = ILLUS_RE.match(line)
        if illus:
            card["illustrator"] = clean(illus.group(1)) or None
            after_illustrator = True
            current_obj = None
            idx += 1
            continue

        if after_illustrator:
            flavor_lines.append(line)
            idx += 1
            continue

        m = WEAKNESS_RE.match(line)
        if m:
            card["weakness"] = clean(m.group(1))
            current_obj = None
            idx += 1
            continue

        m = RETREAT_RE.match(line)
        if m:
            card["retreat"] = clean(m.group(1))
            current_obj = None
            idx += 1
            continue

        m = EX_RULE_RE.match(line)
        if m:
            rule_text = clean(m.group(1))
            extra = []
            j = idx + 1
            while j < len(body) and not is_structured_line(body[j]):
                extra.append(body[j])
                j += 1
            card["rule_box"] = clean(" ".join([rule_text] + extra))
            current_obj = None
            idx = j
            continue

        if card["supertype"] == "Trainer":
            trainer_effect_lines.append(line)
            idx += 1
            continue

        if line.startswith("Ability:"):
            ability = {
                "name": clean(line.split(":", 1)[1]),
                "text": "",
            }
            card["abilities"].append(ability)
            current_obj = ability
            idx += 1
            continue

        if is_attack_header(line):
            am = ATTACK_RE.match(line)
            attack = {
                "cost": am.group("cost"),
                "name": clean(am.group("name")),
                "damage": clean(am.group("damage") or "") or None,
                "text": "",
            }
            card["attacks"].append(attack)
            current_obj = attack
            idx += 1
            continue

        if current_obj is not None:
            current_obj["text"] = clean((current_obj.get("text", "") + " " + line).strip())
        else:
            if card["supertype"] == "Trainer":
                trainer_effect_lines.append(line)
            else:
                misc_lines.append(line)

        idx += 1

    if trainer_effect_lines:
        text = clean(" ".join(trainer_effect_lines))
        if text:
            card["effect_text"] = text

    if misc_lines:
        text = clean(" ".join(misc_lines))
        if text:
            card["extra_text"] = text

    if flavor_lines:
        text = clean(" ".join(flavor_lines))
        if text:
            card["flavor_text"] = text

    if versions_idx is not None:
        for line in lines[versions_idx + 1:]:
            if is_footer_line(line):
                break
            if not line or line == "Versions":
                continue
            card["versions"].append(parse_version_line(line))

    # 如果 page line 沒成功抓到 rarity，就從 versions 回填
    if not card["rarity"]:
        for v in card["versions"]:
            if (
                v.get("set_name") == set_name
                and v.get("number") == number
                and v.get("rarity")
            ):
                card["rarity"] = v["rarity"]
                break

    return card


def download_image(session, image_url, out_root, set_code, delay=0.15, timeout=30):
    if not image_url:
        return None

    filename = Path(urlparse(image_url).path).name
    image_dir = out_root / "images" / (set_code or "unknown")
    image_dir.mkdir(parents=True, exist_ok=True)
    image_path = image_dir / filename

    if image_path.exists() and image_path.stat().st_size > 0:
        return image_path

    sleep_delay(delay)
    with session.get(image_url, stream=True, timeout=timeout) as resp:
        resp.raise_for_status()
        tmp = image_path.with_suffix(image_path.suffix + ".tmp")
        with open(tmp, "wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 64):
                if chunk:
                    f.write(chunk)
        tmp.replace(image_path)

    return image_path


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Pokémon TCG Pocket cards and images from Limitless."
    )
    parser.add_argument("--output-dir", default="limitless_dump")
    parser.add_argument("--only-set", help="Example: B2b")
    parser.add_argument("--max-cards", type=int, default=None, help="For testing.")
    parser.add_argument("--delay", type=float, default=0.15, help="Delay between requests.")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--skip-images", action="store_true")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    out_root = Path(args.output_dir)
    out_root.mkdir(parents=True, exist_ok=True)

    session = make_session()

    print(f"Fetching sets from {SETS_URL}")
    sets_html = fetch_text(session, SETS_URL, delay=args.delay, timeout=args.timeout)
    sets = parse_sets_page(sets_html)

    if args.only_set:
        sets = [s for s in sets if s["set_code"] == args.only_set]
        if not sets:
            raise SystemExit(f"Set {args.only_set!r} not found.")

    sets_path = out_root / "limitless_sets.json"
    save_json(sets_path, sets)
    print(f"Saved {sets_path}")

    cards_path = out_root / "limitless_cards.json"
    errors_path = out_root / "limitless_errors.json"

    cards = load_json(cards_path, []) if args.resume else []
    errors = load_json(errors_path, []) if args.resume else []

    seen_urls = {c.get("detail_url") for c in cards if c.get("detail_url")}
    attempted_this_run = 0

    for s in sets:
        set_code = s["set_code"]
        set_name = s["set_name"]
        count = s["cards_in_set"]

        print(f"\n=== {set_code} / {set_name} ({count} cards) ===")

        for number in range(1, count + 1):
            detail_url = f"{BASE_URL}/cards/{set_code}/{number}"

            if detail_url in seen_urls:
                print(f"[skip] {detail_url}")
                continue

            if args.max_cards is not None and attempted_this_run >= args.max_cards:
                print("\nReached --max-cards limit, stopping.")
                save_json(cards_path, cards)
                save_json(errors_path, errors)
                print(f"Saved cards:  {cards_path}")
                print(f"Saved sets:   {sets_path}")
                print(f"Saved errors: {errors_path}")
                if not args.skip_images:
                    print(f"Saved images: {out_root / 'images'}")
                return

            attempted_this_run += 1
            print(f"[try {attempted_this_run}] {detail_url}")

            try:
                raw_html = fetch_text(session, detail_url, delay=args.delay, timeout=args.timeout)
                card = parse_card_page(raw_html, detail_url)

                if not args.skip_images:
                    image_path = download_image(
                        session,
                        card.get("image_url"),
                        out_root,
                        set_code,
                        delay=args.delay,
                        timeout=args.timeout,
                    )
                    card["image_path"] = str(image_path).replace("\\", "/") if image_path else None
                else:
                    card["image_path"] = None

                cards.append(card)
                seen_urls.add(detail_url)

                print(f"  OK: {card['name']} ({card['set_code']} #{card['number']})")

            except Exception as e:
                err = {"detail_url": detail_url, "error": str(e)}
                errors.append(err)
                print(f"  ERROR: {e}")

            save_json(cards_path, cards)
            save_json(errors_path, errors)

    print("\nDone.")
    print(f"Saved cards:  {cards_path}")
    print(f"Saved sets:   {sets_path}")
    print(f"Saved errors: {errors_path}")
    if not args.skip_images:
        print(f"Saved images: {out_root / 'images'}")


if __name__ == "__main__":
    main()