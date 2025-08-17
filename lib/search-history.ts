// Store last search per trip type
const LAST_SEARCH_KEY_PREFIX = "lastFlightSearch_";

export const getLastSearch = (tripType?: "oneway" | "roundtrip" | "multicity") => {
  if (typeof window === "undefined") return null;

  try {
    const key = tripType ? `${LAST_SEARCH_KEY_PREFIX}${tripType}` : undefined;
    let savedSearch = null;
    if (key) {
      savedSearch = localStorage.getItem(key);
    } else {
      // fallback: try to get any (for backward compatibility)
      savedSearch = localStorage.getItem("lastFlightSearch");
    }
    if (savedSearch) {
      const parsed = JSON.parse(savedSearch);

      // Convert date strings back to Date objects for oneway/roundtrip
      if (parsed.departureDate) {
        parsed.departureDate = new Date(parsed.departureDate);
      }
      if (parsed.returnDate) {
        parsed.returnDate = new Date(parsed.returnDate);
      }

      // Convert date strings back to Date objects for multicity segments
      if (parsed.segments && Array.isArray(parsed.segments)) {
        parsed.segments = parsed.segments.map((segment: any) => ({
          ...segment,
          date: segment.date ? new Date(segment.date) : undefined,
          departureDate: segment.departureDate ? new Date(segment.departureDate) : undefined,
        }));
      }

      return parsed;
    }
  } catch (error) {
    console.error("Error reading last search from localStorage:", error);
  }
  return null;
};

export const saveLastSearch = (tripType: "oneway" | "roundtrip" | "multicity", searchData: any) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LAST_SEARCH_KEY_PREFIX}${tripType}`, JSON.stringify(searchData));
  } catch (error) {
    console.error("Error saving last search to localStorage:", error);
  }
};

const RECENT_SEARCHES_KEY = "recentFlightSearches";

export const getRecentSearches = () => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      // Convert date strings back to Date objects if needed
      return arr.map((item: any) => ({
        ...item,
        date: item.date ? new Date(item.date) : undefined,
      }));
    }
  } catch (error) {
    console.error("Error reading recent searches from localStorage:", error);
  }
  return [];
};

export const saveRecentSearch = (search: any) => {
  if (typeof window === "undefined") return;
  // Only save if from and to have both city and code, or if multicity segments are valid
  const isMulticity = search.segments && Array.isArray(search.segments) && search.segments.length > 0;
  if (!isMulticity && (!search.from || !search.to || !search.from.city || !search.from.code || !search.to.city || !search.to.code)) {
    return;
  }
  if (isMulticity && !search.segments.every((seg: any) => seg.from && seg.to && seg.from.code && seg.to.code && seg.date)) {
    return;
  }
  try {
    const prev = getRecentSearches();
    // Always use ISO date string for hash
    let hash;
    if (isMulticity) {
      hash = search.segments.map((seg: any) => `${seg.from.code}-${seg.to.code}-${seg.date}`).join("|") + `-${search.type}-${search.travelers}`;
    } else {
      const dateStr = search.date
        ? (typeof search.date === "string"
            ? new Date(search.date).toISOString().slice(0, 10)
            : search.date.toISOString().slice(0, 10))
        : "";
      hash = `${search.from.code}-${search.to.code}-${dateStr}-${search.type}-${search.travelers}`;
    }
    const filtered = prev.filter((item: any) => {
      if (isMulticity && item.segments && Array.isArray(item.segments)) {
        const itemHash = item.segments.map((seg: any) => `${seg.from.code}-${seg.to.code}-${seg.date}`).join("|") + `-${item.type}-${item.travelers}`;
        return itemHash !== hash;
      }
      if (!isMulticity && item.from && item.to) {
        const itemDateStr = item.date
          ? (typeof item.date === "string"
              ? new Date(item.date).toISOString().slice(0, 10)
              : item.date.toISOString().slice(0, 10))
          : "";
        const itemHash = `${item.from.code}-${item.to.code}-${itemDateStr}-${item.type}-${item.travelers}`;
        return itemHash !== hash;
      }
      return true;
    });
    const newArr = [{ ...search }, ...filtered].slice(0, 10);
    console.log("[saveRecentSearch] Saving:", search);
    console.log("[saveRecentSearch] New recent searches:", newArr);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newArr));
  } catch (error) {
    console.error("Error saving recent search to localStorage:", error);
  }
}; 