# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_equipment(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-equipment?name=Ivan%20Ironheart')
    data = json.loads(response.data)
    assert len(data['items']) == 31
    assert len(data['skins']) == 7
    assert len(data['dyes']) == 5
