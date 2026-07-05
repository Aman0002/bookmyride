import { NextRequest, NextResponse } from "next/server";

const HISAR_FALLBACKS = [
  { display_name: "Travellers Dost, Hisar, Haryana, India", lat: "29.1492", lon: "75.7217" },
  { display_name: "Hisar City Centre, Hisar, Haryana, India", lat: "29.1492", lon: "75.7217" },
  { display_name: "Sector 15, Hisar, Haryana, India", lat: "29.1621", lon: "75.7208" },
  { display_name: "Model Town, Hisar, Haryana, India", lat: "29.1557", lon: "75.7157" },
  { display_name: "Delhi Road, Hisar, Haryana, India", lat: "29.1414", lon: "75.7200" },
  { display_name: "Gandhi Nagar, Hisar, Haryana, India", lat: "29.1550", lon: "75.7080" },
  { display_name: "Shivaji Colony, Hisar, Haryana, India", lat: "29.1663", lon: "75.7236" },
  { display_name: "Rampura, Hisar, Haryana, India", lat: "29.1647", lon: "75.7170" },
  { display_name: "Uklana Road, Hisar, Haryana, India", lat: "29.1510", lon: "75.7120" },
  { display_name: "Azad Nagar, Hisar, Haryana, India", lat: "29.1480", lon: "75.7090" },
];

function buildQueries(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return [];

  const variants = new Set<string>();
  variants.add(cleaned);
  variants.add(`${cleaned} hisar`);
  variants.add(`${cleaned} hisar haryana`);
  variants.add(`${cleaned} haryana`);

  const simplified = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (simplified) {
    variants.add(simplified);
    variants.add(`${simplified} hisar`);
    variants.add(`${simplified} hisar haryana`);
  }

  const prefixes = ["traveller", "travellers", "travel", "dost", "hotel", "shop", "station"];
  for (const prefix of prefixes) {
    if (simplified.includes(prefix)) {
      variants.add(`${prefix} hisar`);
      variants.add(`${prefix} hisar haryana`);
    }
  }

  return Array.from(variants).slice(0, 6);
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  const suggestions: Array<{ display_name: string; lat: string; lon: string }> = [];
  const seen = new Set<string>();
  const lower = query.toLowerCase();
  const geoapifyKey = process.env.GEOAPIFY_API_KEY?.trim();

  try {
    if (geoapifyKey) {
      const queries = buildQueries(query);
      for (const q of queries) {
        const params = new URLSearchParams({
          text: q,
          apiKey: geoapifyKey,
          limit: "8",
          lang: "en",
          filter: "countrycode:in",
          bias: "proximity:75.7217,29.1492",
        });
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        for (const item of Array.isArray(data.features) ? data.features : []) {
          const properties = item?.properties;
          const placeName = properties?.formatted || properties?.name || properties?.address_line1 || properties?.street;
          const lat = properties?.lat ?? item?.geometry?.coordinates?.[1];
          const lon = properties?.lon ?? item?.geometry?.coordinates?.[0];
          if (!placeName || lat == null || lon == null) continue;
          const key = `${placeName}|${lat}|${lon}`;
          if (seen.has(key)) continue;
          seen.add(key);
          suggestions.push({
            display_name: placeName,
            lat: String(lat),
            lon: String(lon),
          });
          if (suggestions.length >= 8) break;
        }
        if (suggestions.length >= 8) break;
      }
    }
  } catch {
    // fall back to static Hisar suggestions below
  }

  const normalized = lower.replace(/[^a-z0-9]+/g, " ").trim();
  const hasLocalHint = /hisar|haryana|traveller|travellers|dost|sector|town|road|colony|nagar/i.test(lower);

  if (suggestions.length === 0) {
    for (const item of HISAR_FALLBACKS) {
      const key = `${item.display_name}|${item.lat}|${item.lon}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push(item);
      if (suggestions.length >= 5) break;
    }
  }

  if (suggestions.length === 0 && /hisar|haryana/i.test(lower)) {
    return NextResponse.json(HISAR_FALLBACKS.slice(0, 5));
  }

  if (suggestions.length > 0 && (normalized.length <= 6 || hasLocalHint)) {
    const scored = suggestions
      .map((item) => ({
        ...item,
        score: item.display_name.toLowerCase().includes(normalized) ? 2 : 0,
      }))
      .sort((a, b) => b.score - a.score);
    return NextResponse.json(scored.slice(0, 8));
  }

  return NextResponse.json(suggestions.slice(0, 8));
}
