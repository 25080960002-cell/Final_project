/**
 * Pemuatan Google Maps JavaScript API sekali per aplikasi.
 * Kunci API dibaca dari lingkungan frontend: VITE_GOOGLE_MAPS_API_KEY.
 * Tanpa kunci, halaman peta memakai mode skema GeoJSON (fallback) yang tetap berfungsi.
 */
const loadState = { promise: null };

export function isGoogleMapsConfigured() {
  return Boolean(String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim());
}

export function loadGoogleMaps() {
  if (!isGoogleMapsConfigured()) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY belum diatur di .env frontend.'));
  }
  if (loadState.promise) return loadState.promise;
  if (window.google?.maps) return Promise.resolve(window.google);

  loadState.promise = new Promise((resolve, reject) => {
    const key = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).trim();
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&region=ID&language=id&loading=async`;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else {
        loadState.promise = null;
        reject(new Error('Google Maps tidak tersedia dari skript yang dimuat.'));
      }
    };
    script.onerror = () => {
      loadState.promise = null;
      reject(new Error('Skrip Google Maps gagal dimuat. Periksa koneksi internet atau kunci API.'));
    };
    document.head.appendChild(script);
  });
  return loadState.promise;
}
