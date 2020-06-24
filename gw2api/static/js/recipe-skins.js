import {makeJSONRequest} from './xhr.js';
import {escapeEntities} from './item-display.js';
import {SkinGroup} from './skin-display.js';
import {api_url_prefix} from './api-url.js';

const e = React.createElement;

function renderData(data) {
  if (data.error) {
    const msg = document.getElementById('message');
    if (msg) {
      msg.innerHTML = escapeEntities(data.error);
      msg.style.display = 'block';
    }
  }
  else {
    ReactDOM.render(e(SkinGroup, data), document.getElementById('data'));
  }
}

async function loadData() {
  const url = `${api_url_prefix}get-recipe-skins${window.location.search}`;
  const data = await makeJSONRequest({url});
  renderData(data);
}

loadData();
