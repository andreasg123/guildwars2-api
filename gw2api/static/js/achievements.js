import {ItemLink, getItemLinkUrl, escapeEntities} from './item-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

const sort_keys = ['category_order', 'tier', 'tier_current', 'tier_count', 'tier_completion',
                   'tier_points', 'score', 'current', 'total_count', 'total_completion',
                   'remaining_points', undefined, 'name'];
const labels = ['cat', 'tr', 'done', 'goal', 'pct',
                'ach', 'score', 'done', 'goal', 'pct',
                'ach', '', 'Achievement', 'Missing'];
const asc_keys = new Set(['category_order', 'name']);

// The API doesn't have a proper key yet for Icebrood Saga mastery icons.
const mastery_icons = {
  Tyria: 'https://wiki.guildwars2.com/images/thumb/b/b7/Mastery_point_%28Central_Tyria%29.png/20px-Mastery_point_%28Central_Tyria%29.png',
  Maguuma: 'https://wiki.guildwars2.com/images/thumb/8/84/Mastery_point_%28Heart_of_Thorns%29.png/20px-Mastery_point_%28Heart_of_Thorns%29.png',
  Desert: 'https://wiki.guildwars2.com/images/thumb/4/41/Mastery_point_%28Path_of_Fire%29.png/20px-Mastery_point_%28Path_of_Fire%29.png',
  Unknown: 'https://wiki.guildwars2.com/images/thumb/2/25/Mastery_point_%28Icebrood_Saga%29.png/20px-Mastery_point_%28Icebrood_Saga%29.png'
};

function Achievements({achievements, categories, groups, ...props}) {
  const [showLocked, setShowLocked] = React.useState(true);
  const [onlyMasteries, setOnlyMasteries] = React.useState(false);
  const [sortKey, setSortKey] = React.useState('category_order');
  const [sortDesc, setSortDesc] = React.useState(false);
  const [displayedGroups, setDisplayedGroups] = React.useState(() => {
    const unchecked = ['Historical', 'Other'];
    return new Set(groups.map(g => g.name).filter(n => !unchecked.includes(n)));
  });
  sortAchievements(achievements, sortKey, sortDesc);
  const onShowLockedChange = () => {
    setShowLocked(!showLocked);
  };
  const onOnlyMasteriesChange = () => {
    setOnlyMasteries(!onlyMasteries);
  };
  const onChange = evt => {
    const name = evt.target.name;
    const dg = new Set(displayedGroups);
    if (dg.has(name)) {
      dg.delete(name);
    }
    else {
      dg.add(name);
    }
    setDisplayedGroups(dg);
  };
  const onButtonClick = evt => {
    setDisplayedGroups(evt.target.value === 'None' ? new Set() :
                       new Set(groups.map(g => g.name)));
  };
  const onClick = evt => {
    // Strip "sort_"
    const new_key = evt.currentTarget.id.substring(5);
    if (new_key === 'undefined') {
      return;
    }
    if (new_key === sortKey) {
      setSortDesc(!sortDesc);
    }
    else {
      setSortDesc(!asc_keys.has(new_key));
      setSortKey(new_key);
    }
  };
  const checkboxes = [];
  for (const g of groups) {
    checkboxes.push(e('span', {className: 'nowrap'},
                      e('input',
                        {name: g.name, type: 'checkbox', onChange,
                         checked: displayedGroups.has(g.name)}),
                      g.name),
                    ' ');
  }
  checkboxes.push('\u00a0\u00a0',
                  e('input',
                    {type: 'button', style: {width: '4.5em'},
                     value: displayedGroups.size ? 'None' : 'All',
                     onClick: onButtonClick}));
  const included_ids = getShownAchievements(groups, categories, displayedGroups);
  const rows = [];
  rows.push(e(AchievementsHeader, {key: 'header', sortKey, onClick}));
  let alt_display = true;
  for (let i = 0; i < achievements.length; i++) {
    const a = achievements[i];
    let mastery_region = null;
    if (a.rewards)
      for (let j = 0; j < a.rewards.length; j++)
        if (a.rewards[j].type === 'Mastery') {
          mastery_region = a.rewards[j].region;
          break;
        }
    if (!included_ids.has(a.id) ||
        (!showLocked && a.locked) ||
        (onlyMasteries && !mastery_region)) {
      continue;
    }
    rows.push(e(Achievement, {key: a.id, achievement: a, categories, props,
                              alt_display, mastery_region}));
    alt_display = !alt_display;
  }
  const intro = e('p', {}, 
                  'Click on column headings to sort.  ',
                  'The previous sort order becomes the secondary order.  ',
                  'Mouse over category icons and achievement names for tooltips.  ',
                  'The score (points * percent) indicates promising areas.',
                  e('br', {}),
                  e('input', {type: 'checkbox', checked: showLocked,
                              onChange: onShowLockedChange}),
                  ' Include locked achievements (shown in italics).',
                  e('input', {type: 'checkbox', checked: onlyMasteries,
                              onChange: onOnlyMasteriesChange}),
                  ' Show only achievements giving mastery points.');
  return e(React.Fragment, {},
           intro,
           e('p', {}, ...checkboxes),
           e('table', {},
             e('tbody', {}, rows)));
}

