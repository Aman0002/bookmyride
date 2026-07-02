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

// Geocode an address to coordinates. Uses Google Geocoding when a server key is
// configured, otherwise a dev fallback that only recognizes Hisar-area text.
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (key) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&region=in&key=${key}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results?.[0]) {
        const r = data.results[0];
        return {
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          formattedAddress: r.formatted_address,
          approximate: false,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Dev fallback (no API key): recognize Hisar-area addresses only.
  const text = address.toLowerCase();
  const hisarHints = ["hisar", "hissar", "hisar,"];
  if (hisarHints.some((h) => text.includes(h))) {
    // Small deterministic jitter so distinct addresses aren't identical.
    const seed = Array.from(address).reduce((s, c) => s + c.charCodeAt(0), 0);
    const jitter = ((seed % 60) - 30) / 1000; // ~ +-3km
    return {
      lat: HISAR_CENTER.lat + jitter,
      lng: HISAR_CENTER.lng + jitter,
      formattedAddress: address,
      approximate: true,
    };
  }
  return null;
}
