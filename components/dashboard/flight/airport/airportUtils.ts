import airportsData from '../../../../airports.json';

export interface Airport {
  city: string;
  country: string;
  airportName: string;
  code: string;
}

// Convert the airport data to our Airport interface
export const airports: Airport[] = airportsData
  .filter((airport: any) => airport.iata && airport.city && airport.country) // Only keep airports with all required fields
  .map((airport: any) => ({
    city: airport.city,
    country: airport.country,
    airportName: airport.name,
    code: airport.iata
  }));

export function searchAirports(query: string): Airport[] {
  const normalizedQuery = query.toLowerCase().trim();

  // First, filter as before
  const filtered = airports.filter(airport => {
    return (
      airport.city.toLowerCase().includes(normalizedQuery) ||
      airport.country.toLowerCase().includes(normalizedQuery) ||
      airport.airportName.toLowerCase().includes(normalizedQuery) ||
      airport.code.toLowerCase().includes(normalizedQuery)
    );
  });

  // Then, sort: exact code match > code starts with > code includes > others
  const sorted = filtered.sort((a, b) => {
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();
    // 1. Exact code match
    if (aCode === normalizedQuery && bCode !== normalizedQuery) return -1;
    if (bCode === normalizedQuery && aCode !== normalizedQuery) return 1;
    // 2. Code starts with query
    if (aCode.startsWith(normalizedQuery) && !bCode.startsWith(normalizedQuery)) return -1;
    if (bCode.startsWith(normalizedQuery) && !aCode.startsWith(normalizedQuery)) return 1;
    // 3. Code includes query
    if (aCode.includes(normalizedQuery) && !bCode.includes(normalizedQuery)) return -1;
    if (bCode.includes(normalizedQuery) && !aCode.includes(normalizedQuery)) return 1;
    // 4. Otherwise, keep original order
    return 0;
  });

  return sorted.slice(0, 10); // Limit to 10 results for better performance
} 