#!/usr/bin/env python3

import argparse
import asyncio
import json
from pathlib import Path
from urllib.parse import parse_qsl, quote_plus, urlencode, urljoin, urlsplit, urlunsplit

import requests
from playwright.sync_api import sync_playwright

BASE = "https://dribbble.com"
SEARCH_URL = "https://dribbble.com/search/{}"
HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
}


def normalize_thumbnail(url: str) -> str:
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    if "resize" in query:
        query["resize"] = "1000x0"
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    return url


def search_designs(topic: str) -> list[dict]:
    search_url = SEARCH_URL.format(quote_plus(topic.strip()))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers(HEADERS)
        page.goto(search_url)
        page.wait_for_selector("div.js-thumbnail-base.shot-thumbnail-base", timeout=30000)

        designs: list[dict] = []
        cards = page.query_selector_all("div.js-thumbnail-base.shot-thumbnail-base")
        for card in cards:
            link = card.query_selector("a.shot-thumbnail-link")
            if not link:
                continue

            href = link.get_attribute("href")
            if not href:
                continue

            text_node = link.query_selector("span.accessibility-text")
            name = (text_node.inner_text().strip() if text_node else href.rsplit("/", 1)[-1].replace("-", " "))
            if name.lower().startswith("view "):
                name = name[5:].strip()

            thumb = None
            noscript_img = card.query_selector("noscript img")
            if noscript_img:
                thumb = noscript_img.get_attribute("src")
            if not thumb:
                img = card.query_selector("figure img")
                if img:
                    thumb = img.get_attribute("data-src") or img.get_attribute("src")

            if thumb and thumb.startswith("data:image/"):
                thumb = None
            if thumb:
                thumb = normalize_thumbnail(thumb)

            item = {
                "name": name,
                "href": urljoin(BASE, href),
                "thumbnail": thumb,
            }
            designs.append(item)

        browser.close()

    return designs


def file_name(index: int, image_url: str) -> str:
    name = Path(urlsplit(image_url).path).name or f"image_{index}.jpg"
    if "." not in name:
        name += ".jpg"
    return f"{index:04d}_{name}"


def download_one(image_url: str, out_path: Path) -> None:
    response = requests.get(image_url, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=60)
    response.raise_for_status()
    out_path.write_bytes(response.content)


async def download_design_images(designs: list[dict], output_dir: Path, concurrency: int = 10) -> list[dict]:
    output_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(concurrency)

    async def worker(index: int, design: dict) -> None:
        image_url = design.get("thumbnail")
        if not image_url:
            design["local_image"] = None
            return

        out_path = output_dir / file_name(index, image_url)
        async with sem:
            try:
                await asyncio.to_thread(download_one, image_url, out_path)
                design["local_image"] = str(out_path)
            except Exception:
                design["local_image"] = None

    tasks = [asyncio.create_task(worker(i, design)) for i, design in enumerate(designs, start=1)]
    if tasks:
        await asyncio.gather(*tasks)

    return designs


def run(topic: str) -> list[dict]:
    safe_topic = "-".join(topic.strip().lower().split()) or "search"
    output_dir = Path("images") / safe_topic
    designs = search_designs(topic)
    return asyncio.run(download_design_images(designs, output_dir))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search Dribbble designs by topic and download thumbnails.")
    parser.add_argument("topic", type=str, help="Search topic, example: muslim app")
    args = parser.parse_args()

    result = run(args.topic)
    print(json.dumps(result, indent=2, ensure_ascii=False))
