// This section lists the blockchains that Chainlink Feed Registry are currently available on.

import invariant from "tiny-invariant";
import {
  IAggregator,
  IAggregator__factory,
  IFeedRegistry,
  IFeedRegistry__factory,
} from "../../typechain-types";
import { BTC_QUOTE, ChainId, NATIVE_ADDRESS, USD_QUOTE } from "../constants";
import { getFeeds } from "../schema/feeds";
import { AggregatorModel, Mapping, Provider } from "../types";
import { BaseService } from "./common";
import { TokenService } from "./tokens";
import {
  div,
  formatUnits,
  getAddress,
  isAddress,
  mul,
  parseUnits,
  square,
  toBN,
} from "../utils";

// https://docs.chain.link/data-feeds/feed-registry/#contract-addresses
const FEED_REGISTRY = "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"; //ethereum mainnet

interface AggregatorParams {
  feed: AggregatorModel;
  invert: boolean;
}

export class ChainLinkPricerService extends BaseService<IAggregator> {
  public readonly tokenService: TokenService;
  public readonly feedRegistry: IFeedRegistry | undefined;
  public readonly feeds: Mapping<AggregatorModel> = {};
  public readonly feedKeys: Map<string, string[]> = new Map();
  public readonly tokens: Set<string> = new Set();
  public readonly quotes: string[] = [];
  public readonly cryptoPairQuoteTicker: string;
  public readonly usdPairQuoteTicker: string;

  // constructor
  constructor(chainId: ChainId, provider?: Provider) {
    super(chainId, IAggregator__factory, provider);

    // define tokenService
    this.tokenService = new TokenService(chainId, provider);

    // define feedRegistry if chainId is MAINNET
    if (chainId === ChainId.MAINNET) {
      this.feedRegistry = IFeedRegistry__factory.connect(
        FEED_REGISTRY,
        this.provider
      );
    }
    // define cryptoPairQuoteTicker and usdPairQuoteTicker
    this.cryptoPairQuoteTicker = chainId !== ChainId.BSC ? "ETH" : "BNB";
    this.usdPairQuoteTicker = "USD";

    getFeeds(chainId).map((feed) => {
      const baseTicker = feed.base.toUpperCase();
      const quoteTicker = feed.quote.toUpperCase();

      // get the key for the feed : return `${base}-${quote}`;
      const key = this.getFeedKey(baseTicker, quoteTicker);

      // add the key to the feedKeys Map
      this.feeds[key] = feed;

      if (!this.tokens.has(baseTicker)) {
        // add the baseTicker to the tokens Set
        this.tokens.add(baseTicker);
      }

      if (!this.feedKeys.has(baseTicker)) {
        // add the baseTicker to the feedKeys Map
        this.feedKeys.set(baseTicker, [key]);
      }

      // if feedKeys mapping does not have the key, add the key to the feedKeys Map
      if (!this.getFeedKeys(baseTicker).includes(key)) {
        // console.log("this.feedKeys before", this.feedKeys); '1INCH' => [ '1INCH-ETH', '1INCH-USD' ],
        this.feedKeys.set(baseTicker, [...this.getFeedKeys(baseTicker), key]);
        // console.log("this.feedKeys after", this.feedKeys); make copy of feedKeys and add key to it
      }

      if (!this.tokens.has(quoteTicker)) {
        this.tokens.add(quoteTicker);
      }

      if (!this.feedKeys.has(quoteTicker)) {
        this.feedKeys.set(quoteTicker, [key]);
      }

      if (!this.getFeedKeys(quoteTicker).includes(key)) {
        this.feedKeys.set(quoteTicker, [...this.getFeedKeys(quoteTicker), key]);
      }

      if (!this.quotes.includes(quoteTicker)) {
        this.quotes.push(quoteTicker);
      }
    });
  }