function AchievementsHeader({sortKey, onClick}) {
  const rows = [];
  rows.push(e('tr', {},
              e('th', {}, '\u00a0'),
              e('th', {colSpan: '6'}, 'Tier'),
              e('th', {colSpan: '4'}, 'Total'),
              e('th', {colSpan: '2'}, '\u00a0')));
  const cells = [];
  for (let i = 0; i < 14; i++) {
    let label = labels[i]
    let class_name = 'sort';
    switch (i) {
    case 12:
      class_name = 'sort-left';
      break;
    case 11:
      class_name = null;
      break;
    case 13:
      class_name = null;
      break;
    }
    const cell_props = {id: 'sort_' + sort_keys[i], onClick};
    if (class_name) {
      cell_props.className = class_name;
    }
    cells.push(e('th', cell_props,
                 sort_keys[i] === sortKey ? e('u', {}, label) : label));
  }
  rows.push(e('tr', {}, ...cells));
  return e(React.Fragment, {}, ...rows);
}

function Achievement({achievement, categories, props, alt_display, mastery_region}) {
  const a = achievement;
  const row_props = {style: {verticalAlign: 'top'}};
  let class_name = '';
  if (alt_display) {
    class_name = appendClassName(class_name, 'alt');
  }
  if (a.locked) {
    class_name = appendClassName(class_name, 'locked');
  }
  if (mastery_region) {
    class_name = appendClassName(class_name, 'mastery');
  }
  if (class_name) {
    row_props.className = class_name;
  }
  const cells = [];
  const c = categories[a.category];
  if (c) {
    cells.push(e('td', {},
                 e(AchievementLink, {name: c.name, title: c.name},
                   e('img', {src: c.icon}))));
  }
  else {
    cells.push(e('td', {}));
  }
  cells.push(e('td', {className: 'right'}, ((a.tier || 0) + 1)),
             e('td', {className: 'right'}, toLocaleFixed(a.tier_current || 0, 0)),
             e('td', {className: 'right'}, toLocaleFixed(a.tier_count, 0)),
             e('td', {className: 'right'}, (100 * (a.tier_completion || 0)).toFixed(0) + '%'),
             e('td', {className: 'right'}, toLocaleFixed(a.tier_points, 0)),
             e('td', {className: 'right'}, toLocaleFixed(a.score, 1)),
             e('td', {className: 'right'}, toLocaleFixed(a.current || 0, 0)),
             e('td', {className: 'right'}, toLocaleFixed(a.total_count)),
             e('td', {className: 'right'}, (100 * a.total_completion).toFixed(0) + '%'),
             e('td', {className: 'right'}, toLocaleFixed(a.remaining_points, 0)));
  if (mastery_region) {
    cells.push(e('td', {}, e('img', {src: mastery_icons[mastery_region]})));
  }
  else {
    cells.push(e('td', {}));
  }
  let title = a.requirement;
  if (a.description && a.description.lastIndexOf('Story Instance: ', 0) === 0) {
    const pos = a.description.indexOf('<');
    title += ' (' + a.description.substring(0, pos < 0 ? a.description.length : pos) + ')';
  }
  cells.push(e('td', {style: {width: '20em'}},
               e(AchievementLink, {name: a.name, title}, a.name)));
  const missing = [];
  if (a.missing) {
    for (let j = 0; j < a.missing.length; j++) {
      const entry = a.missing[j];
      if (!entry.type || (entry.type === 'Text' && !entry.text)) {
        continue;
      }
      if (missing.length > 0) {
        missing.push('\u00a0| ');
      }
      if (entry.type === 'Text') {
        missing.push(entry.text);
      }
      else if (entry.id) {
        const item = props[entry.type][entry.id];
        if (item) {
          missing.push(e(ItemLink, {name: item.name, rarity: item.rarity}));
        }
        else {
          missing.push(entry.type + ' ' + entry.id);
        }
      }
      else {
        // This shouldn't happen
        missing.push(JSON.stringify(entry));
      }
    }
  }
  cells.push(e('td', {}, e('div', {className: 'missing'}, ...missing)));
  return e('tr', row_props, ...cells);
}

