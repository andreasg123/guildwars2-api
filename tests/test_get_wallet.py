# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_wallet(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-wallet')
    data = json.loads(response.data)
    assert len(data['wallet']) == 20
    assert len(data['currencies']) == 20
