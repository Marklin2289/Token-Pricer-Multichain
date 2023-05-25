import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { AggregatorModel, getNetworks } from "../src";

interface Docs {
  nftFloorUnits: any;
  assetName?: string;
  feedCatagory?: string;
  feedType?: string;
  hidden?: boolean;
  porAuditor?: string;
  porType?: string;
  shutdownDate?: string;
}

// example: https://reference-data-directory.vercel.app/feeds-mainnet.json
interface ChainMetadata {
  compareOffchain: string;
  contractAddress: string;
  contractType: string;
  contractVersion: number;
  decimalPlaces: number | null;
  ens: string | null;
  formatDecimalPlaces: number | null;
  healthPrice: string;
  heartbeat: number;
  history: boolean;
  multiply: string;
  name: string;
  pair: string[];
  path: string;
  proxyAddress: string | null;
  threshold: number;
  valuePrefix: string;
  assetName: string;
  feedCategory: string;
  feedType: string;
  docs: Docs;
  transmissionsAccount: string | null;
  decimals: number;
}

const main = async () => {
  const quoteFilters = ["bandwidth", "gas", "hc", "index", "pps"];

  // this is not single getNetwork() because we need to get all networks, from constants/networks.ts
  const networks = getNetworks();

  for (const network of networks) {
    // loop through all networks
    // api call
    const response = await axios.get<ChainMetadata[]>(network.rddUrl); // get data from rddUrl

    const aggregators = response.data // reduce the data to AggregatorModel[]
      .reduce<AggregatorModel[]>(
        (
          acc,
          {
            // destructuring the data
            contractAddress,
            decimals,
            docs,
            feedCategory,
            name,
            path,
            proxyAddress,
          }
        ) => {
          //replace all the unnecessary strings to empty string
          path = path
            .replace("calc-", "")
            .replace("calculated-", "")
            .replace(" exchangerate", "")
            .replace("-exchange-rate", "");

          const [base, quote] = path.split("-"); // split the path to base - quote

          if (
            // filtering out the feeds that are not needed
            docs.hidden !== true && // no hidden feeds
            docs.feedType === "Crypto" && // only crypto feeds
            !docs.nftFloorUnits && // no nft feeds
            !docs.porType && // no por feeds
            !docs.shutdownDate && // no shutdown feeds
            !quoteFilters.includes(quote) && // no quote filters feeds
            !!feedCategory && // no empty feed category
            path.split("-").length === 2 // only base/quote feeds
          ) {
            // create feed object => AggregatorModel
            const feed: AggregatorModel = {
              name,
              category: feedCategory,
              path,
              base: base.toUpperCase(),
              quote: quote.toUpperCase(),
              decimals,
              contractAddress,
              proxyAddress,
            };

            acc.push(feed);
          }
          return acc;
        },
        []
      )
      .sort((a, b) => (a.path < b.path ? -1 : 1)); // sort by path

    // setup file path for generated json files
    const filePath = path.join(
      __dirname,
      "../src/schema/feeds",
      `${network.name}.json`
    );

    // write json file
    fs.writeFileSync(filePath, JSON.stringify(aggregators, null, 4));
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
