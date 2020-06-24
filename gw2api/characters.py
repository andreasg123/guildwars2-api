# -*- coding: utf-8 -*-

import configparser
import os
import urllib.error

from . import gw2data
from . import gw2cache


def get_characters(api_key):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        characters = gw.getCharacters()
        return characters
    except urllib.error.HTTPError:
        return {'error': 'The key needs "characters" permission'}


def get_inventory(api_key, name):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        character = gw.getCharacter(name)
    except urllib.error.HTTPError:
        return {'error': 'The key needs "characters" and "inventories" permissions'}
    gwcache = gw2cache.Gw2Cache()
    item_ids = set()
    skin_ids = set()
    dye_ids = set()
    del character['equipment']
    try:
        for b in character['bags']:
            if b is None:
                continue
            item_ids.add(b['id'])
            for i in b['inventory']:
                add_identifiers(i, item_ids, skin_ids, dye_ids)
    except KeyError:
        pass
    items, skins, dyes = gw.mapCachedObjects(gwcache,
                                             [('Item', 'items', item_ids),
                                              ('Skin', 'skins', skin_ids),
                                              ('Color', 'colors', dye_ids)])
    return {'character': character, 'items': items, 'skins': skins, 'dyes': dyes}


def get_equipment(api_key, name):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        character = gw.getCharacter(name)
    except urllib.error.HTTPError:
        return {'error': 'The key needs "characters" and "inventories" permissions'}
    gwcache = gw2cache.Gw2Cache()
    item_ids = set()
    skin_ids = set()
    dye_ids = set()
    del character['bags']
    try:
        for e in character['equipment']:
            add_identifiers(e, item_ids, skin_ids, dye_ids)
    except KeyError:
        pass
    items, skins, dyes = gw.mapCachedObjects(gwcache,
                                             [('Item', 'items', item_ids),
                                              ('Skin', 'skins', skin_ids),
                                              ('Color', 'colors', dye_ids)])
    return {'character': character, 'items': items, 'skins': skins, 'dyes': dyes}


def get_shared(api_key):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        shared = gw.makeRequest('account/inventory')
    except urllib.error.HTTPError:
        return {'error': 'The key needs "characters" and "inventories" permissions'}
    gwcache = gw2cache.Gw2Cache()
    item_ids = set()
    skin_ids = set()
    dye_ids = set()
    for i in shared:
        add_identifiers(i, item_ids, skin_ids, dye_ids)
    items, skins, dyes = gw.mapCachedObjects(gwcache,
                                             [('Item', 'items', item_ids),
                                              ('Skin', 'skins', skin_ids),
                                              ('Color', 'colors', dye_ids)])
    return {'shared': shared, 'items': items, 'skins': skins, 'dyes': dyes}


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


def main():
    config = configparser.ConfigParser()
    config.read(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             'keys.ini'))
    key = config['keys'].get('characters_inventories')
    get_inventory(key)


if __name__ == '__main__':
    main()
