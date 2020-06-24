export function makeJSONRequest({method = 'GET', url, data, headers,
                                 timeout, responseType = 'json'}) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    if (timeout)
      req.timeout = timeout;
    for (const evt_type of ['load', 'error', 'abort', 'timeout']) {
      req.addEventListener(evt_type, () => {
        if (evt_type === 'load' && req.status === 200) {
          resolve(req.response);
        }
        else {
          const err = new Error(evt_type);
          err.request = req;
          reject(err);
        }
      });
    }
    req.open(method, url, true);
    for (const h in headers)
      req.setRequestHeader(h, headers[h]);
    req.responseType = responseType;
    req.send(data);
  });
}
