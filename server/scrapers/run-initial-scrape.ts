import { scrapeAllMusicEvents } from "./kktix-scraper";
import { saveStandardizedEvents } from "./event-storage";

async function main() {
  console.log("Starting initial KKTIX scrape...");
  
  try {
    // Scrape events from all music organizations
    const events = await scrapeAllMusicEvents();
    console.log(`Scraped ${events.length} events`);
    
    // Save to database
    const result = await saveStandardizedEvents(events as any);
    console.log(`Results: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed`);
    
    console.log("Initial scrape completed successfully!");
  } catch (error) {
    console.error("Initial scrape failed:", error);
    process.exit(1);
  }
}

main();
