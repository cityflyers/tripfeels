// import { Plane } from "lucide-react";

interface RecentSearchCardProps {
  from?: { city: string; code: string };
  to?: { city: string; code: string };
  date?: string;
  returnDate?: string;
  type: string;
  travelers: number;
  onClick?: () => void;
  segments?: { from: { city: string; code: string }, to: { city: string; code: string }, date: string }[];
}

export default function RecentSearchCard({ from, to, date, returnDate, type, travelers, onClick, segments }: RecentSearchCardProps) {
  // Format dates
  const format = (d: string | undefined) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const formattedDate = format(date);
  const formattedReturnDate = format(returnDate);

  // Multicity display logic
  let route = "";
  let dateStr = "";
  if (segments && segments.length > 0) {
    route = segments
      .map(seg => (seg.from.city ? `${seg.from.city} (${seg.from.code})` : seg.from.code))
      .join(" → ")
      + " → "
      + (segments[segments.length - 1].to.city
          ? `${segments[segments.length - 1].to.city} (${segments[segments.length - 1].to.code})`
          : segments[segments.length - 1].to.code);
    dateStr = segments.map(seg => format(seg.date)).join(", ");
  }

  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-5 min-w-[220px] max-w-[260px] flex flex-col gap-2 cursor-pointer hover:ring-2 hover:ring-primary transition"
      onClick={onClick}
      tabIndex={0}
      role="button"
    >
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 text-black dark:text-white flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-6 h-6"
          >
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1v1l3-.5 3 .5v-1l-2-1v-5.5l8 2.5z"/>
          </svg>
        </span>
        <div>
          <div className="font-bold text-base text-black dark:text-white">
            {segments && segments.length > 0
              ? route
              : from && to && (
                  <>
                    {from.city} <span className="font-normal text-sm text-black dark:text-white">to</span> {to.city}
                  </>
                )
            }
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {segments && segments.length > 0
          ? dateStr
          : type === "Roundtrip" && formattedReturnDate
            ? `${formattedDate} - ${formattedReturnDate}`
            : formattedDate}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">{type} &bull; {travelers} traveler{travelers > 1 ? "s" : ""}</div>
    </div>
  );
} 