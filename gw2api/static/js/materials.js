import {Item, escapeEntities} from './item-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

function Materials({categories, item_map}) {
  // Need to name the map "item_map" because categories already have a
  // property "items".
  const fragments = categories.map(c => e(Category, {item_map, ...c}));
  return e(React.Fragment, {}, ...fragments);
}

function Category({name, items, item_map}) {
  const pairs = items.map(x => [item_map.get(x[0]), ...x.slice(1)]);
  pairs.sort((a, b) => a[0].name.localeCompare(b[0].name));
  const rows = [];
  let alt_display = true;
  for (const entry of pairs) {
    rows.push(e(Item, {item: entry[0], count: entry[1], alt_display, attribute_display: false}));
    alt_display = !alt_display;
  }
  return e(React.Fragment, {},
           e('h3', {}, name),
           e('table', {}, e('tbody', {}, ...rows)));
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
    const item_map = new Map(data.items.map(x => [x.id, x]));
    ReactDOM.render(e(Materials, {categories: data.categories, item_map}),
                    document.getElementById('data'));
  }
}

async function loadData() {
  const url = `${api_url_prefix}get-materials${window.location.search}`;
  const res = await fetch(url);
  const data = await res.json();
  renderData(data);
}

loadData();
