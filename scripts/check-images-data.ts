import { getDb } from '../server/db.js';
import { standardizedEvents } from '../drizzle/schema.js';
import { isNotNull } from 'drizzle-orm';

async function checkImages() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }
  
  const events = await db.select({
    title: standardizedEvents.title,
    images: standardizedEvents.images,
    source: standardizedEvents.source
  }).from(standardizedEvents).limit(10);
  
  console.log('Sample events with images:');
  events.forEach((e: any) => {
    console.log(`\n[${e.source}] ${e.title}`);
    console.log(`Images: ${e.images || 'NO IMAGES'}`);
  });
  
  const withImages = await db.select()
    .from(standardizedEvents)
    .where(isNotNull(standardizedEvents.images));
  
  const total = await db.select().from(standardizedEvents);
  
  console.log(`\n\nTotal events: ${total.length}`);
  console.log(`Events with images: ${withImages.length}`);
  console.log(`Events without images: ${total.length - withImages.length}`);
}

checkImages().catch(console.error);
