# -*- coding: utf-8 -*-

from collections import defaultdict
import os
import urllib.error

from . import gw2data
from . import gw2cache


def get_bank(api_key):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        bank = gw.getBank()
    except urllib.error.HTTPError:
        return {'error': 'The key needs "inventories" permissions'}
    gwcache = gw2cache.Gw2Cache()
    item_types = ['Armor', 'Trinket', 'Back', 'Weapon', 'UpgradeComponent',
                  'Tool', 'Gathering', 'Gizmo', 'Consumable', 'Bag',
                  'Container', 'CraftingMaterial', 'MiniPet', 'Trait',
                  'Trophy']
    item_ids = set()
    skin_ids = set()
    dye_ids = set()
    for b in bank:
        add_identifiers(b, item_ids, skin_ids, dye_ids)
    items, skins, dyes = gw.mapCachedObjects(gwcache,
                                             [('Item', 'items', item_ids),
                                              ('Skin', 'skins', skin_ids),
                                              ('Color', 'colors', dye_ids)])
    item_dict = {x['id']: x for x in items}
    return {'bank': bank, 'items': items, 'skins': skins, 'dyes': dyes}


def get_materials(api_key):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        materials = gw.getAccountMaterials()
    except urllib.error.HTTPError:
        return {'error': 'The key needs "inventories" permissions'}
    gwcache = gw2cache.Gw2Cache()
    # Items are not needed
    categories = [{'id': x['id'], 'name': x['name'], 'order': x['order'],
                   'items': []}
                  for x in gw.getCachedObjects(gwcache, 'Material',
                                               'materials')]
    categories.sort(key=lambda x: x['order'])
    category_dict = {x['id']: x for x in categories}
    item_ids = set([m['id'] for m in materials])
    items = gw.mapCachedObjects(gwcache, [('Item', 'items', item_ids)])[0]
    for m in materials:
        if m is None or m['count'] == 0:
            continue
        try:
            category = category_dict[m['category']]
            category['items'].append([m['id'], m['count']])
        except KeyError:
            continue
    return {'categories': categories, 'items': items}


def add_identifiers(slot, item_ids, skin_ids, dye_ids):
    if not slot:
        return
    item_ids.add(slot['id'])
    for p in ['upgrades', 'infusions']:
        try:
            item_ids |= set(slot[p])
        except KeyError:
            pass
    try:
        skin_ids.add(slot['skin'])
    except KeyError:
        pass
    try:
        dye_ids |= set([x for x in slot['dyes'] if x is not None])
    except KeyError:
        pass
