// Klien HTTP kecil dengan cookie jar untuk menguji API sebagai pengguna berbeda.
export class Client {
  constructor(baseUrl) { this.baseUrl = baseUrl; this.cookie = ''; }

  async request(method, path, { body, raw, headers = {} } = {}) {
    const init = { method, headers: { Accept: 'application/json', ...headers } };
    if (this.cookie) init.headers.Cookie = this.cookie;
    if (raw !== undefined) init.body = raw;
    else if (body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    const response = await fetch(`${this.baseUrl}${path}`, init);
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const pair = setCookie.split(';')[0];
      this.cookie = pair.endsWith('=') ? '' : pair;
    }
    const json = await response.json().catch(() => null);
    return { status: response.status, body: json, headers: response.headers };
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, { body }); }
  patch(path, body) { return this.request('PATCH', path, { body }); }
  delete(path) { return this.request('DELETE', path); }
}

let counter = 0;
export const uniqueEmail = (label) => `${label}-${Date.now().toString(36)}${counter++}@uji.mapan.test`;
export const GOOD_PASSWORD = 'SandiUji2026xyz';
