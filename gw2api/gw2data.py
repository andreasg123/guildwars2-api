# -*- coding: utf-8 -*-

import json
import gzip
import ssl
import urllib.error
import urllib.parse
import urllib.request


class Gw2Data:
    base_url = 'https://api.guildwars2.com/v2/'

    def __init__(self):
        self.api_key = ''

    def createRequest(self, rel_url, query_string=None):
        url = self.base_url + rel_url
        if query_string != None:
            url = url + '?' + query_string
        #print url
        req = urllib.request.Request(url, None)
        if self.api_key:
            req.add_header('Authorization', 'Bearer ' + self.api_key)
        return req

    def readRequest(self, req):
        for i in range(3):
            try:
                f = urllib.request.urlopen(req, None, 60)
                break
            except urllib.error.URLError as err:
                if i == 2:
                    #print req.get_full_url()
                    raise
                elif err.code == 404:
                    return []
                else:
                    pass
            except ssl.SSLError:
                if i == 2:
                    #print req.get_full_url()
                    raise
                else:
                    pass
        if f.info().get('Content-Encoding') == 'gzip':
            buf = StringIO(f.read())
            f.close()
            f = gzip.GzipFile(fileobj=buf)
        x = json.load(f)
        f.close()
        #print x
        return x

    def makeRequest(self, rel_url):
        req = self.createRequest(rel_url)
        return self.readRequest(req)

    def getCharacters(self):
        req = self.createRequest('characters')
        return self.readRequest(req)

    def getCharacter(self, name):
        req = self.createRequest('characters/' + urllib.parse.quote(name))
        return self.readRequest(req)

    def getBank(self):
        req = self.createRequest('account/bank')
        return self.readRequest(req)

    def getAccountMaterials(self):
        req = self.createRequest('account/materials')
        try:
            return self.readRequest(req)
        except urllib.error.HTTPError:
            print(req.get_full_url())
            print(req.header_items())
            raise

    def getAccountAchievements(self):
        req = self.createRequest('account/achievements')
        return self.readRequest(req)

    def getWallet(self):
        req = self.createRequest('account/wallet')
        return self.readRequest(req)

    def getCachedObjects(self, cache, type, rel_url, ids=None):
        if not ids:
            ids = cache.getIdentifiers(type)
            if not ids:
                ids = self.makeRequest(rel_url)
                cache.putIdentifiers(type, ids)
        cached_objects = cache.get(type, ids)
        cached_ids = {x['id'] for x in cached_objects}
        remaining_ids = sorted(x for x in ids if not x in cached_ids)
        # print('remaining', remaining_ids)
        objects = []
        if remaining_ids:
            try:
                for i in range(0, len(remaining_ids), 200):
                    qs = 'ids=' + ','.join(str(x)
                                           for x in remaining_ids[i:i+200])
                    # print(qs)
                    req = self.createRequest(rel_url, qs)
                    result = self.readRequest(req)
                    # print(result)
                    objects += result
                    cache.put(type, result)
            except urllib.error.HTTPError:
                # print('error')
                pass
        objects += cached_objects
        return objects

    def mapCachedObjects(self, cache, specs):
        return [self.getCachedObjects(cache, type, rel_url, ids)
                if ids is None or len(ids) > 0 else []
                for type, rel_url, ids in specs]
