# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_materials(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-materials')
    data = json.loads(response.data)
    assert len(data['items']) == 50
    assert len(data['categories']) == 9
