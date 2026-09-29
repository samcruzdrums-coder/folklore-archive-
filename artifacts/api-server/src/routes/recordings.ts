import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, recordingsTable, type Recording } from "@workspace/db";
import {
  GetArchiveSummaryResponse,
  GetRecordingParams,
  GetRecordingResponse,
  ListInstrumentsResponse,
  ListRecordingsQueryParams,
  ListRecordingsResponse,
  ListRegionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const includes = (value: string, query?: string) =>
  !query || value.toLowerCase().includes(query.toLowerCase());

const loadRecordings = async (): Promise<Recording[]> =>
  db.select().from(recordingsTable);

router.get("/recordings", async (req, res): Promise<void> => {
  const parsed = ListRecordingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, region, instrument, form, featured, limit } = parsed.data;
  const recordings = await loadRecordings();
  const filtered = recordings
    .filter((recording) => {
      const matchesSearch =
        !q ||
        [
          recording.title,
          recording.tradition,
          recording.region,
          recording.country,
          recording.community,
          recording.instrument,
          recording.form,
          recording.description,
          ...recording.tags,
        ].some((field) => includes(field, q));
      return (
        matchesSearch &&
        includes(recording.region, region) &&
        includes(recording.instrument, instrument) &&
        includes(recording.form, form) &&
        (featured === undefined || recording.featured === featured)
      );
    })
    .slice(0, limit ?? 24);

  res.json(ListRecordingsResponse.parse(filtered));
});

router.get("/recordings/:id", async (req, res): Promise<void> => {
  const params = GetRecordingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [recording] = await db
    .select()
    .from(recordingsTable)
    .where(eq(recordingsTable.id, params.data.id));

  if (!recording) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  res.json(GetRecordingResponse.parse(recording));
});

router.get("/regions", async (_req, res): Promise<void> => {
  const recordings = await loadRecordings();
  const byRegion = new Map<string, { count: number; countries: Set<string> }>();

  for (const recording of recordings) {
    const current = byRegion.get(recording.region) ?? {
      count: 0,
      countries: new Set<string>(),
    };
    current.count += 1;
    current.countries.add(recording.country);
    byRegion.set(recording.region, current);
  }

  const regions = [...byRegion.entries()]
    .map(([region, summary]) => ({
      region,
      count: summary.count,
      countries: summary.countries.size,
    }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region));

  res.json(ListRegionsResponse.parse(regions));
});

router.get("/instruments", async (_req, res): Promise<void> => {
  const recordings = await loadRecordings();
  const counts = new Map<string, number>();

  for (const recording of recordings) {
    counts.set(recording.instrument, (counts.get(recording.instrument) ?? 0) + 1);
  }

  const instruments = [...counts.entries()]
    .map(([instrument, count]) => ({ instrument, count }))
    .sort((a, b) => b.count - a.count || a.instrument.localeCompare(b.instrument));

  res.json(ListInstrumentsResponse.parse(instruments));
});

router.get("/archive/summary", async (_req, res): Promise<void> => {
  const recordings = await loadRecordings();
  const regions = new Set(recordings.map((recording) => recording.region));
  const instruments = new Set(recordings.map((recording) => recording.instrument));
  const traditions = new Set(recordings.map((recording) => recording.tradition));
  const featured = recordings.find((recording) => recording.featured) ?? recordings[0];

  if (!featured) {
    res.status(404).json({ error: "Archive is empty" });
    return;
  }

  res.json(
    GetArchiveSummaryResponse.parse({
      recordingCount: recordings.length,
      regionCount: regions.size,
      instrumentCount: instruments.size,
      traditionCount: traditions.size,
      featured,
    }),
  );
});

export default router;