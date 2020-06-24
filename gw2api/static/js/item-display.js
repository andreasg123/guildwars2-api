const e = React.createElement;
const item_types = ['Armor', 'Trinket', 'Back', 'Weapon', 'UpgradeComponent',
                    'Tool', 'Gathering', 'Gizmo', 'Consumable', 'Bag',
                    'Container', 'CraftingMaterial', 'MiniPet', 'Trait',
                    'Trophy'];
const wiki_search = 'http://wiki.guildwars2.com/index.php?search=';
const gw2spidy = 'http://www.gw2spidy.com/item/';

export function GroupedItems({slots, items, skins, alt_display = true, bag_ids = []}) {
  const inventory = new Map();
  const unknown_inv = [];
  for (const slot of slots) {
    addInventory(slot, items, inventory, unknown_inv);
  }
  const rows = [];
  for (const t of item_types) {
    const inv_list = inventory.get(t);
    if (!inv_list || inv_list.length === 0) {
      continue;
    }
    inv_list.sort((a, b) => a[0].name.localeCompare(b[0].name));
    for (const inv of inv_list) {
      const item = inv[0];
      const count = inv[1];
      let skin = item;
      let upgrades = [];
      let infusions = [];
      if (inv.length > 2) {
        skin = skins.get(inv[2].skin) || item;
        upgrades = inv[2].upgrades || upgrades;
        infusions = inv[2].infusions || infusions;
      }
      rows.push(e(Item, {item, count, skin, upgrades, infusions, items, alt_display}));
      alt_display = !alt_display;
    }
  }
  for (const u of unknown_inv) {
    rows.push(e(UnknownItem, {id: u.id, count: u.count, alt_display}));
    alt_display = !alt_display;
  }
  for (const b of bag_ids) {
    rows.push(e(Bag, {id: b, items, alt_display}));
    alt_display = !alt_display;
  }
  return e(React.Fragment, {}, ...rows);
}

export function Item({item, skin, count, upgrades, infusions, alt_display, items,
                      attribute_display = true}) {
  skin = skin || item;
  const row_props = alt_display ? {className: 'alt'} : {};
  const rows = [];
  const cells = [];
  cells.push(e('td', {className: 'right'}, count),
             e('td', {style: {fontSize: '100%'}},
               e(ItemLink, {name: item.name, rarity: item.rarity.toLowerCase(),
                            skin_name: skin.name}),
               ' ',
               e(SmallSpidyLink, {id: item.id})),
             e('td', {className: 'right'}, item.level));
  if (attribute_display) {
    let attr_count = 0;
    const attributes = item.details && item.details.infix_upgrade &&
          item.details.infix_upgrade.attributes;
    if (attributes) {
      for (const a of attributes) {
        attr_count++;
        let attr = a.attribute;
        if (attr === 'CritDamage') {
          attr = 'Ferocity';
        }
        else if (attr === 'BoonDuration') {
          attr = 'Concentration';
        }
        cells.push(e('td', {}, attr.substring(0, 3) + ' ' + a.modifier));
      }
    }
    for (let i = 0; i < 7 - attr_count; i++) {
      cells.push(e('td', {}));
    }
  }
  const elements = [];
  upgrades = (upgrades || []).concat(infusions || [])
  for (const u of upgrades) {
    if (elements.length) {
      elements.push(', ');
    }
    const item2 = items.get(u);
    elements.push(e(ItemLink, {name: item2.name, rarity: item2.rarity.toLowerCase()}),
                  ' ',
                  e(SmallSpidyLink, {id: item2.id}));
  }
  const img_link = e('a', {href: getItemLinkUrl(item.name), target: 'wiki'},
                     e('img', {src: skin.icon, width: '20', height: '20'}));
  if (elements.length) {
    cells.unshift(e('td', {style: {verticalAlign: 'top'}, rowSpan: 2}, img_link));
    rows.push(e('tr', row_props, ...cells));
    rows.push(e('tr', row_props,
                e('td', {}),
                e('td', {colSpan: '9'},
                  '\u00a0\u00a0\u00a0\u00a0\u00a0',
                  ...elements)));
  }
  else {
    cells.unshift(e('td', {style: {verticalAlign: 'top'}}, img_link));
    rows.push(e('tr', row_props, ...cells));
  }
  return e(React.Fragment, {}, ...rows);
}

export function UnknownItem(props) {
  const row_props = props.alt_display ? {className: 'alt'} : {};
  return e('tr', row_props,
           e('td', {}),
           e('td', {className: 'right'}, props.count),
           e('td', {style: {fontSize: '100%'}},
             e(SpidyLink, {id: props.id})));
}

function Bag({id, items, alt_display}) {
  const item = items.get(id);
  return !item ? e(UnknownItem, {id, alt_display}) :
      e(Item, {item, count: '', items, alt_display});
}

export function ItemLink({name, rarity, skin_name}) {
  skin_name = skin_name || name;
  const a_props = {href: getItemLinkUrl(name), className: rarity,
                   target: 'wiki', title: name};
  return e('a', a_props, skin_name);
}

export function SpidyLink({id}) {
  return e('a', {href: gw2spidy + id, target: 'wiki'}, id);
}

export function SmallSpidyLink({id}) {
  return e(React.Fragment, {},
           '(',
           e('span', {className: 'small'},
             e(SpidyLink, {id})),
           ')');
}

export function getItemLinkUrl(name) {
  return wiki_search + encodeURIComponent(name);
}

export function escapeEntities(st) {
  st = st || '';
  return st.replace(/["<>\&]/gm, function(i) {
    return '&#' + i.charCodeAt(0) + ';';
  });
}

function addInventory(slot, items, inventory, unknown_inv) {
  if (!slot) {
    return;
  }
  let item = items.get(slot.id);
  let inv_list;
  if (!item) {
    item = {id: slot.id};
    inv_list = unknown_inv;
  }
  else {
    if (!item_types.includes(item.type)) {
      item_types.push(item.type);
    }
    inv_list = inventory.get(item.type);
    if (!inv_list) {
      inv_list = [];
      inventory.set(item.type, inv_list);
    }
  }
  if ('upgrades' in slot || 'infusions' in slot || 'skin' in slot) {
    inv_list.push([item, slot.count, slot]);
    return;
  }
  let found = false;
  for (const prev of inv_list) {
    if (prev.length === 2 && prev[0].id === item.id) {
      prev[1] += slot.count;
      found = true;
      break;
    }
  }
  if (!found) {
    inv_list.push([item, slot.count]);
  }
}