  // getLatestAnswer function
  public async getLatestAnswer(base: string, quote: string) {
    invariant(base !== "USD", "USD cannot be set as base ticker");

    const baseTicker = !!isAddress(base)
      ? (await this.tokenService.getToken(base)).symbol?.toUpperCase()
      : base.toUpperCase();

    const quoteTicker = quote.toUpperCase();

    invariant(
      !!baseTicker && !!this.tokens.has(baseTicker),
      "Base asset not supported"
    );
    invariant(
      !!quoteTicker && !!this.tokens.has(quoteTicker),
      "Quote asset not supported"
    );

    // e.g.) UNI-ETH
    // we wouldn't need to hop over between the price feeds
    // and compute the result if the price feed exists for the pair
    const feed = this.getFeed(baseTicker, quoteTicker);
    // return feed type is AggregatorModel

    // if feed is not null, get the latest answer from the feed
    if (!!feed) {
      const answer = await this._getLatestAnswer(feed, false);
      return formatUnits(answer, feed.decimals);
    }

    const aggregators: AggregatorParams[] = [];

    let baseFeed: AggregatorModel,
      quoteFeed: AggregatorModel,
      intersectionFeed: AggregatorModel,
      intersectedTicker: string | undefined;

    const baseFeedKeys = new Set([...this.getFeedKeys(baseTicker)]);
    // console.log("baseFeedKeys", baseFeedKeys);
    const quoteFeedKeys = new Set([...this.getFeedKeys(quoteTicker)]);
    // console.log("quoteFeedKeys", quoteFeedKeys);

    for (const baseFeedKey of baseFeedKeys) {
      const baseFeedTickers = baseFeedKey.split("-");
      const [baseFeedBaseTicker, baseFeedQuoteTicker] = baseFeedTickers;
      //   console.log("baseFeedBaseTicker", baseFeedBaseTicker);
      //   console.log("baseFeedQuoteTicker", baseFeedQuoteTicker);
      const baseFeedTicker =
        baseFeedBaseTicker === baseTicker
          ? baseFeedQuoteTicker
          : baseFeedBaseTicker;
      //   console.log("baseFeedTicker", baseFeedTicker);

      for (const quoteFeedKey of quoteFeedKeys) {
        const quoteFeedTickers = quoteFeedKey.split("-");
        const [quotefeedBaseTicker, quoteFeedQuoteTicker] = quoteFeedTickers;
        // console.log("quotefeedBaseTicker", quotefeedBaseTicker);
        // console.log("quoteFeedQuoteTicker", quoteFeedQuoteTicker);

        // e.g.) CRV-CVX: CRV-ETH -> CVX-ETH
        // we continued to iterate over the feed keys
        // even though we found the intersected asset
        // in order to check whether if there's an associated feed
        // that does not required to invert the price on computation or not
        console.log("!intersectedTicker is : ", !intersectedTicker);
        if (!intersectedTicker && baseFeedTicker === quoteFeedQuoteTicker) {
          console.log(
            "if(!intersectedTicker && baseFeedTicker === quoteFeedQuoteTicker) => intersectedTicker = quoteFeedQuoteTicker "
          );
          intersectedTicker = quoteFeedQuoteTicker;
          console.log("intersectedTicker is :", intersectedTicker);
        }

        // e.g.) WBTC-ETH: WBTC-BTC -> BTC-ETH instead of ETH-BTC
        if (baseFeedTicker === quotefeedBaseTicker) {
          intersectedTicker = quotefeedBaseTicker;
          console.log("intersectedTicker is :", intersectedTicker);

          baseFeed = this.getFeed(baseTicker, intersectedTicker);
          aggregators.push({ feed: baseFeed, invert: false });

          quoteFeed = this.getFeed(intersectedTicker, quoteTicker);
          aggregators.push({ feed: quoteFeed, invert: true });

          break;
        }
      }
    }

    if (aggregators.length === 0) {
      // e.g.) CRV-CVX: CRV-ETH -> CVX-ETH
      // fetch the prices of the assets on both feeds and compute the result
      // required to invert the price
      if (!!intersectedTicker) {
        baseFeed = this.getFeed(baseTicker, intersectedTicker);
        aggregators.push({ feed: baseFeed, invert: false });

        quoteFeed = this.getFeed(quoteTicker, intersectedTicker);
        aggregators.push({ feed: quoteFeed, invert: true });
      } else {
        // e.g.) LDO-MATIC: LDO-ETH -> ETH-USD -> MATIC-USD
        // fetch the prices of the assets from three feeds associated with the bridge assets
        // then compute the result required to invert the price depends on the direction
        const baseFeedAssociatedTickers = new Set([
          ...this.getAssociatedTickers(baseTicker),
        ]);
        const quoteFeedAssociatedTickers = new Set([
          ...this.getAssociatedTickers(quoteTicker),
        ]);

        if (
          !!baseFeedAssociatedTickers.has(this.cryptoPairQuoteTicker) &&
          !!quoteFeedAssociatedTickers.has(this.usdPairQuoteTicker)
        ) {
          baseFeed = this.getFeed(baseTicker, this.cryptoPairQuoteTicker);
          aggregators.push({ feed: baseFeed, invert: false });

          intersectionFeed = this.getFeed(
            this.cryptoPairQuoteTicker,
            this.usdPairQuoteTicker
          );
          aggregators.push({ feed: intersectionFeed, invert: false });

          quoteFeed = this.getFeed(quoteTicker, this.usdPairQuoteTicker);
          aggregators.push({ feed: quoteFeed, invert: true });
        } else if (
          !!baseFeedAssociatedTickers.has(this.usdPairQuoteTicker) &&
          !!quoteFeedAssociatedTickers.has(this.cryptoPairQuoteTicker)
        ) {
          baseFeed = this.getFeed(baseTicker, this.usdPairQuoteTicker);
          aggregators.push({ feed: baseFeed, invert: false });

          intersectionFeed = this.getFeed(
            this.cryptoPairQuoteTicker,
            this.usdPairQuoteTicker
          );
          aggregators.push({ feed: intersectionFeed, invert: true });

          quoteFeed = this.getFeed(quoteTicker, this.cryptoPairQuoteTicker);
          aggregators.push({ feed: quoteFeed, invert: true });
        } else {
          throw new Error(
            "No associated feed found because no intersection feed"
          );
        }
      }
    }

    let result: string | undefined;

    for (const { feed, invert } of aggregators) {
      const answer = await this._getLatestAnswer(feed, invert);
      invariant(+answer > 0, "Failed to fetch the price data");

      if (!result) {
        result = answer;
      } else {
        const denominator = toBN(parseUnits(1, feed.decimals));
        const numerator = mul(result, answer);

        result = div(numerator, denominator).toString();
      }
    }

    const formatted = formatUnits(result!, aggregators[0].feed.decimals);
    const fraction = formatted.split(".");

    // ChainLink Aggregator has 8 decimals for USD pairs
    if (quoteTicker === "USD" && fraction[1].length > 8) {
      return [fraction[0], fraction[1].slice(0, 8)].join(".");
    }

    return formatted;
  }

