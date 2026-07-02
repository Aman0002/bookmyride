import { prisma } from "./prisma";
import { geocodeAddress, haversineKm, HISAR_CENTER } from "./geo";

export type PickupValidation = {
  ok: boolean;
  withinRadius: boolean;
  distanceKm: number | null;
  radiusKm: number;
  lat: number | null;
  lng: number | null;
  formattedAddress: string;
  message: string;
};

async function getServiceArea() {
  const area = await prisma.serviceArea.findFirst();
  return (
    area ?? {
      centerLat: HISAR_CENTER.lat,
      centerLng: HISAR_CENTER.lng,
      radiusKm: 10,
      name: "Hisar",
    }
  );
}

// Validate a pickup address against the Hisar service area. Accepts optional
// pre-resolved coordinates (from client Google autocomplete); otherwise
// geocodes the address text.
export async function validatePickup(
  address: string,
  lat?: number | null,
  lng?: number | null
): Promise<PickupValidation> {
  const area = await getServiceArea();
  const base = {
    radiusKm: area.radiusKm,
    formattedAddress: address,
  };

  let coords = lat != null && lng != null ? { lat, lng } : null;
  let formatted = address;

  if (!coords) {
    const geo = await geocodeAddress(address);
    if (!geo) {
      return {
        ...base,
        ok: false,
        withinRadius: false,
        distanceKm: null,
        lat: null,
        lng: null,
        message:
          "We couldn't locate this address. Please pick a valid address within Hisar.",
      };
    }
    coords = { lat: geo.lat, lng: geo.lng };
    formatted = geo.formattedAddress;
  }

  const distanceKm = haversineKm(
    { lat: area.centerLat, lng: area.centerLng },
    coords
  );
  const withinRadius = distanceKm <= area.radiusKm;

  return {
    ...base,
    ok: withinRadius,
    withinRadius,
    distanceKm: Math.round(distanceKm * 10) / 10,
    lat: coords.lat,
    lng: coords.lng,
    formattedAddress: formatted,
    message: withinRadius
      ? `Great! Pickup available (~${Math.round(distanceKm * 10) / 10} km from ${area.name} center).`
      : `Sorry, this address is ~${Math.round(distanceKm * 10) / 10} km away, outside our ${area.radiusKm} km ${area.name} service area.`,
  };
}
