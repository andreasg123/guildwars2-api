# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_get_shared(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-shared')
    data = json.loads(response.data)
    assert len(data['shared']) == 10
    assert len(data['items']) == 10
