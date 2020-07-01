# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_bank(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-bank')
    data = json.loads(response.data)
    assert len(data['bank']) == 13
    assert len(data['items']) == 15
    assert len(data['skins']) == 1
    assert len(data['dyes']) == 4
