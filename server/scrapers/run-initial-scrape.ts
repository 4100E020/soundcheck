import { scrapeAllMusicEvents } from "./kktix-scraper";
import { scrapeIndievoxEvents } from "./indievox-scraper";
import { scrapeAccupassEvents } from "./accupass-scraper";
import { saveStandardizedEvents } from "./event-storage";

async function main() {
  console.log("=== Starting multi-source scrape ===\n");
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  // 1. KKTIX
  try {
    console.log("--- KKTIX Scrape ---");
    const kktixEvents = await scrapeAllMusicEvents();
    console.log(`KKTIX: Scraped ${kktixEvents.length} events`);
    if (kktixEvents.length > 0) {
      const result = await saveStandardizedEvents(kktixEvents as any);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalFailed += result.failed;
      console.log(`KKTIX: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed\n`);
    }
  } catch (error) {
    console.error("KKTIX scrape failed:", error);
  }

  // 2. iNDIEVOX
  try {
    console.log("--- iNDIEVOX Scrape ---");
    const indievoxEvents = await scrapeIndievoxEvents();
    console.log(`iNDIEVOX: Scraped ${indievoxEvents.length} events`);
    if (indievoxEvents.length > 0) {
      const result = await saveStandardizedEvents(indievoxEvents);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalFailed += result.failed;
      console.log(`iNDIEVOX: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed\n`);
    }
  } catch (error) {
    console.error("iNDIEVOX scrape failed:", error);
  }

  // 3. Accupass
  try {
    console.log("--- Accupass Scrape ---");
    const accupassEvents = await scrapeAccupassEvents();
    console.log(`Accupass: Scraped ${accupassEvents.length} events`);
    if (accupassEvents.length > 0) {
      const result = await saveStandardizedEvents(accupassEvents);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalFailed += result.failed;
      console.log(`Accupass: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed\n`);
    }
  } catch (error) {
    console.error("Accupass scrape failed:", error);
  }

  console.log("=== Scrape Complete ===");
  console.log(`Total: ${totalInserted} inserted, ${totalUpdated} updated, ${totalFailed} failed`);
}

main();