  // fetchAggregator function
  public async fetchAggregator(
    tokenAddress: string,
    quoteType: "ETH" | "BTC" | "USD"
  ) {
    try {
      invariant(
        this.chainId === ChainId.MAINNET,
        `FeedRegistry is not supported for ${this.network.label}`
      );

      let quote: string;

      switch (quoteType.toUpperCase()) {
        case "ETH":
          quote = NATIVE_ADDRESS;
          break;
        case "BTC":
          quote = BTC_QUOTE;
          break;
        case "USD":
          quote = USD_QUOTE;
          break;

        default:
          throw new Error("Invalid quote type");
      }
      return await this.feedRegistry!.getFeed(getAddress(tokenAddress), quote);
    } catch (error) {
      console.error("Failed to fetch aggregator : ", error);
      return undefined;
    }
  }

  // getAggregator function
  public getAggregator(base: string, quote: string) {
    const feed = this.getFeed(base, quote);
    invariant(!!feed, "Feed not found");

    // get the aggregatorAddress, if proxyAddress is not null, use proxyAddress, else use contractAddress
    const aggregatorAddress = !!feed.proxyAddress
      ? feed.proxyAddress
      : feed.contractAddress;

    return this.getContract(aggregatorAddress);
  }

  // getFeed function
  public getFeed(base: string, quote: string) {
    const key = this.getFeedKey(base, quote);
    return this.feeds[key]; // ${base}-${quote}
  }

  // supportedChains function
  public supportedChains() {
    return Object.values(ChainId).reduce<{ id: number; network: string }[]>(
      (acc, chainId) =>
        typeof chainId === "number"
          ? acc.concat({ id: chainId, network: ChainId[chainId] })
          : acc,
      []
    );
  }

  // private function ==========================================================
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

  // getAssociatedTickers function
  private getAssociatedTickers(ticker: string) {
    const feedKeys = this.getFeedKeys(ticker);

    const associatedTickers = feedKeys.reduce<string[]>((acc, feedKey) => {
      const [baseTicker, quoteTicker] = feedKey.split("-");
      const feedTicker = baseTicker === ticker ? quoteTicker : baseTicker;

      if (!acc.includes(feedTicker)) {
        acc.push(feedTicker);
      }
      return acc;
    }, []);
    return associatedTickers;
  }

  // _getLatestAnswer function
  private async _getLatestAnswer(feed: AggregatorModel, invert: boolean) {
    // get aggregator contract
    const aggregator = this.getAggregator(feed.base, feed.quote);
    // call latestAnswer from aggregator contract
    const response = await aggregator.latestAnswer();
    // format response
    let answer = toBN(response);

    if (!!invert) {
      // console.log("if (!!invert) triggered");
      const unit = toBN(parseUnits(1, feed.decimals));
      // console.log("unit is : ", unit.toString());
      const numerator = square(unit);
      // console.log("numerator is : ", numerator.toString());
      const denominator = answer;
      // console.log("denominator : ", denominator.toString());

      answer = div(numerator, denominator);
      // console.log("invert is true , answer is : ", answer.toString());
    }
    // console.log("!!invert is false , answer is : ", answer.toString());

    return answer.toString();
  }

  // getFeedKeys function
  private getFeedKeys(ticker: string) {
    // non-null assertion operator reqired in this function
    return this.feedKeys.get(ticker)!;
  }

  // getFeedKey function
  private getFeedKey(base: string, quote: string) {
    invariant(base !== quote, "Tickers must be identical");

    if (base === "USD") {
      [base, quote] = [quote, base];
    }

    return `${base}-${quote}`;
  }
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
  // ===========================================================================
}
