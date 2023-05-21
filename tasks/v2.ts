import chalk from "chalk";
import { task } from "hardhat/config";

import { PairState, V2PairPricerService } from "../src/services";

task("get-pair-price", "retrieves the price of uniswap v2 pair")
  .addParam("base", "address or ticker of base asset")
  .addParam("quote", "address or ticker of quote asset")
  .addParam("protocol", "name of protocol")
  .setAction(async ({ base, quote, protocol }, hre) => {
    if (base.toUpperCase() === "ETH") {
      base = "WETH";
    }

    if (quote.toUpperCase() === "ETH") {
      quote = "WETH";
    }

    const chainId = hre.network.config.chainId!;

    const pricer = new V2PairPricerService(chainId);

    const answer = await pricer.getLatestAnswer(protocol, base, quote);

    console.log(``);
    console.log(
      `[${base.toUpperCase()}-${quote.toUpperCase()}]: ${chalk.cyanBright(
        answer
      )}`
    );
    console.log(``);
  });

task("get-pair-state", "retrieves the state of uniswap v2 pair")
  .addParam("base", "address or ticker of base asset")
  .addParam("quote", "address or ticker of quote asset")
  .addParam("protocol", "name of protocol")
  .setAction(async ({ base, quote, protocol }, hre) => {
    if (base.toUpperCase() === "ETH") {
      base = "WETH";
    }

    if (quote.toUpperCase() === "ETH") {
      quote = "WETH";
    }

    const chainId = hre.network.config.chainId!;

    const pricer = new V2PairPricerService(chainId);

    const pairState = await pricer.getPairState(protocol, base, quote);

    console.log(``);
    console.log(pairState);
    console.log(``);
  });

task(
  "get-most-liquidity-pair",
  "retrieves the state of uniswap v2 pair with most liquidity"
)
  .addParam("base", "address or ticker of base asset")
  .addParam("quote", "address or ticker of quote asset")
  .setAction(async ({ base, quote }, hre) => {
    if (base.toUpperCase() === "ETH") {
      base = "WETH";
    }

    if (quote.toUpperCase() === "ETH") {
      quote = "WETH";
    }

    const chainId = hre.network.config.chainId!;

    const pricer = new V2PairPricerService(chainId);

    let result: PairState | undefined;

    for (const protocol of pricer.protocols) {
      const pairState = await pricer.getPairState(protocol, base, quote);

      if (
        !!pairState &&
        (!result || +pairState.liquidity > +result.liquidity)
      ) {
        result = pairState;
      }
    }

    console.log(``);
    console.log(result);
    console.log(``);
  });

task(
  "v2-supported-protocols",
  "retrieves the list of supported protocols"
).setAction(async (_, hre) => {
  const chainId = hre.network.config.chainId!;

  const pricer = new V2PairPricerService(chainId);

  const protocols: string[] = [];

  for (const protocol of pricer.protocols.values()) {
    protocols.push(protocol.toLowerCase().replace("_", "-"));
  }

  console.log(``);
  console.log(protocols);
  console.log(``);
});

task(
  "v2-supported-networks",
  "retrieves the list of supported networks"
).setAction(async (_, hre) => {
  const chainId = hre.network.config.chainId!;

  const pricer = new V2PairPricerService(chainId);

  const supportedNetworks = pricer.supportedChains();

  console.log(``);
  console.log(supportedNetworks);
  console.log(``);
});
