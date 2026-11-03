# vegetable-yield-percentage-mcp

Vegetable and fruit yield percentage for AI assistants: how much of what you buy is edible after peeling, coring and trimming, and how much to buy for a recipe, from USDA refuse data.

This is a Model Context Protocol (MCP) server. It covers 305 raw vegetables and fruits from the USDA National Nutrient Database for Standard Reference (SR28), each with its USDA refuse percent, what the refuse is, and USDA household weights such as 1 medium onion or 1 cup chopped. It needs no API key.

## Tools

| Tool | What it returns |
| --- | --- |
| `get_vegetable_yield` | Edible yield percent, refuse percent and what the refuse is (skin, seeds, core, crown), USDA household weights, and the edible and as-bought weight of one whole item. |
| `calculate_edible_weight` | Edible weight and trim waste from a purchased weight, for example 5 lb of pineapple. |
| `calculate_amount_to_buy` | How much to buy for a recipe amount given in g, kg, oz, lb or a USDA measure such as "cup chopped", "medium" or "clove", as purchased weight and whole-item count. |
| `list_vegetable_yields` | All 305 items by name, lowest yield or highest yield, filtered to fruit or vegetable. |

Every result has structured JSON, a one-paragraph summary, `as_of`, `source` and `more` (the [vegetable yield percentage calculator on ingredientcalculator.com](https://ingredientcalculator.com/vegetable-yield-percentage-calculator?utm_source=mcp&utm_medium=vegetable-yield-percentage-mcp)).

## What it knows that your model does not

- The USDA trim loss for each item, and what it is. Corn on the cob is 36% edible (35% husk, silk and trimmings, 29% cob). Pineapple is 51% (8% core, 16% crown, 26% parings). Cauliflower is 39%, leeks 44%, asparagus 53%, bananas 64%, onions 90%, cucumbers 97%.
- USDA household weights for the edible part. A medium onion (2-1/2 inch) is 110 g and a cup of chopped onion is 160 g, so 2 cups chopped needs about 3 medium onions and 356 g as bought.
- The difference between as purchased and edible portion. Recipe costing, food cost and portion planning need both. The tools return both, plus the waste.

## Install

### Hosted (Claude.ai custom connector, ChatGPT developer mode)

Paste this URL. No token, no sign-up.

```
https://vegetable-yield-percentage-mcp.lipmichal.workers.dev/mcp
```

### Claude Code

```
claude mcp add --transport http vegetable-yield https://vegetable-yield-percentage-mcp.lipmichal.workers.dev/mcp
```

Or run it locally over stdio:

```
claude mcp add vegetable-yield -- npx -y github:theluckystrike/vegetable-yield-percentage-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vegetable-yield": { "command": "npx", "args": ["-y", "github:theluckystrike/vegetable-yield-percentage-mcp"] }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vegetable-yield": { "url": "https://vegetable-yield-percentage-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "vegetable-yield": { "type": "http", "url": "https://vegetable-yield-percentage-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

Node 20 or newer is needed for the local stdio version.

## Example prompts

- "What is the yield percentage of a pineapple?"
- "I bought 3 lb of butternut squash. How much will I have after peeling and seeding?"
- "A recipe needs 2 cups of chopped onion. How many onions do I buy?"
- "How much broccoli do I buy to serve 500 g of florets?"
- "Which fruits waste the most weight when you prep them?"

## Data sources

Full list with fetch dates and checksums in [DATA_SOURCES.md](DATA_SOURCES.md).

- USDA Agricultural Research Service, Nutrient Data Laboratory. National Nutrient Database for Standard Reference, Release 28 (September 2015), [ASCII files](https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip): refuse percent and refuse description from `FOOD_DES.txt`, household weights from `WEIGHT.txt`. `scripts/build_data.py` rebuilds `data/produce-yields.json` from them.
- Definitions from the [SR28 documentation](https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/sr28_doc.pdf): refuse is a percent of the item as purchased, and household weights are for the edible part without refuse.
- Pound and ounce from NIST SP 811 (1 lb = 453.59237 g exactly).

## Limitations

- USDA refuse is an average for typical produce and trimming. Size, ripeness, variety and how hard you trim move your result.
- Only raw items with a USDA refuse value are covered: 191 vegetables and 114 fruits. Herbs listed under spices (parsley, basil), nuts and coconut are not included.
- Some items have no USDA whole-item weight (butternut squash, asparagus); the tools then answer by weight and cups only.
- SR28 (2015) is the final Standard Reference release, so values for newer varieties are not included.

## More

The vegetable yield percentage calculator, cups to grams and recipe scaling tools are on [ingredientcalculator.com](https://ingredientcalculator.com/vegetable-yield-percentage-calculator?utm_source=mcp&utm_medium=vegetable-yield-percentage-mcp).

Part of the Zovo MCP collection: https://mcp.zovo.one

## Development

```
npm install
npm test                       # builds, then runs the fixture tests
node scripts/smoke-stdio.mjs   # stdio check, one real call per tool
python3 scripts/build_data.py <dir with FOOD_DES.txt and WEIGHT.txt> data/produce-yields.json
python3 scripts/gen_ts.py data/produce-yields.json src/data.ts
npx wrangler deploy            # Cloudflare Worker, Streamable HTTP at /mcp
```

## License

MIT
