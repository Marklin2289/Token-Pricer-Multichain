import { ChainId } from "../../constants";
import { AggregatorModel } from "../../types";

//import feeds JSONs
import mainnet from "./mainnet.json";
import optimism from "./optimism.json";
import arbitrum from "./arbitrum.json";
import polygon from "./polygon.json";
import bsc from "./bsc.json";
import avalanche from "./avalanche.json";

// define mapping FEED_LIST
const FEED_LIST: { [chainId in ChainId]: AggregatorModel[] } = {
  // setup feeds JSONs for each chain and storage in mapping FEED_LIST
  [ChainId.MAINNET]: JSON.parse(JSON.stringify(mainnet, null, 4)),
  [ChainId.OPTIMISM]: JSON.parse(JSON.stringify(optimism, null, 4)),
  [ChainId.ARBITRUM]: JSON.parse(JSON.stringify(arbitrum, null, 4)),
  [ChainId.POLYGON]: JSON.parse(JSON.stringify(polygon, null, 4)),
  [ChainId.BSC]: JSON.parse(JSON.stringify(bsc, null, 4)),
  [ChainId.AVALANCHE]: JSON.parse(JSON.stringify(avalanche, null, 4)),
};

// console.log(getFeeds(1, [[`ETH`, `USD`]]));
export const getFeeds = (chainId: ChainId, keys: [string, string][] = []) => {
  // get single feedlist mapping from chainId
  const feedList = FEED_LIST[chainId];

  // if keys = empty, [N/A], return feedList, no filtering
  if (keys.length === 0) {
    return feedList;
  }
  // if keys = [[base, quote]], e.g([[`ETH`, `USD`]])
  // keys.reduce((acc, [ETH, USD]) => {}))
  return keys
    .reduce<AggregatorModel[]>((acc, [base, quote]) => {
      // key = `ETH / USD`
      const key = `${base.toUpperCase()} / ${quote.toUpperCase()}`;
      // define singleFeed from feedList.find()
      const singleFeed = feedList.find(
        // if feed.name.toUpperCase().includes("ETH / USD""), return true
        (feed) => !!feed.name.toUpperCase().includes(key)
      );
      // if singleFeed = true, push singleFeed to acc
      if (!!singleFeed) {
        acc.push(singleFeed);
      }
      return acc;
    }, [])
    .sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1));
  // sort acc by name alphabetically
};

// define getFeed function
// console.log(getFeed(1, `ETH`, `USD`));
export const getFeed = (chainId: ChainId, base: string, quote: string) => {
  const [feed] = getFeeds(chainId, [[base, quote]]);

  if (!feed) {
    throw new Error(`Feed not found for ${base} / ${quote}`);
  }

  return feed;
};

// scripts/test.ts
/**
 * console.log(getFeeds(1, [[`ETH`, `USD`]]));
 * getFeeds() called return : [objects]
[
  {
    name: 'ETH / USD',
    category: 'verified',
    path: 'eth-usd',
    base: 'ETH',
    quote: 'USD',
    decimals: 8,
    contractAddress: '0xE62B71cf983019BFf55bC83B48601ce8419650CC',
    proxyAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
  }
]

console.log(getFeed(1, `ETH`, `USD`)); => Object
getFeed() called return :  {
  name: 'ETH / USD',
  category: 'verified',
  path: 'eth-usd',
  base: 'ETH',
  quote: 'USD',
  decimals: 8,
  contractAddress: '0xE62B71cf983019BFf55bC83B48601ce8419650CC',
  proxyAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
}
 */
