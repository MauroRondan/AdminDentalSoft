export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function get(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function remove(key) {
  localStorage.removeItem(key);
}
