import {makeJSONRequest} from './xhr.js';
import {GroupedItems, escapeEntities} from './item-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

function Inventory({characters, shared, items, skins}) {
  const rows = [];
  rows.push(e(Shared, {shared, items, skins}));
  for (const c of characters) {
    rows.push(e(Character, {character: c, items, skins}));
  }
  return e('table', {}, e('tbody', {}, ...rows));
}

function Shared({shared, items, skins}) {
  return e(React.Fragment, {},
           e('tr', {},
             e('td', {colSpan: '11', style: {paddingTop: '1em'}},
               e('b', {style: {fontSize: '110%'}}, 'Shared'))),
           e(GroupedItems, {slots: shared, items, skins}));
}

function Character({character, items, skins}) {
  const bag_ids = [];
  const slots = [];
  for (const b of character.bags || []) {
    if (b) {
      bag_ids.push(b.id);
      slots.push(...b.inventory);
    }
  }
  const info = [e('b', {style: {fontSize: '110%'}}, character.name, ',')];
  if (character.gender) {
    info.push(' ', character.gender, ' ', character.race, ', Level ', character.level);
  }
  return e(React.Fragment, {},
           e('tr', {},
             e('td', {colSpan: '11', style: {paddingTop: '1em'}}, ...info)),
           e(GroupedItems, {slots, items, skins, bag_ids}));
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
    ReactDOM.render(e(Inventory, data), document.getElementById('data'));
  }
}

async function loadData() {
  const url = `${api_url_prefix}get-characters${window.location.search}`;
  const items = new Map();
  const skins = new Map();
  const names = await makeJSONRequest({url});
  if (names.error) {
    renderData(names);
    return;
  }
  const characters = names.map(name => ({name}));
  const shared = [];
  const load = async index => {
    let qs = window.location.search;
    let url;
    if (index < 0) {
      url = `${api_url_prefix}get-shared${qs}`;
    }
    else {
      qs += (qs ? '&' : '?') + 'name=' + encodeURIComponent(names[index]);
      url = `${api_url_prefix}get-inventory${qs}`;
    }
    const data = await makeJSONRequest({url});
    if (index < 0) {
      shared.push(...data.shared);
    }
    else {
      characters[index] = data.character;
    }
    for (const x of data.items) {
      items.set(x.id, x);
    }
    for (const x of data.skins) {
      skins.set(x.id, x);
    }
    renderData({characters, shared, items, skins});
  };
  for (let i = -1; i < names.length; i++) {
    load(i);
  }
}

loadData();
