import {makeJSONRequest} from './xhr.js';
import {GroupedItems, escapeEntities} from './item-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

function Bank({bank, items, skins}) {
  return e('table', {},
           e('tbody', {},
             e(GroupedItems, {slots: bank, items, skins})));
}

function renderData(data) {
  if (data.error) {
    const msg = document.getElementById('message');
    if (msg) {
      msg.innerHTML = escapeEntities(data.error);
      msg.style.display = 'block';
    }
  }
  else {
    const items = new Map(data.items.map(x => [x.id, x]));
    const skins = new Map(data.skins.map(x => [x.id, x]));
    ReactDOM.render(e(Bank, {bank: data.bank, items, skins}),
                    document.getElementById('data'));
  }
}

async function loadData() {
  const url = `${api_url_prefix}get-bank${window.location.search}`;
  const data = await makeJSONRequest({url});
  renderData(data);
}

loadData();
