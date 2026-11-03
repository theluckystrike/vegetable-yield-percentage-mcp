#!/usr/bin/env python3
"""Build data/produce-yields.json from USDA National Nutrient Database for Standard Reference, Release 28 (SR28).

Source: https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip (FOOD_DES.txt, WEIGHT.txt)
Usage: python3 -I scripts/build_data.py <dir with FOOD_DES.txt and WEIGHT.txt> data/produce-yields.json
Keeps raw fruits (group 0900) and raw vegetables (group 1100) that carry a refuse value.
Refuse is the inedible share of the food as purchased (SR28 documentation p. 5). Household
weights in WEIGHT.txt are edible portion without refuse (SR28 documentation, Weights and Measures).
"""
import json
import os
import re
import sys

GROUPS = {'0900': 'fruit', '1100': 'vegetable'}


def read(path):
    with open(path, encoding='latin-1') as f:
        for line in f:
            yield [x.strip('~') for x in line.rstrip('\r\n').split('^')]


def main(src, out):
    foods = {}
    for r in read(os.path.join(src, 'FOOD_DES.txt')):
        ndb, grp, desc = r[0], r[1], r[2]
        if grp not in GROUPS or r[8] == '':
            continue
        if not re.search(r'(^|, )raw(,|$)', desc):
            continue
        foods[ndb] = {
            'ndb': ndb,
            'group': GROUPS[grp],
            'description': desc,
            'common_name': r[4] or None,
            'scientific_name': r[9] or None,
            'refuse_pct': int(r[8]),
            'edible_pct': 100 - int(r[8]),
            'refuse_description': r[7] or None,
            'portions': [],
        }
    for r in read(os.path.join(src, 'WEIGHT.txt')):
        f = foods.get(r[0])
        if not f:
            continue
        amount, desc, grams = float(r[2]), r[3], float(r[4])
        f['portions'].append({'amount': amount, 'measure': desc, 'grams': grams})
    items = sorted(foods.values(), key=lambda x: x['description'])
    json.dump({
        'source': 'USDA National Nutrient Database for Standard Reference, Release 28 (September 2015), USDA ARS Nutrient Data Laboratory',
        'source_url': 'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip',
        'items': items,
    }, open(out, 'w'), indent=0, separators=(',', ':'))
    print(f'{len(items)} foods, {sum(len(i["portions"]) for i in items)} portions -> {out}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
