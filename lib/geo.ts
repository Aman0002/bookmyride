// Hisar city center (approx). Editable in admin via ServiceArea.
export const HISAR_CENTER = { lat: 29.1492, lng: 75.7217 };

export type GeoPoint = { lat: number; lng: number };

// Great-circle distance in km.
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
  approximate: boolean;
};

// Geocode an address to coordinates using Nominatim (OpenStreetMap) when available.
// Falls back to a simple Hisar-area heuristic when the service is unavailable.
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const text = address.trim();
  if (!text) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=in&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "BookMyRide/1.0",
      },
    });
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (first?.lat && first?.lon) {
      return {
        lat: Number(first.lat),
        lng: Number(first.lon),
        formattedAddress: first.display_name || text,
        approximate: false,
      };
    }
  } catch {
    // Fall through to the heuristic fallback below.
  }

  // Dev fallback: recognize Hisar-area addresses only.
  const lower = text.toLowerCase();
  const hisarHints = ["hisar", "hissar", "hisar,"];
  if (hisarHints.some((h) => lower.includes(h))) {
    const seed = Array.from(text).reduce((s, c) => s + c.charCodeAt(0), 0);
    const jitter = ((seed % 60) - 30) / 1000; // ~ +-3km
    return {
      lat: HISAR_CENTER.lat + jitter,
      lng: HISAR_CENTER.lng + jitter,
      formattedAddress: text,
      approximate: true,
    };
  }
  return null;
}
