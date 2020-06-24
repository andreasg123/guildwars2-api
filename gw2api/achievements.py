# -*- coding: utf-8 -*-

from collections import defaultdict
import configparser
import os
import time
import urllib.error

from . import gw2data
from . import gw2cache


def get_achievements(api_key):
    start_time = time.time()
    gw = gw2data.Gw2Data()
    gw.api_key = api_key
    data = dict();
    try:
        account_achievements = gw.getAccountAchievements()
    except urllib.error.HTTPError:
        account_achievements = []
        data['error'] = 'Key without "progression" permission, showing all achievements.';
    gwcache = gw2cache.Gw2Cache()
    groups, categories, achievements = gw.mapCachedObjects(
        gwcache,
        [('cat_group', 'achievements/groups', None),
         ('category', 'achievements/categories', None),
         ('achievement', 'achievements', None)])
    groups.sort(key=lambda x: x['order'])
    groups = [y for y in groups if y['name']]
    covered_category_ids = {c for g in groups for c in g['categories']}
    categories = [c for c in categories if c['achievements'] and c['id']]
    other_category_ids = sorted([c['id'] for c in categories
                                 if c['id'] not in covered_category_ids])
    covered_achievement_ids = {a for c in categories for a in c['achievements']}
    achievements = {y['id']: y for y in achievements}
    other_achievement_ids = sorted([x for x in achievements
                                    if x not in covered_achievement_ids])
    if other_achievement_ids:
        categories.append({'id': 9999, 'name': 'Other',
                           'order': 1, 'icon': None,
                           'achievements': other_achievement_ids})
        other_category_ids.append(9999)
    if other_category_ids:
        groups.append({'id': 'other', 'name': 'Other', 'order': 9999,
                       'categories': other_category_ids})
    data['categories'] = {c['id']: {k: c[k] for k in ('name', 'order', 'icon',
                                                      'achievements')}
                          for c in categories}
    for (i,c) in data['categories'].items():
        c['order'] = 1000 * c['order'] + i + getGroupOrder(i, groups)
    account_achievements = update_account_achievements(account_achievements,
                                                       achievements)
    account_ids = get_property_set(account_achievements, 'id')
    account_categories = {getCategoryId(x, categories) for x in account_ids}
    account_groups = [x for x in groups
                      if any(c in account_categories for c in x['categories'])]
    data['groups'] = account_groups
    id_sets = defaultdict(set)
    for a in account_achievements:
        b = achievements[a['id']]
        # array of numbers
        a_bits = a.get('bits', [])
        # array of objects
        b_bits = b.get('bits', [])
        for i in range(len(b_bits)):
            if i in a_bits:
                continue
            entry = b_bits[i]
            try:
                id = entry['id']
                id_sets[entry['type']].add(id)
            except KeyError:
                pass
    type_urls = {'Item': 'items', 'Skin': 'skins', 'Minipet': 'minis'}
    for (key, value) in id_sets.items():
        items = gw.getCachedObjects(gwcache, key, type_urls[key], value)
        data[key] = {x['id']: {'name': x['name'],
                               'rarity': x.get('rarity', 'basic').lower()}
                     for x in items}
    for a in account_achievements:
        b = achievements[a['id']]
        a_bits = a.get('bits', [])
        b_bits = b.get('bits', [])
        for p in ['name', 'requirement', 'description']:
            a[p] = b[p]
        a['category'] = getCategoryId(a['id'], categories)
        a['total_count'] = b['tiers'][-1]['count']
        a['missing'] = [{k: b_bits[i][k] for k in ('id', 'type', 'text')
                         if k in b_bits[i]}
                        for i in range(len(b_bits)) if not i in a_bits]
    include = ('id', 'name', 'requirement', 'category', 'tier', 'tier_current',
               'tier_count', 'tier_points', 'current', 'total_count', 'points',
               'point_cap', 'missing', 'locked', 'rewards', 'description')
    data['achievements'] = [{k: a[k] for k in include if a.get(k, None)}
                            for a in account_achievements]
    return data


def update_account_achievements(account_achievements, achievements):
    account_achievements = [x for x in account_achievements
                            if x['id'] in achievements]
    account_ids = get_property_set(account_achievements, 'id')
    account_achievements += [{'id': x, 'current': 0, 'bits': []}
                             for x in achievements.keys()
                             if not x in account_ids]
    for a in account_achievements:
        b = achievements[a['id']]
        # Skip daily achievements
        if 'Permanent' not in b['flags']:
            a['skip'] = True
            continue
        repeatable = 'Repeatable' in b['flags']
        if not repeatable and a.get('done'):
            a['skip'] = True
            continue
        total_points = sum(x['points'] for x in b['tiers'])
        if not repeatable:
            point_cap = total_points
        else:
            point_cap = b.get('point_cap', 10000)
        a['point_cap'] = point_cap
        points = a.get('repeated', 0) * total_points
        current = a['current']
        tier = 0
        for t in b['tiers']:
            # t['count'] is the cumulative count towards the achievement
            if current < t['count']:
                break
            tier += 1
            points += t['points']
        if point_cap and points >= point_cap:
            a['skip'] = True
            continue
        a['points'] = points
        if tier >= len(b['tiers']):
            # Completed a repetition
            a['completion'] = 0.0
            a['tier_count'] = 0
            a['tier_points'] = 0
            a['tier_current'] = 0
            tier = 0
        else:
            a['tier_points'] = b['tiers'][tier]['points']
            a['tier_count'] = b['tiers'][tier]['count']
            tier_current = current
            if tier > 0:
                tier_current -= b['tiers'][tier - 1]['count']
                a['tier_count'] -= b['tiers'][tier - 1]['count']
            a['completion'] = float(tier_current) / a['tier_count']
            a['tier_current'] = tier_current
        a['tier'] = tier
        # Use completion percentage as a tie breaker
        a['score'] = a['completion'] * (a['tier_points'] + 0.01)
        if a['score'] == 0:
            a['score'] = 0.00001 * a['tier_points']
        try:
            a['rewards'] = b['rewards']
        except KeyError:
            pass
    account_achievements = [x for x in account_achievements
                            if not x.get('skip')]
    account_ids = get_property_set(account_achievements, 'id')
    for a in account_achievements:
        b = achievements[a['id']]
        prereq = b.get('prerequisites', None)
        if prereq and any(p in account_ids for p in prereq):
            a['locked'] = True
        if 'RequiresUnlock' in b['flags'] and a['current'] == 0:
            a['locked'] = True
    return account_achievements


def get_property_set(objects, prop):
    return {x[prop] for x in objects}


def getCategory(id, categories):
    for c in categories:
        if id in c['achievements']:
            return c


def getCategoryId(id, categories):
    for c in categories:
        if id in c['achievements']:
            return c['id']


def getGroupOrder(id, groups):
    for g in groups:
        if id in g['categories']:
            return 100000 * g['order']
    return 0


def main():
    config = configparser.ConfigParser()
    config.read(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             'keys.ini'))
    key = config['keys'].get('progression')
    print(get_achievements(key))


if __name__ == '__main__':
    main()
