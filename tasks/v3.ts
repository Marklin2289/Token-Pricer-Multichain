import chalk from "chalk";
import { task } from "hardhat/config";
import invariant from "tiny-invariant";

import { PoolState, V3PoolPricerService } from "../src/services";

task("get-pool-price", "retrieves the price of uniswap v3 pool")
  .addParam("base", "address or ticker of base asset")
  .addParam("quote", "address or ticker of quote asset")
  .addParam("fee", "pool fee")
  .addOptionalParam("period", "seconds ago")
  .setAction(async ({ base, quote, fee, period }, hre) => {
    if (base.toUpperCase() === "ETH") {
      base = "WETH";
    }

    if (quote.toUpperCase() === "ETH") {
      quote = "WETH";
    }

    const chainId = hre.network.config.chainId!;

    const pricer = new V3PoolPricerService(chainId);

    const poolFees = pricer.poolFees();

    invariant(!!poolFees.includes(+fee), "Invalid pool fee");

    const answer = await pricer.getLatestAnswer(base, quote, fee, period);

    console.log(``);
    console.log(
      `[${base.toUpperCase()}-${quote.toUpperCase()}]: ${chalk.cyanBright(
        answer
      )}`
    );
    console.log(``);
  });

task("get-pool-state", "retrieves the state of uniswap v3 pool")
  .addParam("base", "address or ticker of base asset")
  .addParam("quote", "address or ticker of quote asset")
  .addParam("fee", "pool fee")
  .setAction(async ({ base, quote, fee }, hre) => {
    if (base.toUpperCase() === "ETH") {
      base = "WETH";
    }

    if (quote.toUpperCase() === "ETH") {
      quote = "WETH";
    }

    const chainId = hre.network.config.chainId!;

    const pricer = new V3PoolPricerService(chainId);

    const poolFees = pricer.poolFees();

    invariant(!!poolFees.includes(+fee), "Invalid pool fee");

    const poolState = await pricer.getPoolState(base, quote, +fee);

    console.log(``);
    console.log(poolState);
    console.log(``);
  });

task(
  "get-most-liquidity-pool",
  "retrieves the state of uniswap v3 pool with most liquidity"
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

    const pricer = new V3PoolPricerService(chainId);

    const poolFees = pricer.poolFees();

    const poolStates = await Promise.all(
      poolFees.map(async (fee) => {
        try {
          return await pricer.getPoolState(base, quote, fee);
        } catch (e) {
          return undefined;
        }
      })
    );

    let result: PoolState | undefined;

    for (const poolState of poolStates) {
      if (
        !!poolState &&
        (!result || +poolState.liquidity > +result.liquidity)
      ) {
        result = poolState;
      }
    }

    console.log(``);
    console.log(result);
    console.log(``);
  });

task(
  "v3-supported-networks",
  "retrieves the list of supported networks"
).setAction(async (_, hre) => {
  const chainId = hre.network.config.chainId!;

  const pricer = new V3PoolPricerService(chainId);

  const supportedNetworks = pricer.supportedChains();

  console.log(``);
  console.log(supportedNetworks);
  console.log(``);
});
