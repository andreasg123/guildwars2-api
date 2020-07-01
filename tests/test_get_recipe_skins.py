# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_recipe_skins(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-recipe-skins')
    data = json.loads(response.data)
    assert len(data['skins']) == 32
