import RecentSearchCard from "./RecentSearchCard";
import { getRecentSearches } from "@/lib/search-history";
import { useEffect, useState } from "react";

export default function RecentSearches({ onSelect }: { onSelect?: (item: any) => void }) {
  const [searches, setSearches] = useState<any[]>([]);

  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  const validSearches = searches.filter(item => {
    if (item.segments && Array.isArray(item.segments) && item.segments.length > 0) {
      // Multicity: all segments must have from/to with code
      return item.segments.every((seg: any) => seg.from && seg.to && seg.from.code && seg.to.code && seg.date);
    }
    // Oneway/Roundtrip: must have from/to with code
    return item.from && item.to && item.from.code && item.to.code;
  });
  if (!validSearches.length) return null;

  return (
    <section className="mt-8 ml-8">
      <h2 className="text-lg font-semibold mb-4 ml-2">Recent Search</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {validSearches.slice(0, 10).map((item, idx) => (
          <RecentSearchCard
            key={idx}
            {...item}
            date={
              typeof item.date === "string"
                ? item.date
                : item.date instanceof Date
                ? item.date.toLocaleDateString()
                : ""
            }
            onClick={() => onSelect?.(item)}
          />
        ))}
      </div>
    </section>
  );
} 