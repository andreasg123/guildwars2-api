import {getItemLinkUrl} from './item-display.js';

const e = React.createElement;

export function SkinGroup({skins, account_skins}) {
  const divs = [];
  for (const skin of skins) {
    const locked = account_skins && !account_skins.includes(skin.id);
    const thumb_class = 'thumb' + (locked ? ' locked' : '');
    const name = skin.name || skin.id;
    divs.push(e('div', {className: 'skin', key: skin.id},
                e(SkinLink, {name, target: 'wiki'},
                  e('img', {className: thumb_class, src: skin.icon, alt: ''})),
                e('div', {className: 'name'},
                  e(SkinLink, {name, target: 'wiki'}, name))));
  }
  return e('div', {className: 'container'}, divs);
}

function SkinLink({name, target = 'wiki', children}) {
  const a_props = {href: getItemLinkUrl(name)};
  if (target) {
    a_props.target = target;
  }
  return e('a', a_props, children);
}
