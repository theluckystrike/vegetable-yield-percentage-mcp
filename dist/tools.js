// Tool registry shared by the stdio and Worker entries.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InputError, PRODUCE, REPO, SITE, calculateAmountToBuy, calculateEdibleWeight, getVegetableYield, listVegetableYields } from './core.js';
export const VERSION = '1.0.0';
export const TOOL_INFO = [
    { name: 'get_vegetable_yield', blurb: 'USDA edible yield percent, refuse percent and what the refuse is (skin, seeds, core) for a raw vegetable or fruit, with USDA household weights such as 1 medium onion or 1 cup chopped.' },
    { name: 'calculate_edible_weight', blurb: 'Edible weight and trim waste from a purchased weight, for example 5 lb of pineapple.' },
    { name: 'calculate_amount_to_buy', blurb: 'How much produce to buy for a recipe amount (grams, pounds or a measure such as 2 cups chopped), as purchased weight and whole-item count.' },
    { name: 'list_vegetable_yields', blurb: `Browse all ${PRODUCE.length} raw fruits and vegetables by edible yield, highest or lowest first.` },
];
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
function ok(data) {
    return { content: [{ type: 'text', text: `${data.summary}\n\n${JSON.stringify(data, null, 2)}` }], structuredContent: data };
}
function fail(e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { isError: true, content: [{ type: 'text', text: `${e instanceof InputError ? 'Error' : 'Internal error'}: ${msg}` }] };
}
const food = z.string().min(2).max(120).describe('Raw vegetable or fruit in plain words, for example "onion", "red bell pepper", "pineapple", "butternut squash", "broccoli", "avocado".');
export function createServer() {
    const server = new McpServer({ name: REPO, version: VERSION, websiteUrl: SITE }, {
        instructions: `Edible yield (as purchased weight minus refuse such as peel, seeds, cores and trimmings) for ${PRODUCE.length} raw vegetables and fruits, with USDA household weights, from the USDA National Nutrient Database for Standard Reference (SR28). ` +
            'Trim loss ranges from 0% to over 60% by item; do not guess it, call these tools.',
    });
    server.registerTool('get_vegetable_yield', {
        title: 'Get vegetable yield percentage',
        description: 'USDA edible yield percent for a raw vegetable or fruit (the share left after removing peel, seeds, core, stems and trimmings), the refuse percent and what the refuse is, plus USDA household weights (1 medium, 1 cup chopped, 1 clove) and the as-purchased weight of one whole item. From USDA SR28 refuse data.',
        inputSchema: { food },
        annotations: { title: 'Vegetable yield percentage', ...RO },
    }, async (a) => { try {
        return ok(getVegetableYield(a));
    }
    catch (e) {
        return fail(e);
    } });
    server.registerTool('calculate_edible_weight', {
        title: 'Calculate edible weight',
        description: 'Edible weight and trim waste from a purchased (as purchased, untrimmed) weight of a raw vegetable or fruit, using the USDA edible yield percent.',
        inputSchema: {
            food,
            purchased_weight: z.number().positive().max(1e6).describe('Weight as bought, for example 5.'),
            unit: z.string().min(1).max(12).optional().describe('g, kg, oz or lb. Default g.'),
        },
        annotations: { title: 'Edible weight', ...RO },
    }, async (a) => { try {
        return ok(calculateEdibleWeight(a));
    }
    catch (e) {
        return fail(e);
    } });
    server.registerTool('calculate_amount_to_buy', {
        title: 'Calculate how much produce to buy',
        description: 'How much of a raw vegetable or fruit to buy for a recipe amount. Give the prepared amount in g, kg, oz or lb, or as a USDA household measure such as "cup chopped", "cup sliced", "medium" or "clove". ' +
            'Returns the edible weight needed, the as-purchased weight to buy at the USDA edible yield, and the number of whole items (for example medium onions) to buy.',
        inputSchema: {
            food,
            amount: z.number().positive().max(1e6).describe('Prepared amount, for example 3 (cups) or 500 (grams).'),
            measure: z.string().min(1).max(40).optional().describe('g, kg, oz, lb, or a household measure such as "cup chopped", "cup sliced", "tbsp", "medium", "large", "clove". Default g.'),
        },
        annotations: { title: 'Produce to buy', ...RO },
    }, async (a) => { try {
        return ok(calculateAmountToBuy(a));
    }
    catch (e) {
        return fail(e);
    } });
    server.registerTool('list_vegetable_yields', {
        title: 'List vegetable and fruit yields',
        description: 'List raw vegetables and fruits with their USDA edible yield percent, filtered to fruit or vegetable and sorted by name, lowest yield or highest yield.',
        inputSchema: {
            category: z.enum(['fruit', 'vegetable']).optional().describe('fruit or vegetable.'),
            sort: z.enum(['name', 'yield_low', 'yield_high']).optional().describe('name (default), yield_low or yield_high.'),
            limit: z.number().int().min(1).max(400).optional().describe('Rows to return, default 50.'),
        },
        annotations: { title: 'List yields', ...RO },
    }, async (a) => { try {
        return ok(listVegetableYields(a));
    }
    catch (e) {
        return fail(e);
    } });
    return server;
}
