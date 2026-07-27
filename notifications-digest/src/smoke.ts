import { blogStats, listBlogPosts, loadBlogPosts } from "./blog-store.js";
import { scrapeAllSources, scrapeCbicEccsNotifications, scrapeDgftCategory } from "./scrape.js";
import { listActiveSubscribers, subscribe, unsubscribe } from "./subscribers.js";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  loadBlogPosts();
  console.log(`Blog store: ${JSON.stringify(blogStats())}`);

  console.log("Channel: CBIC ECCS…");
  const cbic = await scrapeCbicEccsNotifications(5);
  assert(cbic.length >= 3, "CBIC ECCS scrape weak");
  assert(!/download/i.test(cbic[0]!.title), "CBIC junk title");
  console.log(`PASS  cbic-eccs · ${cbic.length} · ${cbic[0]!.noticeNo}`);

  console.log("Channel: DGFT notifications…");
  const dgft = await scrapeDgftCategory(1, "dgft-notifications", 5);
  assert(dgft.length >= 3, "DGFT notifications scrape weak");
  assert(!/download/i.test(dgft[0]!.title), "DGFT junk title");
  console.log(`PASS  dgft-notifications · ${dgft.length} · ${dgft[0]!.noticeNo}`);

  console.log("Bundle scrape + reliability…");
  const bundle = await scrapeAllSources(8);
  assert(bundle.okChannels >= 2, `need ≥2 healthy channels, got ${bundle.okChannels}`);
  assert(bundle.notices.length >= 8, "combined notice corpus too small");
  console.log(
    `PASS  bundle · ${bundle.notices.length} notices · ${bundle.okChannels}/${bundle.totalChannels} channels`
  );
  for (const h of bundle.health) {
    console.log(`  - ${h.channel}: ${h.ok ? `OK ${h.count}` : `FAIL ${h.error}`} (${h.latencyMs}ms)`);
  }

  const published = listBlogPosts({ status: "published", limit: 5 });
  console.log(`PASS  public list · ${published.length} published (drafts hidden)`);

  const email = `smoke-${Date.now()}@example.invalid`;
  subscribe({ email, name: "Smoke", topics: ["all"] });
  assert(listActiveSubscribers().some((s) => s.email === email), "subscribe failed");
  assert(unsubscribe(email), "unsubscribe failed");
  console.log("PASS  subscribe/unsubscribe");

  console.log("PASS  enterprise smoke checks");
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
