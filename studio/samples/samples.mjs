// Older invitation links land on the original Studio page, keeping the invitation.
const token = new URLSearchParams(location.hash.slice(1)).get('invite');
location.replace(new URL('../', location.href).href + (token ? '#invite=' + encodeURIComponent(token) : '#samples'));
