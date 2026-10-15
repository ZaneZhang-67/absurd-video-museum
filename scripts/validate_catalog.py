#!/usr/bin/env python3

import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SCORE_NAMES = ("logic_gap", "performance", "remixability", "context_collapse")


class CatalogError(ValueError):
    pass


def require_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise CatalogError(f"{field} must be a non-empty string")


def require_web_url(value, field):
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise CatalogError(f"{field} must be an HTTP(S) URL")


def require_repository_file(repo_root, relative_path, field):
    require_text(relative_path, field)
    path = Path(relative_path)
    if path.is_absolute() or ".." in path.parts:
        raise CatalogError(f"{field} must stay inside the repository")
    if not (repo_root / path).is_file():
        raise CatalogError(f"{field} does not exist: {relative_path}")


def validate_video(video, repo_root):
    video_id = video["id"]
    require_text(video_id, "id")
    if not ID_PATTERN.fullmatch(video_id):
        raise CatalogError(f"invalid id: {video_id}")

    for field in ("title", "summary", "language"):
        require_text(video[field], f"{video_id}.{field}")
    date.fromisoformat(video["published_at"])
    date.fromisoformat(video["added_at"])

    tags = video["tags"]
    if not isinstance(tags, list) or not tags:
        raise CatalogError(f"{video_id}.tags must be a non-empty list")
    if len(tags) != len(set(tags)):
        raise CatalogError(f"{video_id}.tags contains duplicates")
    for tag in tags:
        require_text(tag, f"{video_id}.tags[]")

    media = video["media"]
    duration = media["duration_seconds"]
    if not isinstance(duration, (int, float)) or isinstance(duration, bool) or duration <= 0:
        raise CatalogError(f"{video_id}.media.duration_seconds must be positive")
    if media["type"] == "local":
        require_repository_file(repo_root, media["src"], f"{video_id}.media.src")
    elif media["type"] == "external":
        require_web_url(media["src"], f"{video_id}.media.src")
    else:
        raise CatalogError(f"{video_id}.media.type must be local or external")
    require_repository_file(repo_root, media["poster"], f"{video_id}.media.poster")

    provenance = video["provenance"]
    for field in ("creator", "submitted_by", "source_note"):
        require_text(provenance[field], f"{video_id}.provenance.{field}")
    if provenance["original_url"] is not None:
        require_web_url(provenance["original_url"], f"{video_id}.provenance.original_url")

    rights = video["rights"]
    for field in ("license", "owner", "evidence"):
        require_text(rights[field], f"{video_id}.rights.{field}")

    previous_time = -1.0
    for moment in video["moments"]:
        timestamp = moment["at"]
        require_text(moment["label"], f"{video_id}.moments[].label")
        if not isinstance(timestamp, (int, float)) or isinstance(timestamp, bool):
            raise CatalogError(f"{video_id}.moments[].at must be numeric")
        if timestamp < 0 or timestamp > duration:
            raise CatalogError(f"{video_id} has a moment outside its duration")
        if timestamp <= previous_time:
            raise CatalogError(f"{video_id}.moments must be strictly chronological")
        previous_time = timestamp

    scores = video["absurdity"]
    if set(scores) != set(SCORE_NAMES):
        raise CatalogError(f"{video_id}.absurdity must contain exactly {SCORE_NAMES}")
    for name in SCORE_NAMES:
        score = scores[name]
        if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 10:
            raise CatalogError(f"{video_id}.absurdity.{name} must be an integer from 0 to 10")

    lineage = video["lineage"]
    for relation in ("parents", "children"):
        references = lineage[relation]
        if not isinstance(references, list) or len(references) != len(set(references)):
            raise CatalogError(f"{video_id}.lineage.{relation} must be a unique list")
        if video_id in references:
            raise CatalogError(f"{video_id} cannot be its own {relation[:-1]}")


def validate_catalog(catalog, repo_root):
    if catalog["version"] != 1:
        raise CatalogError("catalog.version must be 1")
    videos = catalog["videos"]
    if not isinstance(videos, list) or not videos:
        raise CatalogError("catalog.videos must be a non-empty list")

    for video in videos:
        validate_video(video, repo_root)

    by_id = {video["id"]: video for video in videos}
    if len(by_id) != len(videos):
        raise CatalogError("video ids must be unique")

    for video_id, video in by_id.items():
        for parent_id in video["lineage"]["parents"]:
            if parent_id not in by_id:
                raise CatalogError(f"{video_id} references missing parent {parent_id}")
            if video_id not in by_id[parent_id]["lineage"]["children"]:
                raise CatalogError(f"{parent_id} must list {video_id} as a child")
        for child_id in video["lineage"]["children"]:
            if child_id not in by_id:
                raise CatalogError(f"{video_id} references missing child {child_id}")
            if video_id not in by_id[child_id]["lineage"]["parents"]:
                raise CatalogError(f"{child_id} must list {video_id} as a parent")


def main():
    catalog_path = Path(sys.argv[1]) if len(sys.argv) == 2 else ROOT / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    validate_catalog(catalog, catalog_path.resolve().parent)
    print(f"Validated {len(catalog['videos'])} video specimen(s) in {catalog_path}")


if __name__ == "__main__":
    main()
