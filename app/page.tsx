"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { shows, getMixcloudEmbedUrl, type Show, type ShowTracklist } from "@/data/shows";

type MixcloudShow = {
  key: string;
  name: string;
  created_time: string;
  slug: string;
};

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getYear(isoDate: string): number {
  return new Date(isoDate).getUTCFullYear();
}

function parseBroadcastDate(name: string): string | null {
  const monthMap: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  const m = name.match(/(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})/i);
  if (!m) return null;
  const month = monthMap[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle
        cx="20" cy="20" r="18"
        stroke="#E70000" strokeWidth="1.5" fill="none"
        style={{ animation: "pulse-ring-outer 3.5s ease-in-out infinite" }}
      />
      <circle
        cx="20" cy="20" r="12"
        stroke="#E70000" strokeWidth="1.5" fill="none"
        style={{ animation: "pulse-ring-inner 3.5s ease-in-out infinite 0.4s" }}
      />
      <circle cx="20" cy="20" r="5.5" fill="#E70000" />
    </svg>
  );
}

// ─── Show card ────────────────────────────────────────────────────────────────
function ShowCard({
  show,
  isSelected,
  onClick,
}: {
  show: Show & { mixcloudKey: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const hasTracklist =
    show.tracklist &&
    ((Array.isArray(show.tracklist.tim) && show.tracklist.tim.length > 0) ||
      (Array.isArray(show.tracklist.martyn) && show.tracklist.martyn.length > 0));

  const dateStr = formatDisplayDate(show.date);
  const numStr = String(show.number);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !isSelected && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block w-full relative overflow-hidden"
      style={{
        height: 90,
        background: hovered && !isSelected ? "rgba(231,0,0,0.1)" : "#ffffff",
        transition: "background-color 200ms ease",
      }}
    >
      {/* ── Red ripple circle ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 4000,
          height: 4000,
          left: 55,
          top: "50%",
          transform: `translate(-50%, -50%) scale(${isSelected ? 1 : 0})`,
          background: "#E70000",
          transition: isSelected
            ? "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "transform 380ms cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 0,
        }}
      />

      {/* ── Collapsed content layer ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isSelected ? 0 : 1,
          transition: isSelected ? "opacity 150ms ease" : "opacity 200ms ease 280ms",
          zIndex: 1,
        }}
      >
        <span
          className="absolute font-black leading-none select-none text-[140px] sm:text-[150px] left-[-26px] sm:left-[-16px]"
          style={{
            letterSpacing: "-8px",
            color: hovered ? "#E70000" : "#000",
            top: "50%",
            transform: "translateY(-50%)",
            transition: "color 0.1s",
          }}
        >
          {numStr}
        </span>

        <span
          className={`absolute text-[13px] sm:text-[14px] text-black top-1/2 -translate-y-1/2 sm:top-[16px] sm:translate-y-0 sm:left-[200px] sm:right-auto ${show.photo ? "right-[112px]" : "right-[12px]"}`}
          style={{ fontWeight: hovered ? 500 : 400 }}
        >
          {dateStr}
        </span>

        {show.quote && (
          <span
            className="hidden sm:block absolute text-[12px] sm:text-[13px] overflow-hidden whitespace-nowrap text-left"
            style={{
              left: 200, top: 52,
              right: show.photo ? 126 : 26,
              textOverflow: "ellipsis",
              color: hovered ? "#000" : "#999",
              transition: "color 0.1s",
            }}
          >
            &ldquo;{show.quote}&rdquo;
          </span>
        )}

        {hasTracklist && (
          <span
            className="hidden sm:block absolute text-[12px] sm:text-[13px]"
            style={{
              right: show.photo ? 126 : 26, top: 16,
              color: hovered ? "#000" : "#999",
              transition: "color 0.1s",
            }}
          >
            Tracklist
          </span>
        )}

        {/* T indicator — mobile only */}
        {hasTracklist && (
          <span
            className="sm:hidden absolute text-[11px] text-[#999]"
            style={{ right: show.photo ? 112 : 12, top: 12 }}
          >
            Tracklist
          </span>
        )}

        {show.photo && (
          <div className="absolute right-0 top-0 h-full overflow-hidden" style={{ width: 100 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={show.photo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* ── Expanded content layer ── */}
      <div
        className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none"
        style={{
          opacity: isSelected ? 1 : 0,
          transition: isSelected ? "opacity 200ms ease 320ms" : "opacity 120ms ease",
          zIndex: 1,
        }}
      >
        <span
          className="font-black text-black leading-none"
          style={{ fontSize: "clamp(36px, 5.5vw, 64px)", letterSpacing: "-0.05em" }}
        >
          BH{String(show.number).padStart(2, "0")}
        </span>
        <span
          className="font-black text-black leading-none"
          style={{ fontSize: "clamp(36px, 5.5vw, 64px)", letterSpacing: "-0.05em" }}
        >
          {dateStr}
        </span>
      </div>
    </button>
  );
}

// ─── Tracklist section ────────────────────────────────────────────────────────
function TracklistSection({
  label,
  tracks,
}: {
  label: string;
  tracks: { artist: string; title: string }[] | null | undefined;
}) {
  if (tracks === undefined) return null;
  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-widest text-[#999] mb-2">{label}</div>
      {tracks === null ? (
        <p className="text-[13px] text-[#999] font-light">Tracklisting not available</p>
      ) : (
        <ol className="space-y-0.5">
          {tracks.map((track, i) => (
            <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
              <span className="text-[#999] shrink-0 w-5 text-right tabular-nums">{i + 1}</span>
              <span className="font-light text-[#666]">
                <span className="text-black font-normal">{track.artist}</span>
                {" — "}
                {track.title}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Show player ──────────────────────────────────────────────────────────────
function ShowPlayer({
  show,
  isSelected,
  autoOpenTracklist,
}: {
  show: Show & { mixcloudKey: string };
  isSelected: boolean;
  autoOpenTracklist?: boolean;
}) {
  const [tracklistOpen, setTracklistOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const embedUrl = getMixcloudEmbedUrl(show.mixcloudKey);
  const hasAnyTracklist =
    show.tracklist !== undefined &&
    ((Array.isArray(show.tracklist.tim) && show.tracklist.tim.length > 0) ||
      (Array.isArray(show.tracklist.martyn) && show.tracklist.martyn.length > 0));

  // Fade in after card animation settles; reset opacity when collapsed
  useEffect(() => {
    if (!isSelected) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, [isSelected]);

  useEffect(() => {
    if (autoOpenTracklist && hasAnyTracklist) setTracklistOpen(true);
  }, [autoOpenTracklist, hasAnyTracklist]);

  const timFirst =
    show.timFirst !== undefined
      ? show.timFirst
      : show.number >= 32 && show.number <= 58
        ? show.number % 2 === 0
        : show.number % 2 !== 0;

  return (
    <div
      className="bg-white px-5 pt-5 pb-6"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 500ms ease" }}
    >
      {show.quote && (
        <p className="text-[14px] font-light text-[#666] leading-[20px] mb-5">
          &ldquo;{show.quote}&rdquo;
        </p>
      )}

      <div className="mb-5">
        {show.id === "bh26" ? (
          <div
            className="w-full flex items-center justify-center text-center px-6"
            style={{ height: 120, border: "1px solid #e0e0e0", color: "#999", fontSize: 13, lineHeight: 1.6, fontWeight: 300 }}
          >
            This show was all Ryuichi Sakamoto songs in tribute to him so MixCloud won&rsquo;t host it.
          </div>
        ) : (
          <iframe
            src={embedUrl}
            width="100%"
            height="120"
            frameBorder={0}
            scrolling="no"
            loading="lazy"
            allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share"
            className="block"
            title={`Bamboo House BH${String(show.number).padStart(2, "0")} — ${formatDisplayDate(show.date)}`}
          />
        )}
      </div>

      {/* Photo + tracklist */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {show.photo && (
          <div className="shrink-0 w-full sm:w-[200px] sm:h-[200px] overflow-hidden order-first sm:order-last">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={show.photo} alt="" className="w-full aspect-square object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0 order-last sm:order-first">
          {hasAnyTracklist ? (
            <div>
              <button
                onClick={() => setTracklistOpen((o) => !o)}
                className="flex items-center gap-2 text-[12px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors mb-4"
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"
                  className={`transition-transform duration-200 ${tracklistOpen ? "rotate-90" : ""}`}>
                  <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {tracklistOpen ? "Hide" : "Show"} tracklisting
              </button>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: tracklistOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 400ms ease, opacity 400ms ease",
                  opacity: tracklistOpen ? 1 : 0,
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <div className="border-t border-black border-opacity-10 pt-4">
                    {timFirst ? (
                      <>
                        {show.tracklist?.tim !== undefined && <TracklistSection key="tim" label="Tim" tracks={show.tracklist.tim} />}
                        {show.tracklist?.martyn !== undefined && <TracklistSection key="martyn" label="Martyn" tracks={show.tracklist.martyn} />}
                      </>
                    ) : (
                      <>
                        {show.tracklist?.martyn !== undefined && <TracklistSection key="martyn" label="Martyn" tracks={show.tracklist.martyn} />}
                        {show.tracklist?.tim !== undefined && <TracklistSection key="tim" label="Tim" tracks={show.tracklist.tim} />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[13px] font-light text-[#999]">No tracklisting available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hasAutoOpened = useRef(false);
  const [recentShows, setRecentShows] = useState<MixcloudShow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/recent-shows")
      .then((r) => r.json())
      .then((data) => setRecentShows(data.shows || []))
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  }, []);

  const allShows: (Show & { mixcloudKey: string })[] = useMemo(() => {
    type ApiShowEnriched = MixcloudShow & { _broadcastDate: string };

    const apiByMonth: Record<string, ApiShowEnriched> = {};
    recentShows.forEach((r) => {
      if (!r.name.toLowerCase().startsWith("bamboo house")) return;
      const date = parseBroadcastDate(r.name) ?? r.created_time.split("T")[0];
      const month = date.slice(0, 7);
      const existing = apiByMonth[month];
      if (!existing || parseBroadcastDate(r.name)) {
        apiByMonth[month] = { ...r, _broadcastDate: date };
      }
    });

    const enrichedShows = shows.map((s) => {
      const apiShow = apiByMonth[s.date.slice(0, 7)];
      if (apiShow) return { ...s, mixcloudKey: apiShow.key, date: apiShow._broadcastDate };
      return s;
    });

    const hardcodedMonths = new Set(shows.map((s) => s.date.slice(0, 7)));
    const additionalShows: (Show & { mixcloudKey: string })[] = Object.entries(apiByMonth)
      .filter(([month]) => !hardcodedMonths.has(month))
      .map(([, r]) => ({
        id: `api-${r.slug ?? r.key.replace(/\//g, "-")}`,
        number: 0,
        date: r._broadcastDate,
        displayDate: r._broadcastDate,
        mixcloudKey: r.key,
        quote: undefined,
        tracklist: { tim: null, martyn: null } as ShowTracklist,
      }));

    const merged = [...enrichedShows, ...additionalShows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const photoByNumber: Record<number, string> = {
      29: "/photos/bh29.jpg", 30: "/photos/bh30.jpg", 31: "/photos/bh31.jpg",
      32: "/photos/bh32.jpg", 33: "/photos/bh33.jpg", 34: "/photos/bh34.jpg",
      35: "/photos/bh35.jpg", 36: "/photos/bh36.jpg", 37: "/photos/bh37.jpg",
      38: "/photos/bh38.jpg", 39: "/photos/bh39.jpg", 40: "/photos/bh40.jpg",
      41: "/photos/bh41.jpg", 42: "/photos/bh42.jpg", 43: "/photos/bh43.png",
      44: "/photos/bh44.jpg", 45: "/photos/bh45.jpg",
      46: "/photos/bh46.png", 47: "/photos/bh47.png", 48: "/photos/bh48.png",
      49: "/photos/bh49.png", 50: "/photos/bh50.png", 51: "/photos/bh51.png",
      52: "/photos/bh52.png",
      53: "/photos/bh53.png", 54: "/photos/bh54.png", 55: "/photos/bh55.png",
      56: "/photos/bh56.jpg", 57: "/photos/bh57.png", 58: "/photos/bh58.png",
      59: "/photos/bh59.png", 60: "/photos/bh60.png",
    };

    const quoteByNumber: Record<number, string> = {};

    const tracklistByNumber: Record<number, ShowTracklist> = {
      29: {
        tim: [
          { artist: "Ssaliva", title: "West End" },
          { artist: "Vinyl Williams", title: "Open Your Mind" },
          { artist: "Swell Maps", title: "Robot Factory" },
          { artist: "Cocteau Twins", title: "Donimo" },
          { artist: "Unknown", title: "Unknown" },
          { artist: "Biosphere", title: "Hyperborea" },
          { artist: "Bruce Haack", title: "Incantation (Jonti Remix)" },
          { artist: "Electroluminescent", title: "Two Means Yes" },
          { artist: "Ex-Easter Island Head", title: "Mallet Guitars Three (Second Movement)" },
          { artist: "Hauschka", title: "Barfuss Durch Gras" },
          { artist: "Ike Yard", title: "Nocturne" },
          { artist: "Sobrenadar", title: "Ambar" },
          { artist: "Laurel Halo", title: "Metal Confection" },
          { artist: "TRG", title: "Broken Heart (Martyn remix)" },
        ],
        martyn: [
          { artist: "Arthur Russell", title: "Picture Of Bunny Rabbit" },
          { artist: "Kali Malone", title: "Music from Low Quartet" },
          { artist: "Unknown", title: "Unknown" },
          { artist: "Zaumne, YL Hooi", title: "Sorcières (feat. YL Hooi)" },
          { artist: "The Residents", title: "Rest Aria" },
          { artist: "Unknown", title: "Unknown" },
          { artist: "Kinn", title: "When the Real Is No Longer There" },
          { artist: "Stars of the Lid", title: "Tippy's Demise" },
        ],
      },
    };

    const numbered = merged.map((s, i) => {
      const number = i + 1;
      const photo = s.photo ?? photoByNumber[number];
      const quote = s.quote ?? quoteByNumber[number];
      const tracklist = tracklistByNumber[number] ?? s.tracklist;
      return { ...s, number, ...(photo ? { photo } : {}), ...(quote ? { quote } : {}), ...(tracklist ? { tracklist } : {}) };
    });

    return numbered.reverse();
  }, [recentShows]);

  useEffect(() => {
    if (!loadingRecent && !hasAutoOpened.current && allShows.length > 0) {
      hasAutoOpened.current = true;
      setSelectedId(allShows[0].id);
    }
  }, [loadingRecent, allShows]);

  const years = useMemo(() => {
    const set = new Set(allShows.map((s) => getYear(s.date)));
    return Array.from(set).sort((a, b) => b - a);
  }, [allShows]);

  const filteredShows = useMemo(
    () => selectedYear ? allShows.filter((s) => getYear(s.date) === selectedYear) : allShows,
    [allShows, selectedYear]
  );

  // Counting animation for episode number — placed after allShows is defined
  const [displayCount, setDisplayCount] = useState(1);
  const countTarget = loadingRecent ? shows.length : allShows.length;
  useEffect(() => {
    if (displayCount >= countTarget) return;
    const step = Math.max(1, Math.floor((countTarget - displayCount) / 8));
    const delay = displayCount < 60 ? 18 : 40;
    const t = setTimeout(() => setDisplayCount((n) => Math.min(n + step, countTarget)), delay);
    return () => clearTimeout(t);
  }, [displayCount, countTarget]);

  const handleSelect = (id: string) => {
    hasAutoOpened.current = true;
    (document.activeElement as HTMLElement)?.blur();

    const cardEl = document.querySelector(`[data-show-id="${id}"]`) as HTMLElement | null;
    const targetTop = cardEl?.getBoundingClientRect().top ?? 0;
    const startTime = performance.now();
    const DURATION = 460; // matches grid transition duration

    setSelectedId((prev) => (prev === id ? null : id));

    // Pin the clicked card at its current viewport position for the full
    // duration of the close/open transition, correcting any scroll drift each frame
    const pinFrame = () => {
      if (!cardEl || performance.now() - startTime > DURATION) return;
      const drift = cardEl.getBoundingClientRect().top - targetTop;
      if (Math.abs(drift) > 0.5) window.scrollBy(0, drift);
      requestAnimationFrame(pinFrame);
    };
    requestAnimationFrame(pinFrame);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header — inner div matches content column widths */}
      <header className="bg-black" style={{ height: 52 }} suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between" suppressHydrationWarning>
          <div
            role="heading"
            aria-level={1}
            className="text-[14px] uppercase tracking-[0.15em] font-light text-white leading-none"
          >
            Bamboo House
          </div>
          <a
            href="https://www.mixcloud.com/MusicBoxRadioUK/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] uppercase tracking-widest text-white hover:text-[#E70000] transition-colors"
          >
            Mixcloud ↗
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 lg:flex lg:gap-16">
        {/* Sidebar */}
        <aside className="lg:w-72 lg:shrink-0 mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-8">
            {/* Logo + mobile links row */}
            <div className="flex items-start justify-between lg:block mb-5">
              <LogoMark size={44} />
              <div className="flex flex-col items-end gap-2 lg:hidden">
                <a href="https://www.mixcloud.com/MusicBoxRadioUK/" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors">
                  MusicBoxRadioUK ↗
                </a>
                <a href="https://martynriley.co.uk/" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors">
                  Martyn Riley ↗
                </a>
                <a href="https://timgreenstudio.cargo.site/" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors">
                  Tim Green ↗
                </a>
              </div>
            </div>

            {/* About text */}
            <p className="text-[13px] sm:text-[14px] font-light text-black leading-[1.6] mb-8">
              Bamboo House is two hours of slow-radio by two friends –{" "}
              <a href="https://martynriley.co.uk/" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[#E70000] transition-colors">
                Martyn Riley
              </a>
              {" & "}
              <a href="https://timgreenstudio.cargo.site/" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[#E70000] transition-colors">
                Tim Green
              </a>
              {" – on the second Sunday of the month. We each take an hour to delve into a personal selection of music, field recordings, sounds & spoken word."}
            </p>

            {/* Stats box */}
            <div className="border border-black mb-8">
              <div className="px-4 pt-3 pb-2">
                <div className="text-[11px] uppercase tracking-widest text-[#999] mb-1">Episodes</div>
                <div className="font-black leading-none" style={{ fontSize: 64, letterSpacing: "-0.05em" }}>
                  {displayCount}
                </div>
              </div>
              <div className="border-t border-dashed border-black border-opacity-20 px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-[#999] mb-1">Since</div>
                <div className="text-[13px] sm:text-[14px]">March 2021</div>
              </div>
              <div className="border-t border-dashed border-black border-opacity-20 px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-[#999] mb-1">Broadcast</div>
                <div className="text-[13px] sm:text-[14px]">Monthly • Every second Sunday</div>
              </div>
            </div>

            {/* Links */}
            <div className="hidden lg:flex flex-col gap-2">
              <a href="https://www.mixcloud.com/MusicBoxRadioUK/" target="_blank" rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors">
                MusicBoxRadioUK ↗
              </a>
              <a href="https://martynriley.co.uk/" target="_blank" rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors">
                Martyn Riley ↗
              </a>
              <a href="https://timgreenstudio.cargo.site/" target="_blank" rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-widest text-black hover:text-[#E70000] transition-colors">
                Tim Green ↗
              </a>
            </div>
          </div>
        </aside>

        {/* Main: year filters + show list */}
        <main className="flex-1 min-w-0">
          {/* Year filters */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1 mb-4 flex-nowrap overflow-x-auto">
            <button
              onClick={() => setSelectedYear(null)}
              className={`text-[11px] sm:text-[13px] uppercase tracking-widest px-1.5 sm:px-3 py-0.5 sm:py-1 shrink-0 transition-colors ${
                selectedYear === null ? "bg-black text-white" : "text-[#999] hover:text-[#E70000]"
              }`}
            >
              All
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y === selectedYear ? null : y)}
                className={`text-[11px] sm:text-[13px] uppercase tracking-widest px-1.5 sm:px-3 py-0.5 sm:py-1 tabular-nums shrink-0 transition-colors ${
                  selectedYear === y ? "bg-black text-white" : "text-[#999] hover:text-[#E70000]"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {loadingRecent && (
            <p className="text-[11px] uppercase tracking-widest text-[#999] mb-3">
              Checking for new episodes…
            </p>
          )}

          {/* Show list — 8px gap between cards, each is its own bordered box */}
          <div className="space-y-2">
            {filteredShows.map((show) => (
              <div
                key={show.id}
                data-show-id={show.id}
                ref={selectedId === show.id ? selectedRef : undefined}
                className="border border-black"
              >
                <ShowCard
                  show={show}
                  isSelected={selectedId === show.id}
                  onClick={() => handleSelect(show.id)}
                />
                {/* Animated panel — always in DOM, height controlled by grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: selectedId === show.id ? "1fr" : "0fr",
                    transition: "grid-template-rows 450ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div className="border-t border-black">
                      <ShowPlayer
                        show={show}
                        isSelected={selectedId === show.id}
                        autoOpenTracklist={show.id === allShows[0]?.id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Footer — aligned with content columns */}
      <footer className="border-t border-black mt-16">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-[12px] uppercase tracking-widest text-black">
            Bamboo House ·{" "}
            <a href="https://musicboxradio.com" target="_blank" rel="noopener noreferrer"
              className="text-[#999] hover:text-[#E70000] transition-colors">
              Music Box Radio
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
