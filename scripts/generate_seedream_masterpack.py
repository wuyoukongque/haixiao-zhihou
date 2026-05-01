#!/usr/bin/env python3
"""Generate the visual masterpack with Volcengine Ark Seedream.

Credentials are read from environment variables only. Do not hard-code keys.

Required:
  ARK_API_KEY

Optional:
  ARK_API_URL       default: https://ark.cn-beijing.volces.com/api/v3/images/generations
  ARK_IMAGE_MODEL   default: doubao-seedream-4-0-250828
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
DEFAULT_MODEL = "doubao-seedream-4-0-250828"

SIZE_BY_RATIO = {
    "3:4": "1728x2304",
    "4:5": "1840x2304",
    "16:9": "2304x1296",
    "4:3": "2304x1728",
    "16:10": "2560x1600",
    "9:16": "1296x2304",
}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9_-]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "asset"


def request_json(url: str, api_key: str, payload: dict) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc


def download_file(url: str, output_path: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "haixiao-ebook/1.0"})
    with urllib.request.urlopen(request, timeout=180) as response:
        output_path.write_bytes(response.read())


def extract_image_urls(response: dict) -> list[str]:
    urls: list[str] = []
    for item in response.get("data", []):
        url = item.get("url")
        if url:
            urls.append(url)
    return urls


def generate_asset(
    *,
    api_url: str,
    api_key: str,
    model: str,
    asset: dict,
    output_dir: Path,
    variants: int,
    dry_run: bool,
) -> list[Path]:
    asset_id = slugify(asset["id"])
    ratio = asset.get("ratio", "16:9")
    size = SIZE_BY_RATIO.get(ratio, ratio)
    prompt = asset["prompt"]
    saved_paths: list[Path] = []

    asset_dir = output_dir / asset_id
    asset_dir.mkdir(parents=True, exist_ok=True)
    run_id = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")

    metadata = {
        "id": asset["id"],
        "name": asset.get("name"),
        "ratio": ratio,
        "size": size,
        "model": model,
        "prompt": prompt,
        "variants": variants,
    }
    (asset_dir / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    for variant in range(1, variants + 1):
        payload = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "response_format": "url",
            "watermark": False,
            "stream": False,
            "sequential_image_generation": "disabled",
        }

        if dry_run:
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            continue

        print(f"Generating {asset_id} variant {variant}/{variants} ({size})...")
        response = request_json(api_url, api_key, payload)
        urls = extract_image_urls(response)
        if not urls:
            raise RuntimeError(f"No image URL returned for {asset_id}: {response}")

        for index, image_url in enumerate(urls, start=1):
            suffix = Path(image_url.split("?", 1)[0]).suffix or ".jpeg"
            output_path = asset_dir / f"{asset_id}-{run_id}-v{variant}-{index}{suffix}"
            download_file(image_url, output_path)
            saved_paths.append(output_path)
            print(f"Saved {output_path}")

        time.sleep(1.5)

    return saved_paths


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--prompts",
        default="visual/masterpack-prompts.json",
        help="Path to masterpack prompts JSON.",
    )
    parser.add_argument(
        "--output",
        default="visual/outputs/masterpack",
        help="Directory where generated images will be saved.",
    )
    parser.add_argument("--asset", help="Generate only one asset id.")
    parser.add_argument("--variants", type=int, default=3)
    parser.add_argument("--model", default=os.environ.get("ARK_IMAGE_MODEL", DEFAULT_MODEL))
    parser.add_argument("--api-url", default=os.environ.get("ARK_API_URL", DEFAULT_API_URL))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    api_key = os.environ.get("ARK_API_KEY")
    if not api_key and not args.dry_run:
        print(
            "Missing ARK_API_KEY. Create a Volcengine Ark API Key and export it before running.",
            file=sys.stderr,
        )
        return 2

    prompt_path = Path(args.prompts)
    data = json.loads(prompt_path.read_text(encoding="utf-8"))
    assets = data["assets"]
    if args.asset:
        assets = [asset for asset in assets if asset["id"] == args.asset]
        if not assets:
            print(f"No asset found with id: {args.asset}", file=sys.stderr)
            return 2

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    all_paths: list[Path] = []
    for asset in assets:
        all_paths.extend(
            generate_asset(
                api_url=args.api_url,
                api_key=api_key or "",
                model=args.model,
                asset=asset,
                output_dir=output_dir,
                variants=args.variants,
                dry_run=args.dry_run,
            )
        )

    if all_paths:
        manifest = {
            "created_at": int(time.time()),
            "model": args.model,
            "api_url": args.api_url,
            "paths": [str(path) for path in all_paths],
        }
        (output_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
