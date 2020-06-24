# -*- coding: utf-8 -*-

import json
import os
import sqlite3
import time


default_db_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                               'cache.db')


class Gw2Cache:
    text_types = ['cat_group', 'Legend', 'Profession']

    def __init__(self, db_path=None):
        self.db_path = db_path if db_path is not None else default_db_path
    
    def _getCursor(self):
        conn = sqlite3.connect(self.db_path)
        return conn.cursor()

    def _createTable(self, type, c):
        id_type = 'TEXT' if type in self.text_types else 'INTEGER'
        c.execute('CREATE TABLE IF NOT EXISTS ' + type + '(id ' + id_type +
                  ' PRIMARY KEY, retrieved INTEGER, data TEXT)')

    def get(self, type, ids):
        c = self._getCursor()
        self._createTable(type, c)
        id_type = 'TEXT' if type in self.text_types else 'INTEGER'
        c.execute('CREATE TEMPORARY TABLE temp_id(id ' + id_type + ' PRIMARY KEY)')
        cutoff = int(time.time()) - 7 * 24 * 3600
        c.execute('DELETE FROM ' + type + ' WHERE retrieved<?', (cutoff,))
        c.executemany('INSERT INTO temp_id(id) VALUES(?)', [(x,) for x in ids])
        c.execute('SELECT data FROM ' + type + ' AS t JOIN temp_id ON t.id=temp_id.id')
        result = [json.loads(x[0]) for x in c.fetchall()]
        c.connection.commit()
        c.connection.close()
        return result

    def put(self, type, data):
        c = self._getCursor()
        self._createTable(type, c)
        now = int(time.time())
        c.executemany('INSERT OR REPLACE INTO ' + type + '(id,retrieved,data) VALUES(?,?,?)',
                      [(x['id'], now, json.dumps(x, separators=(',',':'))) for x in data]);
        c.connection.commit()
        c.connection.close()

    def getIdentifiers(self, type):
        result = self.get(type, [0])
        return result[0] if result else []

    def putIdentifiers(self, type, ids):
        c = self._getCursor()
        self._createTable(type, c)
        now = int(time.time())
        c.execute('INSERT OR REPLACE INTO ' + type + '(id,retrieved,data) VALUES(?,?,?)',
                  (0, now, json.dumps(ids, separators=(',',':'))))
        c.connection.commit()
        c.connection.close()
