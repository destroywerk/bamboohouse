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
  const day = d.getUTCDate();
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getYear(isoDate: string): number {
  return new Date(isoDate).getUTCFullYear();
}

// Parse the broadcast date from a Mixcloud show name like
// "Bamboo House - Sunday 8th March 2026" → "2026-03-08"
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
function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle
        cx="20" cy="20" r="18"
        stroke="var(--green)" strokeWidth="1.5" fill="none"
        style={{ animation: "pulse-ring-outer 3.5s ease-in-out infinite" }}
      />
      <circle
        cx="20" cy="20" r="12"
        stroke="var(--green)" strokeWidth="1.5" fill="none"
        style={{ animation: "pulse-ring-inner 3.5s ease-in-out infinite 0.4s" }}
      />
      <circle cx="20" cy="20" r="5.5" fill="var(--green)" />
    </svg>
  );
}

// ─── Show card ───────────────────────────────────────────────────────────────
function ShowCard({
  show,
  isSelected,
  onClick,
}: {
  show: Show & { mixcloudKey: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasTracklist =
    show.tracklist &&
    ((show.tracklist.tim && show.tracklist.tim.length > 0) ||
      (show.tracklist.martyn && show.tracklist.martyn.length > 0));

  return (
    <button
      onClick={onClick}
      className={`
        group w-full text-left transition-all duration-150
        border px-5 py-4
        ${isSelected
          ? "border-[var(--green)] bg-[var(--green-light)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--green)] hover:bg-[var(--green-light)]"
        }
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <span
            className={`text-xs tracking-widest uppercase shrink-0 tabular-nums ${
              isSelected ? "text-[var(--green)] font-bold" : "font-medium text-[var(--text-dim)] group-hover:text-[var(--green)]"
            }`}
          >
            BH{String(show.number).padStart(2, "0")}
          </span>
          <span className={`text-xs tabular-nums ${isSelected ? "text-[var(--green)] font-bold" : "text-[var(--text-muted)]"}`}>{formatDisplayDate(show.date)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasTracklist && (
            <span className="text-[9px] tracking-widest uppercase text-[var(--green)] opacity-60">
              tracklist
            </span>
          )}
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform duration-200 text-[var(--text-dim)] ${isSelected ? "rotate-90" : ""}`}
          >
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {show.quote && !isSelected && (
        <p className="mt-1.5 text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-1 italic">
          &ldquo;{show.quote}&rdquo;
        </p>
      )}
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
      <div className="text-[9px] tracking-widest uppercase text-[var(--green)] mb-2 font-medium">
        {label}
      </div>
      {tracks === null ? (
        <p className="text-[11px] text-[var(--text-dim)] italic">Tracklisting not available</p>
      ) : (
        <ol className="space-y-0.5">
          {tracks.map((track, i) => (
            <li key={i} className="flex gap-3 text-[11px] leading-relaxed">
              <span className="text-[var(--text-dim)] shrink-0 w-5 text-right tabular-nums">{i + 1}</span>
              <span className="text-[var(--text-muted)]">
                <span className="text-[var(--text)]">{track.artist}</span>
                {" — "}
                <span>{track.title}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Show player ──────────────────────────────────────────────────────────────
function ShowPlayer({ show }: { show: Show & { mixcloudKey: string } }) {
  const [tracklistOpen, setTracklistOpen] = useState(false);
  const embedUrl = getMixcloudEmbedUrl(show.mixcloudKey);
  const hasAnyTracklist =
    show.tracklist !== undefined &&
    (
      (Array.isArray(show.tracklist.tim) && show.tracklist.tim.length > 0) ||
      (Array.isArray(show.tracklist.martyn) && show.tracklist.martyn.length > 0)
    );

  return (
    <div className="border border-t-0 border-[var(--green)] bg-[#FCFCFC] px-5 pt-4 pb-5">
      {show.quote && (
        <p className="text-[11px] text-[var(--text-muted)] italic leading-relaxed mb-3 border-l-2 border-[var(--green)] pl-3">
          &ldquo;{show.quote}&rdquo;
        </p>
      )}

      <div className="mb-4">
        {show.id === "bh26" ? (
          <div
            className="w-full flex items-center justify-center text-center px-4"
            style={{ height: 120, background: "#FCFCFC", border: "1px solid #e0e0e0", color: "var(--text-muted)", fontSize: 11, lineHeight: 1.6 }}
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
            allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share"
            className="block"
            title={`Bamboo House BH${String(show.number).padStart(2, "0")} — ${formatDisplayDate(show.date)}`}
          />
        )}
      </div>

      {/* Photo + tracklist row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {show.photo && (
          <div className="shrink-0 w-full sm:w-[300px] sm:h-[300px] overflow-hidden order-first sm:order-last">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={show.photo}
              alt=""
              className="w-full aspect-square object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 order-last sm:order-first">
          {hasAnyTracklist ? (
            <div>
              <button
                onClick={() => setTracklistOpen((o) => !o)}
                className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity mb-3"
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`transition-transform duration-200 ${tracklistOpen ? "rotate-90" : ""}`}
                >
                  <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {tracklistOpen ? "Hide" : "Show"} tracklisting
              </button>

              {tracklistOpen && (
                <div className="border-t border-[var(--green)] border-opacity-20 pt-4">
                  {(show.timFirst !== undefined
                    ? show.timFirst
                    : show.number >= 32 && show.number <= 58
                      ? show.number % 2 === 0
                      : show.number % 2 !== 0) ? (
                    <>
                      {show.tracklist?.tim !== undefined && (
                        <TracklistSection label="Tim" tracks={show.tracklist.tim} />
                      )}
                      {show.tracklist?.martyn !== undefined && (
                        <TracklistSection label="Martyn" tracks={show.tracklist.martyn} />
                      )}
                    </>
                  ) : (
                    <>
                      {show.tracklist?.martyn !== undefined && (
                        <TracklistSection label="Martyn" tracks={show.tracklist.martyn} />
                      )}
                      {show.tracklist?.tim !== undefined && (
                        <TracklistSection label="Tim" tracks={show.tracklist.tim} />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] tracking-widest uppercase text-[var(--text-dim)]">
              No tracklisting available
            </p>
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

  // Merge API shows with hardcoded shows.
  // API data is the source of truth for slugs and broadcast dates:
  //   - build month → API show map
  //   - enrich hardcoded shows with confirmed API key + title-parsed date
  //   - append any API episodes that have no hardcoded match
  const allShows: (Show & { mixcloudKey: string })[] = useMemo(() => {
    type ApiShowEnriched = MixcloudShow & { _broadcastDate: string };

    // Build month → best API show map (prefer title-parsed date over upload date)
    const apiByMonth: Record<string, ApiShowEnriched> = {};
    recentShows.forEach((r) => {
      if (!r.name.toLowerCase().startsWith("bamboo house")) return;
      const date = parseBroadcastDate(r.name) ?? r.created_time.split("T")[0];
      const month = date.slice(0, 7);
      const existing = apiByMonth[month];
      // Prefer the entry whose date came from the title (not just upload time)
      if (!existing || parseBroadcastDate(r.name)) {
        apiByMonth[month] = { ...r, _broadcastDate: date };
      }
    });

    // Enrich hardcoded shows: replace slug + date with API-confirmed values when available
    const enrichedShows = shows.map((s) => {
      const apiShow = apiByMonth[s.date.slice(0, 7)];
      if (apiShow) {
        return { ...s, mixcloudKey: apiShow.key, date: apiShow._broadcastDate };
      }
      return s;
    });

    // API episodes not covered by any hardcoded show
    const hardcodedMonths = new Set(shows.map((s) => s.date.slice(0, 7)));
    const additionalShows: (Show & { mixcloudKey: string })[] = Object.entries(apiByMonth)
      .filter(([month]) => !hardcodedMonths.has(month))
      .map(([, r]) => ({
        id: `api-${r.slug}`,
        number: 0,
        date: r._broadcastDate,
        displayDate: r._broadcastDate,
        mixcloudKey: r.key,
        quote: undefined,
        tracklist: { tim: null, martyn: null } as ShowTracklist,
      }));

    // Sort chronologically (oldest first) to assign sequential numbers
    const merged = [...enrichedShows, ...additionalShows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const numbered = merged.map((s, i) => ({ ...s, number: i + 1 }));

    // Return newest first
    return numbered.reverse();
  }, [recentShows]);

  // Auto-open the latest show once the API has loaded (runs once only)
  useEffect(() => {
    if (!loadingRecent && !hasAutoOpened.current && allShows.length > 0) {
      hasAutoOpened.current = true;
      setSelectedId(allShows[0].id);
    }
  }, [loadingRecent, allShows]);

  // Extract unique years for filter
  const years = useMemo(() => {
    const set = new Set(allShows.map((s) => getYear(s.date)));
    return Array.from(set).sort((a, b) => b - a); // newest first
  }, [allShows]);

  const filteredShows = useMemo(
    () =>
      selectedYear
        ? allShows.filter((s) => getYear(s.date) === selectedYear)
        : allShows,
    [allShows, selectedYear]
  );

  const handleSelect = (id: string) => {
    hasAutoOpened.current = true; // prevent auto-switch overriding manual selection
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-body)" }}>
      {/* Header */}
      <header className="border-b border-[var(--border)] pl-12 pr-6 py-5 flex items-center justify-between" style={{ background: "var(--bg)" }}>
        <div
          role="heading"
          aria-level={1}
          className="text-[15px] tracking-[0.45em] uppercase font-light leading-none"
          style={{ color: "var(--text)" }}
        >
          Bamboo House
        </div>
        <a
          href="https://www.mixcloud.com/MusicBoxRadioUK/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] tracking-widest uppercase border border-[var(--green)] px-3 py-1.5 text-[var(--green)] hover:bg-[var(--green-light)] transition-colors"
        >
          Mixcloud
        </a>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 lg:flex lg:gap-12">
        {/* Sidebar */}
        <aside className="lg:w-64 lg:shrink-0 mb-10 lg:mb-0">
          <div className="lg:sticky lg:top-8">
            <div className="mb-6">
              {/* On mobile: logo + links share a row. On lg: logo sits alone above the text */}
              <div className="flex items-start justify-between lg:block mb-5">
                <LogoMark size={44} />
                {/* Links — right-aligned on mobile, moved below stats on lg */}
                <div className="flex flex-col items-end gap-1.5 lg:hidden">
                  <a
                    href="https://www.mixcloud.com/MusicBoxRadioUK/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity"
                  >
                    MusicBoxRadioUK ↗
                  </a>
                  <a
                    href="https://martynriley.co.uk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity"
                  >
                    Martyn Riley ↗
                  </a>
                  <a
                    href="https://timgreenstudio.cargo.site/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity"
                  >
                    Tim Green ↗
                  </a>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Bamboo House is two hours of slow-radio by two friends –{" "}
                <a
                  href="https://martynriley.co.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[var(--green)] underline-offset-2 text-[var(--green)] hover:opacity-70 transition-opacity"
                >
                  Martyn Riley
                </a>
                {" & "}
                <a
                  href="https://timgreenstudio.cargo.site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[var(--green)] underline-offset-2 text-[var(--green)] hover:opacity-70 transition-opacity"
                >
                  Tim Green
                </a>
                {" – every 2nd Sunday. We delve into a personal selection of music, field recordings, sounds & spoken word."}
              </p>
            </div>

            <div className="border border-[var(--border)]">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: "var(--text-dim)" }}>
                  Episodes
                </div>
                <div className="text-lg font-medium tabular-nums" style={{ color: "var(--text)" }}>
                  {loadingRecent ? shows.length : allShows.length}
                </div>
              </div>
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: "var(--text-dim)" }}>
                  Since
                </div>
                <div className="text-[11px] leading-snug" style={{ color: "var(--text)" }}>
                  March 2021
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: "var(--text-dim)" }}>
                  Broadcast
                </div>
                <div className="text-[11px] leading-snug" style={{ color: "var(--text)" }}>
                  Monthly · Second Sunday of the month
                </div>
              </div>
            </div>

            <div className="hidden lg:block mt-6 space-y-2">
              <a
                href="https://www.mixcloud.com/MusicBoxRadioUK/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity"
              >
                MusicBoxRadioUK ↗
              </a>
              <a
                href="https://martynriley.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity"
              >
                Martyn Riley ↗
              </a>
              <a
                href="https://timgreenstudio.cargo.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] tracking-widest uppercase text-[var(--green)] hover:opacity-70 transition-opacity"
              >
                Tim Green ↗
              </a>
            </div>
          </div>
        </aside>

        {/* Show list */}
        <main className="flex-1 min-w-0">
          {/* Toolbar: label + year filter */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-[9px] tracking-widest uppercase shrink-0" style={{ color: "var(--text-dim)" }}>
              All Episodes
            </h2>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <button
                onClick={() => setSelectedYear(null)}
                className={`text-[9px] tracking-widest uppercase px-2 py-1 transition-colors ${
                  selectedYear === null
                    ? "text-[var(--green)] border border-[var(--green)]"
                    : "text-[var(--text-dim)] border border-transparent hover:text-[var(--text-muted)]"
                }`}
              >
                All
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y === selectedYear ? null : y)}
                  className={`text-[9px] tracking-widest uppercase px-2 py-1 tabular-nums transition-colors ${
                    selectedYear === y
                      ? "text-[var(--green)] border border-[var(--green)]"
                      : "text-[var(--text-dim)] border border-transparent hover:text-[var(--text-muted)]"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {loadingRecent && (
            <div className="text-[9px] tracking-widest uppercase mb-3" style={{ color: "var(--text-dim)" }}>
              Checking for new episodes…
            </div>
          )}

          <div className="space-y-px">
            {filteredShows.map((show) => (
              <div key={show.id} ref={selectedId === show.id ? selectedRef : undefined}>
                <ShowCard
                  show={show}
                  isSelected={selectedId === show.id}
                  onClick={() => handleSelect(show.id)}
                />
                {selectedId === show.id && <ShowPlayer show={show} />}
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className="border-t border-[var(--border)] px-6 py-4 mt-16">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Bamboo House ·{" "}
          <a
            href="https://musicboxradio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--green)] hover:opacity-70 transition-opacity"
          >
            Music Box Radio
          </a>
        </p>
      </footer>
    </div>
  );
}
