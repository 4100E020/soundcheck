import { getDb } from "../server/db";
import { standardizedEvents } from "../drizzle/schema";

async function main() {
  const db = await getDb();
  if (db === null) {
    console.log("No DB");
    return;
  }
  const rows = await db
    .select({
      title: standardizedEvents.title,
      images: standardizedEvents.images,
      source: standardizedEvents.source,
    })
    .from(standardizedEvents)
    .limit(5);
  rows.forEach((r) =>
    console.log(
      JSON.stringify({
        title: r.title?.substring(0, 40),
        images: r.images,
        source: r.source,
      })
    )
  );
  process.exit(0);
}
main();
