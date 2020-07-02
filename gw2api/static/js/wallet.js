import {api_url_prefix} from './api-url.js';
import {escapeEntities} from './item-display.js';

const e = React.createElement;

function Wallet({wallet, currencies}) {
  const rows = [];
  let alt_display = true;
  for (const c of currencies) {
    const value = wallet[c.id];
    const row_props = alt_display ? {className: 'alt'} : {};
    row_props.style = {verticalAlign: 'top'};
    rows.push(e('tr', row_props,
                e('td', {},
                  e('img', {src: c.icon, width: '20', height: '20'})),
                e('td', {className: 'right'}, value.toLocaleString()),
                e('td', {}, c.name),
                e('td', {}, c.description)));
    alt_display = !alt_display;
  }
  return e('table', {}, e('tbody', {}, ...rows));
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
    ReactDOM.render(e(Wallet, data), document.getElementById('data'));
  }
}

async function loadData() {
  const url = `${api_url_prefix}get-wallet${window.location.search}`;
  const res = await fetch(url);
  const data = await res.json();
  renderData(data);
}

loadData();
