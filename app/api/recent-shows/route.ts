import { NextResponse } from "next/server";

type MixcloudCloudcast = {
  key: string;
  name: string;
  created_time: string;
  slug: string;
  user: { username: string };
};

type MixcloudResponse = {
  data: MixcloudCloudcast[];
  paging?: { next?: string };
};

export async function GET() {
  try {
    const results: MixcloudCloudcast[] = [];
    let url: string | undefined =
      "https://api.mixcloud.com/search/?q=Bamboo+House&type=cloudcast&limit=100";

    // Fetch up to 10 pages — Bamboo House shows are spread thinly across
    // search results (~6 per 100 entries), so we need enough pages to
    // collect all ~60 episodes
    for (let page = 0; page < 10 && url; page++) {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data: MixcloudResponse = await res.json();

      const bambooHouseShows = data.data.filter(
        (c) =>
          c.user?.username === "MusicBoxRadioUK" &&
          c.name.toLowerCase().startsWith("bamboo house")
      );
      results.push(...bambooHouseShows);
      url = data.paging?.next;

      // Early exit if no more results
      if (!data.data.length) break;
    }

    // Deduplicate by slug (keep first occurrence)
    const seen = new Set<string>();
    const unique = results.filter((r) => {
      if (seen.has(r.slug)) return false;
      seen.add(r.slug);
      return true;
    });

    // Sort newest first by parsed broadcast date
    unique.sort(
      (a, b) =>
        new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );

    return NextResponse.json({ shows: unique });
  } catch {
    return NextResponse.json({ shows: [] });
  }
}
