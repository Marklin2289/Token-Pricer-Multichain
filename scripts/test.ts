// import { getFeed, getFeeds } from "../src/schema/feeds";

import { getTokens } from "../src/schema/tokens";

// console.log("getFeeds() called return :");
// console.log(getFeeds(1, [[`ETH`, `USD`]]));

// console.log("getFeed() called return : ", getFeed(1, `ETH`, `USD`));

console.log(
  getTokens(1, [`0x111111111117dC0aa78b770fA6A738034120C302`, `BTC`])
);
