# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_skins(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-skins')
    data = json.loads(response.data)
    assert len(data['skins']) == 408
    assert len(data['account_skins']) == 314
