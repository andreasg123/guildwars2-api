import {makeJSONRequest} from './xhr.js';
import {GroupedItems, escapeEntities} from './item-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

function Equipment({characters, shared, items, skins}) {
  const rows = [];
  for (const c of characters) {
    rows.push(e(Character, {character: c, items, skins}));
  }
  return e('table', {}, e('tbody', {}, ...rows));
}

function Character({character, items, skins}) {
  const slots = character.equipment || [];
  const info = [e('b', {style: {fontSize: '110%'}}, character.name, ',')];
  if (character.gender) {
    info.push(' ', character.gender, ' ', character.race, ', Level ', character.level);
  }
  return e(React.Fragment, {},
           e('tr', {},
             e('td', {colSpan: '11', style: {paddingTop: '1em'}}, ...info)),
           e(GroupedItems, {slots, items, skins}));
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
    ReactDOM.render(e(Equipment, data), document.getElementById('data'));
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
  const load = async index => {
    let qs = window.location.search;
    qs += (qs ? '&' : '?') + 'name=' + encodeURIComponent(names[index]);
    const url = `${api_url_prefix}get-equipment${qs}`;
    const data = await makeJSONRequest({url});
    characters[index] = data.character;
    for (const x of data.items) {
      items.set(x.id, x);
    }
    for (const x of data.skins) {
      skins.set(x.id, x);
    }
    renderData({characters, items, skins});
  };
  for (let i = 0; i < names.length; i++) {
    load(i);
  }
}

loadData();
