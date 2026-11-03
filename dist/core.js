// Pure core: edible yield (100 - refuse) and household weights for raw fruits and vegetables from USDA SR28. No I/O.
import { PRODUCE } from './data.js';
export const REPO = 'vegetable-yield-percentage-mcp';
export const SITE = 'https://ingredientcalculator.com';
export const UTM = `utm_source=mcp&utm_medium=${REPO}`;
export const MORE = `${SITE}/vegetable-yield-percentage-calculator?${UTM}`;
export const SOURCE = 'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip';
export const SOURCE_DOC = 'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/sr28_doc.pdf';
export const AS_OF = '2015-09 (USDA National Nutrient Database for Standard Reference, Release 28; file checked 2026-11-03)';
export { PRODUCE };
export class InputError extends Error {
}
export const round = (x, d = 1) => { const f = 10 ** d; return Math.round(x * f) / f; };
export const UNITS = { gram: 1, kilogram: 1000, ounce: 28.349523125, pound: 453.59237 };
const UNIT_ALIASES = {
    g: 'gram', gram: 'gram', grams: 'gram', kg: 'kilogram', kilo: 'kilogram', kilos: 'kilogram', kilogram: 'kilogram', kilograms: 'kilogram',
    oz: 'ounce', ounce: 'ounce', ounces: 'ounce', lb: 'pound', lbs: 'pound', pound: 'pound', pounds: 'pound',
};
export const weightUnit = (u) => UNIT_ALIASES[u.trim().toLowerCase().replace(/\.$/, '')] ?? null;
export function stem(w) {
    if (w.length > 4 && w.endsWith('ies'))
        return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(oes|ches|shes|xes|sses)$/.test(w))
        return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us'))
        return w.slice(0, -1);
    return w;
}
const STOP = new Set(['raw', 'fresh', 'the', 'a', 'an', 'of', 'and', 'or', 'whole', 'how', 'much', 'many', 'to', 'in', 'yield', 'percentage', 'percent']);
export const tokens = (s) => s.toLowerCase().replace(/\([^)]*\)/g, (m) => m.slice(1, -1)).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem);
// Common names to SR28 wording.
const SYN = [
    [/\bbell peppers?\b|\bsweet peppers?\b|\bcapsicums?\b/g, 'peppers sweet'],
    [/\bgreen onions?\b|\bscallions?\b|\bspring onions?\b/g, 'onions spring scallions'],
    [/\bcilantro\b|\bcoriander leaves\b/g, 'coriander cilantro leaves'],
    [/\bzucchinis?\b|\bcourgettes?\b/g, 'squash summer zucchini'],
    [/\baubergines?\b/g, 'eggplant'],
    [/\bcorn on the cob\b|\bsweet ?corn\b|\bcorn\b/g, 'corn sweet yellow'],
    [/\bromaine\b/g, 'lettuce cos romaine'],
    [/\biceberg\b/g, 'lettuce iceberg'],
    [/\bgreen beans?\b|\bstring beans?\b/g, 'beans snap green'],
    [/\bsnow peas?\b|\bsugar snap peas?\b|\bsnap peas?\b/g, 'peas edible podded'],
    [/\bjalapenos?\b/g, 'peppers jalapeno'],
    [/\bkiwis?\b/g, 'kiwifruit'],
    [/\bcantaloupes?\b/g, 'melons cantaloupe'],
    [/\bhoneydews?\b/g, 'melons honeydew'],
    [/\brocket\b|\barugula\b/g, 'arugula'],
    [/\bbeetroots?\b|\bbeets?\b/g, 'beets'],
    [/\bchilli\b|\bchili\b|\bchile\b/g, 'peppers hot chili'],
    [/\bginger\b/g, 'ginger root'],
    [/\bsweet potato(es)?\b|\byams?\b/g, 'sweet potato'],
    [/(?<!sweet )\bpotato(es)?\b/g, 'potatoes flesh skin'],
    [/\bspuds?\b/g, 'potatoes flesh skin'],
    [/\bbutternut\b/g, 'squash winter butternut'],
    [/\bacorn squash\b/g, 'squash winter acorn'],
    [/\bspaghetti squash\b/g, 'squash winter spaghetti'],
    [/\bbrussels? sprouts?\b/g, 'brussels sprouts'],
    [/\bbok choy\b|\bpak choi\b/g, 'cabbage chinese pak choi'],
    [/\bnapa\b/g, 'cabbage chinese pe tsai'],
    [/\bmushrooms?\b(?!.*(shiitake|portabella|oyster|enoki|chanterelle|morel|maitake|crimini|brown))/g, 'mushrooms white'],
    [/\bcucumbers?\b(?!.*peeled)/g, 'cucumber with peel'],
    [/\bapples?\b(?!.*(without|peeled))/g, 'apples with skin'],
    [/\boranges?\b/g, 'oranges all commercial varieties'],
    [/\bavocados?\b/g, 'avocados all commercial varieties'],
    [/\btomato(es)?\b/g, 'tomatoes red ripe year round average'],
    [/\bstrawberry\b|\bstrawberries\b/g, 'strawberries'],
    [/\bgrapes?\b/g, 'grapes red green european type'],
    [/\bcherry\b|\bcherries\b/g, 'cherries sweet'],
    [/\blemons?\b(?! peel)/g, 'lemons'],
    [/\blimes?\b/g, 'limes'],
    [/\bpineapples?\b/g, 'pineapple all varieties'],
    [/\bpeppers?\b(?!.*(hot|jalapeno|chili|serrano|hungarian|banana))/g, 'peppers sweet'],
];
export function normalize(q) {
    let s = ` ${q.toLowerCase()} `;
    for (const [re, rep] of SYN)
        s = s.replace(re, ` ${rep} `);
    return s.replace(/\s+/g, ' ').trim();
}
export function rankProduce(food) {
    if (!food || !food.trim())
        throw new InputError('food is required, for example "onion", "pineapple", "broccoli" or "butternut squash".');
    const q = [...new Set(tokens(normalize(food)))];
    if (!q.length)
        throw new InputError(`Could not read a food name from "${food}".`);
    const raw = [...new Set(tokens(food))];
    const out = [];
    for (const item of PRODUCE) {
        const d = tokens(item.description);
        const ds = new Set(d);
        const head = new Set(tokens(item.description.split(',')[0]));
        let s = 0;
        for (const t of q)
            if (ds.has(t))
                s += head.has(t) ? 2 : 1;
        // Every word the user typed that is a head noun anywhere must be in this item's head (stops "onion" -> "Peppers ... onion").
        if (!q.some((t) => head.has(t)))
            continue;
        s -= 0.05 * Math.max(0, d.length - q.length); // fewer extra words is closer
        if (/all areas|all commercial varieties|all varieties|year round average/.test(item.description))
            s += 0.1;
        for (const h of head)
            if (!q.includes(h))
                s -= 0.4; // "Lemon peel", "Grapefruit juice", "Jerusalem-artichokes" rank under the plain item
        for (const t of raw)
            if (!ds.has(t) && !q.includes(t))
                s -= 0.2;
        if (s > 0)
            out.push({ item, score: s });
    }
    return out.sort((a, b) => b.score - a.score || a.item.description.length - b.item.description.length);
}
function pickFood(food) {
    const m = rankProduce(food);
    if (!m.length) {
        throw new InputError(`"${food}" was not found among the ${PRODUCE.length} raw fruits and vegetables with a USDA refuse value. Try the plain name (onion, carrot, mango) or call list_vegetable_yields. Meat yields are in raw-to-cooked-weight-mcp.`);
    }
    return { item: m[0].item, alternatives: m.slice(1, 6).map((x) => x.item) };
}
const NOT_WHOLE = /serving|slice|cup|tbsp|tsp|wedge|leaf|spear|floret|piece|sections|tip|pod|nlea|without refuse yields?/i;
/** The USDA measure for one whole item, scaled to amount 1 (USDA lists some as 1/2 fruit). Weight is edible portion. */
export function wholeUnit(item) {
    const head = tokens(item.description.split(',')[0]).map((t) => t.replace(/-/g, ''));
    const order = [
        (m) => /^medium\b/i.test(m), (m) => /^fruit\b/i.test(m),
        (m) => head.some((h) => tokens(m)[0] === h || stem(m.split(/[ ,(]/)[0].toLowerCase()) === h || m.toLowerCase().startsWith(h.slice(0, 5))) && /medium/i.test(m),
        (m) => head.some((h) => tokens(m)[0] === h || stem(m.split(/[ ,(]/)[0].toLowerCase()) === h || m.toLowerCase().startsWith(h.slice(0, 5))),
        (m) => /^(potato medium|large|head|small|ear|bunch|clove|stalk|root|pepper|squash|melon|whole)\b/i.test(m),
    ];
    for (const f of order) {
        const p = item.portions.find((x) => (x.amount === 1 || x.amount === 0.5) && f(x.measure) && !NOT_WHOLE.test(x.measure));
        if (p)
            return { amount: 1, measure: p.measure, grams: round(p.grams / p.amount, 1) };
    }
    return null;
}
export function findPortion(item, measure) {
    const want = tokens(measure.replace(/\bc\b/g, 'cup').replace(/tablespoons?/g, 'tbsp').replace(/teaspoons?/g, 'tsp'));
    let best = null;
    for (const p of item.portions) {
        const have = new Set(tokens(p.measure));
        let s = 0;
        for (const w of want)
            if (have.has(w))
                s += 1;
        if (want[0] && tokens(p.measure)[0] === want[0])
            s += 0.5;
        s -= 0.01 * p.measure.length;
        if (s > 0.4 && (!best || s > best[1]))
            best = [p, s];
    }
    if (!best)
        throw new InputError(`No USDA household measure "${measure}" for ${item.description}. Available: ${item.portions.map((p) => `${p.amount} ${p.measure}`).join('; ') || 'none (use grams, ounces or pounds)'}.`);
    return best[0];
}
const portionsOut = (item) => item.portions.map((p) => ({ measure: `${p.amount} ${p.measure}`, edible_grams: p.grams, edible_grams_each: round(p.grams / p.amount, 2) }));
const basics = () => ({ source: SOURCE, source_doc: SOURCE_DOC, as_of: AS_OF, more: MORE });
function itemOut(item) {
    const w = wholeUnit(item);
    return {
        food: item.description, usda_ndb_number: item.ndb, category: item.group, scientific_name: item.scientific_name,
        edible_yield_percent: item.edible_pct, refuse_percent: item.refuse_pct, refuse_is: item.refuse_description,
        typical_whole_item: w ? { measure: `${w.amount} ${w.measure}`, edible_grams: w.grams, as_purchased_grams: item.edible_pct > 0 ? round(w.grams / (item.edible_pct / 100), 0) : null } : null,
        household_measures: portionsOut(item),
    };
}
export function getVegetableYield(a) {
    const { item, alternatives } = pickFood(a.food);
    const o = itemOut(item);
    const summary = `${item.description}: USDA edible yield ${item.edible_pct}% (refuse ${item.refuse_pct}%${item.refuse_description ? `: ${item.refuse_description.toLowerCase()}` : ''}). ` +
        `1 kg as purchased gives about ${item.edible_pct * 10} g ready to use.` +
        (o.typical_whole_item ? ` One ${o.typical_whole_item.measure.replace(/^1 /, '')} is ${o.typical_whole_item.edible_grams} g edible (about ${o.typical_whole_item.as_purchased_grams} g as bought).` : '') +
        ` Source: USDA SR28 refuse data.`;
    return { summary, query: a.food, ...o, other_matches: alternatives.map((x) => ({ food: x.description, edible_yield_percent: x.edible_pct })), how_to_use: 'edible weight = purchased weight x edible_yield_percent / 100; purchased weight = edible weight / (edible_yield_percent / 100).', ...basics() };
}
function weights(g) { return { grams: round(g, 1), ounces: round(g / UNITS.ounce, 2), pounds: round(g / UNITS.pound, 3), kilograms: round(g / 1000, 3) }; }
export function calculateEdibleWeight(a) {
    const unit = weightUnit(a.unit ?? 'gram');
    if (!unit)
        throw new InputError(`Unknown unit "${a.unit}". Use g, kg, oz or lb.`);
    if (!(a.purchased_weight > 0))
        throw new InputError('purchased_weight must be a positive number.');
    const { item } = pickFood(a.food);
    const g = a.purchased_weight * UNITS[unit];
    const edible = (g * item.edible_pct) / 100;
    const summary = `${a.purchased_weight} ${unit}${a.purchased_weight === 1 ? '' : 's'} of ${item.description.toLowerCase()} as purchased gives about ${round(edible / UNITS[unit], 2)} ${unit}s (${round(edible, 0)} g) edible after removing ${item.refuse_description ? item.refuse_description.toLowerCase() : 'refuse'} (USDA edible yield ${item.edible_pct}%). Waste: ${round(g - edible, 0)} g.`;
    return { summary, food: item.description, usda_ndb_number: item.ndb, edible_yield_percent: item.edible_pct, refuse_is: item.refuse_description, purchased: weights(g), edible: { ...weights(edible), in_input_unit: round(edible / UNITS[unit], 2) }, waste: weights(g - edible), ...basics() };
}
export function calculateAmountToBuy(a) {
    if (!(a.amount > 0))
        throw new InputError('amount must be a positive number.');
    const { item } = pickFood(a.food);
    const measure = a.measure ?? 'gram';
    const unit = weightUnit(measure);
    let edibleG;
    let used;
    if (unit) {
        edibleG = a.amount * UNITS[unit];
        used = `${a.amount} ${unit}${a.amount === 1 ? '' : 's'} prepared`;
    }
    else {
        const p = findPortion(item, measure);
        edibleG = (a.amount * p.grams) / p.amount;
        used = `${a.amount} x ${p.amount === 1 ? '' : p.amount + ' '}${p.measure} (${round(p.grams / p.amount, 1)} g each, USDA)`;
    }
    if (item.edible_pct <= 0)
        throw new InputError(`${item.description} has a USDA refuse of 100%.`);
    const buyG = edibleG / (item.edible_pct / 100);
    const w = wholeUnit(item);
    const count = w ? edibleG / w.grams : null;
    const summary = `For ${used} of ${item.description.toLowerCase()} you need ${round(edibleG, 0)} g edible, so buy about ${round(buyG, 0)} g (${round(buyG / UNITS.pound, 2)} lb) as purchased at the USDA edible yield of ${item.edible_pct}%` +
        (w && count ? `, or about ${round(count, 1)} x ${w.measure} (round up to ${Math.ceil(count - 0.05)}).` : '.');
    return {
        summary, food: item.description, usda_ndb_number: item.ndb, needed: used, edible_needed: weights(edibleG), buy_as_purchased: weights(buyG),
        whole_items: w && count ? { measure: `1 ${w.measure}`, edible_grams_each: w.grams, count: round(count, 2), buy: Math.ceil(count - 0.05) } : null,
        edible_yield_percent: item.edible_pct, refuse_is: item.refuse_description, ...basics(),
    };
}
export function listVegetableYields(a) {
    let rows = PRODUCE;
    if (a.category) {
        const c = a.category.toLowerCase();
        const key = /fruit/.test(c) ? 'fruit' : /veg/.test(c) ? 'vegetable' : null;
        if (!key)
            throw new InputError('category must be fruit or vegetable.');
        rows = rows.filter((r) => r.group === key);
    }
    const sort = a.sort ?? 'name';
    if (!['name', 'yield_low', 'yield_high'].includes(sort))
        throw new InputError('sort must be name, yield_low or yield_high.');
    rows = [...rows].sort((x, y) => (sort === 'yield_low' ? x.edible_pct - y.edible_pct : sort === 'yield_high' ? y.edible_pct - x.edible_pct : 0) || x.description.localeCompare(y.description));
    const total = rows.length;
    rows = rows.slice(0, a.limit ?? 50);
    const summary = `${total} raw ${a.category ? a.category.toLowerCase().replace(/s$/, '') + 's' : 'fruits and vegetables'} with a USDA refuse value; showing ${rows.length} sorted by ${sort.replace('_', ' ')}.` +
        (rows.length ? ` First: ${rows[0].description} ${rows[0].edible_pct}% edible.` : '');
    return { summary, count: total, rows: rows.map((r) => ({ food: r.description, category: r.group, edible_yield_percent: r.edible_pct, refuse_is: r.refuse_description })), ...basics() };
}
export const HOME = {
    short: 'vegetable-yield',
    description: 'MCP server for vegetable and fruit yield percentage (edible portion after trimming) and how much produce to buy, from USDA refuse data.',
    intro: 'Edible yield percentage, trim waste and how much to buy for 305 raw vegetables and fruits, with USDA household weights (1 medium onion, 1 cup chopped), from the USDA National Nutrient Database for Standard Reference, Release 28. No key, no sign-up.',
    site_line: `A vegetable yield percentage calculator and recipe conversion tools are on <a href="${MORE}">ingredientcalculator.com</a>.`,
};
