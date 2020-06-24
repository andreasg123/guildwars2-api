# -*- coding: utf-8 -*-

import urllib.error

from . import gw2data
from . import gw2cache


def get_wallet(api_key):
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    try:
        wallet_dict = {x['id']: x['value'] for x in gw.getWallet()}
    except urllib.error.HTTPError:
        return {'error': 'The key needs "wallet" permissions'}
    gwcache = gw2cache.Gw2Cache()
    currencies = gw.mapCachedObjects(gwcache, [('Currency', 'currencies',
                                                [x for x in wallet_dict])])[0]
    currencies.sort(key=lambda x: x['order'])
    return {'wallet': wallet_dict, 'currencies': currencies}
