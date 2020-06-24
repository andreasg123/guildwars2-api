function appendQueryString() {
  if (!window.location.search) {
    return;
  }
  const links = document.querySelectorAll('a');
  for (let i = 0; i < links.length; i++) {
    links[i].href += window.location.search;
  }
}

appendQueryString();
