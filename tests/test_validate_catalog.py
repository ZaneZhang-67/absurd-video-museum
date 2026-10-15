import copy
import json
import unittest
from pathlib import Path

from scripts.validate_catalog import CatalogError, validate_catalog


ROOT = Path(__file__).resolve().parents[1]


class CatalogValidationTest(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))

    def test_repository_catalog_is_valid(self):
        validate_catalog(self.catalog, ROOT)

    def test_missing_local_media_is_rejected(self):
        self.catalog["videos"][0]["media"]["src"] = "media/does-not-exist.mp4"

        with self.assertRaisesRegex(CatalogError, "does not exist"):
            validate_catalog(self.catalog, ROOT)

    def test_duplicate_video_id_is_rejected(self):
        duplicate = copy.deepcopy(self.catalog["videos"][0])
        self.catalog["videos"].append(duplicate)

        with self.assertRaisesRegex(CatalogError, "ids must be unique"):
            validate_catalog(self.catalog, ROOT)

    def test_one_sided_lineage_is_rejected(self):
        child = copy.deepcopy(self.catalog["videos"][0])
        child["id"] = "unexpected-descendant"
        child["lineage"]["parents"] = ["signal-lost-human-found"]
        self.catalog["videos"].append(child)

        with self.assertRaisesRegex(CatalogError, "must list unexpected-descendant as a child"):
            validate_catalog(self.catalog, ROOT)


if __name__ == "__main__":
    unittest.main()