function AchievementLink({name, title, target = 'wiki', children}) {
  const a_props = {href: getItemLinkUrl(name)};
  if (target) {
    a_props.target = target;
  }
  if (title) {
    a_props.title = title;
  }
  return e('a', a_props, children);
}

function appendClassName(prev_name, add) {
  return prev_name ? prev_name + ' ' + add : add;
}

function getShownAchievements(groups, categories, displayedGroups) {
  const included_ids = new Set();
  for (let g of groups) {
    if (!displayedGroups.has(g.name)) {
      continue;
    }
    for (let cid in categories) {
      const c = categories[cid];
      if (g.categories.includes(Number(cid))) {
        for (let a of c.achievements) {
          included_ids.add(a);
        }
      }
    }
  }
  return included_ids;
}

function compareProperties(prop, desc, a, b) {
  let a_prop = a[prop];
  let b_prop = b[prop];
  if (typeof a_prop === 'number' || typeof b_prop === 'number') {
    a_prop = a_prop || 0;
    b_prop = b_prop || 0;
  }
  if (a_prop < b_prop)
    return desc ? 1 : -1;
  else if (a_prop > b_prop)
    return desc ? -1 : 1;
  else
    return 0;
}

function sortAchievements(achievements, sort_key, desc) {
  achievements.sort(function(a, b) {
    return compareProperties(sort_key, desc, a, b);
  });
}

function initData({achievements, categories}) {
  for (const a of achievements) {
    // There is no point to include the achievement ID in the category order
    // because it isn't always in a logical order.
    // 2183: Twilight III: Dusk; 2184: Twilight II: The Perfected Nightsword 
    const c = categories[a.category];
    if (c) {
      a.category_order = c.order;
    }
    a.tier_points = a.tier_points || 0;
    a.tier_completion = (a.tier_current || 0) / a.tier_count;
    a.total_completion = (a.current || 0) / a.total_count;
    a.score = a.tier_completion === 0 ? 0.00001 * a.tier_points :
      (a.tier_points + 0.01) * a.tier_completion;
    a.remaining_points = a.point_cap - (a.points || 0);
  }
  // Sort by name so that it is the secondary order for the
  // initial category order.
  sortAchievements(achievements, 'name', false);
}

function toLocaleFixed(x, n) {
  x = x || 0;
  return x.toLocaleString(undefined, {minimumFractionDigits: n, maximumFractionDigits: n});
}

function renderData(data) {
  if (data.error) {
    const msg = document.getElementById('message');
    if (msg) {
      msg.innerHTML = escapeEntities(data.error);
      msg.style.display = 'block';
    }
  }
  initData(data);
  ReactDOM.render(e(Achievements, data),
                  document.getElementById('data'));
}

async function loadData() {
  const url = `${api_url_prefix}get-achievements${window.location.search}`;
  const res = await fetch(url);
  const data = await res.json();
  renderData(data);
}

loadData();
