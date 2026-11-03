// Fixtures: refuse and household weights copied from USDA SR28 FOOD_DES.txt and WEIGHT.txt
// (sr28asc.zip), plus hand-checked arithmetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCE, rankProduce, wholeUnit, findPortion, getVegetableYield, calculateEdibleWeight, calculateAmountToBuy,
  listVegetableYields, InputError, MORE, SOURCE, stem,
} from '../dist/core.js';

const top = (f) => rankProduce(f)[0].item;
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test('305 raw fruits and vegetables with a refuse value (114 fruit, 191 vegetable)', () => {
  assert.equal(PRODUCE.length, 305);
  assert.equal(PRODUCE.filter((p) => p.group === 'fruit').length, 114);
});
test('onion NDB 11282: refuse 10% stem ends, sprouts and defects; medium 110 g; cup chopped 160 g', () => {
  const o = top('onion');
  assert.equal(o.ndb, '11282'); assert.equal(o.refuse_pct, 10); assert.equal(o.refuse_description, 'Stem ends, sprouts and defects');
  assert.equal(wholeUnit(o).grams, 110); assert.equal(findPortion(o, 'cup chopped').grams, 160);
});
test('apple with skin NDB 09003: refuse 10% core and stem, medium 182 g', () => {
  const a = top('apple'); assert.equal(a.ndb, '09003'); assert.equal(a.refuse_pct, 10); assert.equal(wholeUnit(a).grams, 182);
});
test('pineapple 49% refuse (8% core, 16% crown, 26% parings); banana 36% skin', () => {
  assert.equal(top('pineapple').refuse_pct, 49); assert.equal(top('pineapple').refuse_description, '8% core, 16% crown, 26% parings');
  assert.equal(top('banana').refuse_pct, 36); assert.equal(top('banana').refuse_description, 'Skin');
});
test('broccoli 39%, watermelon 48%, carrots 11%, potatoes flesh and skin 25% refuse', () => {
  assert.equal(top('broccoli').refuse_pct, 39); assert.equal(top('watermelon').refuse_pct, 48);
  assert.equal(top('carrots').refuse_pct, 11); assert.equal(top('potato').refuse_pct, 25);
});
test('common names: bell pepper, scallions, zucchini, cilantro, sweet potato, lemon map to SR28 rows', () => {
  assert.match(top('red bell pepper').description, /^Peppers, sweet, red, raw/);
  assert.match(top('scallions').description, /^Onions, spring or scallions/);
  assert.match(top('zucchini').description, /^Squash, summer, zucchini/);
  assert.match(top('cilantro').description, /^Coriander \(cilantro\) leaves/);
  assert.equal(top('sweet potato').description, 'Sweet potato, raw, unprepared');
  assert.equal(top('lemon').description, 'Lemons, raw, without peel');
});
test('half-fruit measures scale to one whole: grapefruit white 0.5 fruit 118 g = 236 g', () => {
  assert.equal(wholeUnit(top('grapefruit')).grams, 236);
});
test('edible weight: 5 lb pineapple x 0.51 = 1156.66 g edible, 1111.3 g waste', () => {
  const r = calculateEdibleWeight({ food: 'pineapple', purchased_weight: 5, unit: 'lb' });
  close(r.edible.grams, 1156.7); close(r.waste.grams, 1111.3); close(r.edible.in_input_unit, 2.55);
});
test('amount to buy: 2 cups chopped onion = 320 g edible / 0.9 = 355.6 g, 2.91 medium onions -> 3', () => {
  const r = calculateAmountToBuy({ food: 'onion', amount: 2, measure: 'cup chopped' });
  close(r.edible_needed.grams, 320); close(r.buy_as_purchased.grams, 355.6); close(r.whole_items.count, 2.91); assert.equal(r.whole_items.buy, 3);
});
test('amount to buy by weight: 500 g prepared broccoli / 0.61 = 819.7 g as purchased', () => {
  const r = calculateAmountToBuy({ food: 'broccoli', amount: 500, measure: 'g' });
  close(r.buy_as_purchased.grams, 819.7);
});
test('get yield: avocado all varieties 74% edible, one avocado 201 g edible = 271.6 g as bought (rounded 272)', () => {
  const r = getVegetableYield({ food: 'avocado' });
  assert.equal(r.edible_yield_percent, 74); assert.equal(r.typical_whole_item.edible_grams, 201); assert.equal(r.typical_whole_item.as_purchased_grams, 272);
});
test('unknown foods and measures give clear errors', () => {
  assert.throws(() => getVegetableYield({ food: 'salmon' }), InputError);
  assert.throws(() => calculateAmountToBuy({ food: 'onion', amount: 1, measure: 'bushel' }), /No USDA household measure/);
  assert.throws(() => calculateEdibleWeight({ food: 'onion', purchased_weight: 1, unit: 'cup' }), /Unknown unit/);
});
test('list: lowest vegetable yield first is bamboo shoots 29%; fruit filter only fruit', () => {
  const r = listVegetableYields({ category: 'vegetable', sort: 'yield_low', limit: 3 });
  assert.equal(r.rows[0].food, 'Bamboo shoots, raw'); assert.equal(r.rows[0].edible_yield_percent, 29);
  assert.ok(listVegetableYields({ category: 'fruit', limit: 400 }).rows.every((x) => x.category === 'fruit'));
});
test('stemming keeps potato/potatoes and berry/berries together', () => {
  assert.equal(stem('potatoes'), 'potato'); assert.equal(stem('berries'), 'berry'); assert.equal(stem('onions'), 'onion'); assert.equal(stem('asparagus'), 'asparagus');
});
test('every result carries source, as_of and an ingredientcalculator.com more link with UTM', () => {
  const r = getVegetableYield({ food: 'carrot' });
  assert.equal(r.source, SOURCE); assert.ok(r.as_of.startsWith('2015-09'));
  assert.equal(r.more, MORE); assert.match(MORE, /^https:\/\/ingredientcalculator\.com\/vegetable-yield-percentage-calculator\?utm_source=mcp&utm_medium=vegetable-yield-percentage-mcp$/);
});
