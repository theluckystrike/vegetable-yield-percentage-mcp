# Data sources

All numbers were fetched on 2026-11-03. Nothing comes from model memory.

## Refuse and household weights

- USDA National Nutrient Database for Standard Reference, Release 28 (September 2015), ASCII files:
  https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip
  (fetched 2026-11-03, HTTP 200, 6,231,932 bytes, sha256 8308fd1d224ef1e5331093748007180da01a7ac713cbac6a1f5bc2a03e1ee70a).
  - `FOOD_DES.txt`: food group, long description, scientific name, `Ref_desc` (refuse description) and `Refuse` (percent).
  - `WEIGHT.txt`: household measures and their gram weights.
- SR28 documentation, inside the same zip as `sr28_doc.pdf` and at https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/sr28_doc.pdf (HTTP 200 on 2026-11-03):
  - p. 5: "The refuse and refuse description fields contain amounts and descriptions of inedible material (for example, seeds, bone, and skin) ... expressed as a percentage of the total weight of the item as purchased". Refuse data come from NFNAP and USDA Agriculture Handbooks 102 and 456.
  - Weights and Measures: "Weights are given for edible material without refuse, that is, the weight of an apple without the core or stem".

`scripts/build_data.py` keeps food groups 0900 (Fruits and Fruit Juices) and 1100 (Vegetables and Vegetable
Products) whose description contains "raw" as a comma-separated term and whose `Refuse` field is filled:
305 items (114 fruit, 191 vegetable) with 790 household weights. Values are copied unchanged.

Derived numbers:
- edible yield percent = 100 - Refuse.
- as purchased weight = edible weight / (edible yield / 100).
- whole-item weight: the USDA measure for one item (medium first, then fruit, then the item's own name, then large, head, small, ear, bunch, clove, stalk). Measures given for half a fruit (grapefruit) are doubled.

## Units

- NIST SP 811 Appendix B.9, https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9:
  1 lb = 0.45359237 kg exactly, 1 oz = 1/16 lb = 28.349523125 g.

## Money site

- https://ingredientcalculator.com/vegetable-yield-percentage-calculator (HTTP 200 with the UTM query on 2026-11-03, listed in https://ingredientcalculator.com/sitemap.xml).

## Not used

- USDA FSIS FoodKeeper data (https://www.fsis.usda.gov/shared/data/EN/foodkeeper.json) and foodsafety.gov answered HTTP 403 (Akamai) to this host on 2026-11-03, so food storage times were not built.
