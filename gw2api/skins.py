# -*- coding: utf-8 -*-

import urllib.error

from . import gw2data
from . import gw2cache


def get_skins(api_key, recipes_only=False):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    data = {}
    account_skins = None
    try:
        account_skins = gw.makeRequest('account/skins')
        if recipes_only:
            account_recipes = gw.makeRequest('account/recipes')
    except urllib.error.HTTPError:
        if recipes_only:
            return {'error': 'The key needs "unlocks" permission'}
        else:
            data['error'] = 'Key without "unlocks" permission, showing all skins unlocked.'
    gwcache = gw2cache.Gw2Cache()
    if recipes_only:
        recipes = (gw.getCachedObjects(gwcache, 'Recipe', 'recipes',
                                       account_recipes)
                   if account_recipes else [])
        item_ids = {x['output_item_id'] for x in recipes}
        items = (gw.getCachedObjects(gwcache, 'Item', 'items', item_ids)
                 if item_ids else [])
        missing_skins = {x['default_skin'] for x in items
                         if x.get('default_skin') and
                         x.get('default_skin') not in account_skins}
        data['skins'] = (gw.getCachedObjects(gwcache, 'Skin', 'skins',
                                            missing_skins)
                         if missing_skins else [])
    else:
        data['account_skins'] = account_skins
        data['skins'] = gw.getCachedObjects(gwcache, 'Skin', 'skins')
    return data
