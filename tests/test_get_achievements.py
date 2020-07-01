# -*- coding: utf-8 -*-

from .conftest import mock_urllib_request_urlopen
import json
import mock


def test_achievements(client):
    with mock.patch('urllib.request.urlopen', new=mock_urllib_request_urlopen):
        response = client.get('/get-achievements')
    data = json.loads(response.data)
    assert len(data['achievements']) == 62
    assert len(data['categories']) == 27
    assert len(data['groups']) == 5
    assert len(data['Item']) == 6
    assert len(data['Skin']) == 55
