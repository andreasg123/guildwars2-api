import {makeJSONRequest} from './xhr.js';
import {getItemLinkUrl, escapeEntities} from './item-display.js';
import {SkinGroup} from './skin-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

const skin_types = ['Armor', 'Back', 'Weapon'];
// Don't include "Clothing" because that has been replaced by outfits.
// Also, don't include gathering and bundles because the results aren't useful.
const weight_classes = [['Light', 'Medium', 'Heavy'], [undefined], [undefined]];
const detail_types = [
  ['Helm', 'HelmAquatic', 'Shoulders', 'Coat', 'Gloves', 'Leggings', 'Boots', 'Back'],
  [undefined],
  ['Axe', 'Dagger', 'Mace', 'Pistol', 'Scepter', 'Sword',
   'Focus', 'Shield', 'Torch', 'Warhorn',
   'Greatsword', 'Hammer', 'LongBow', 'Rifle', 'ShortBow', 'Staff',
   'Harpoon', 'Speargun', 'Trident']
];

function Skins({skins, account_skins}) {
  const elements = [];
  const [checked, setChecked] = React.useState(true);
  const onChange = evt => {
    setChecked(evt.target.checked);
  };
  elements.push(e('p', {},
                  e('input', {type: 'checkbox', checked, onChange}),
                  ' Exclude unnamed'));
  for (let i = 0; i < skin_types.length; i++) {
    elements.push(e('h2', {}, skin_types[i]));
    for (let j = 0; j < weight_classes[i].length; j++) {
      if (weight_classes[i][j]) {
        elements.push(e('h3', {}, weight_classes[i][j]));
      }
      for (let k = 0; k < detail_types[i].length; k++) {
        const group = [];
        for (const skin of skins) {
          if ((!checked || skin.name) &&
              skin.type === skin_types[i] &&
              (!weight_classes[i][j] || skin.details.weight_class === weight_classes[i][j]) &&
              (!detail_types[i][k] || skin.details.type === detail_types[i][k])) {
            group.push(skin);
          }
        }
        if (group.length) {
          if (detail_types[i][k]) {
            elements.push(e('h3', {}, detail_types[i][k]));
          }
          group.sort((a, b) => a.name.localeCompare(b.name));
          elements.push(e(SkinGroup, {skins: group, account_skins}));
        }
      }
    }
  }
  return e(React.Fragment, {}, ...elements);
}

function renderData(data) {
  if (data.error) {
    const msg = document.getElementById('message');
    if (msg) {
      msg.innerHTML = escapeEntities(data.error);
      msg.style.display = 'block';
    }
  }
  ReactDOM.render(e(Skins, data), document.getElementById('data'));
}

async function loadData() {
  const url = `${api_url_prefix}get-skins${window.location.search}`;
  const data = await makeJSONRequest({url});
  renderData(data);
}

loadData();
