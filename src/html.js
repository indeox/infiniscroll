export function renderHtml(html) {
  const node = document.createElement('div');
  node.innerHTML = html;
  return node.firstChild;
}

export function makeContent(size, item) {
  return Array(size).fill().map((_, i) => {
    const node = renderHtml(item);
    node.setAttribute('data-index', i);
    return {
      id: i,
      node
    };
  });
}
