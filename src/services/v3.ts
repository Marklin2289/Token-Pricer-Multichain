import { constants, mul, sub } from "./../utils/math";
import { ChainId } from "../constants";
import { Mapping, Provider, TokenModel } from "../types";
import { FACTORY_ADDRESS, FeeAmount, TickMath } from "@uniswap/v3-sdk";
import { BaseService } from "./common";
import {
  IUniswapV3Factory,
  IUniswapV3Pool,
  IUniswapV3Pool__factory,
  IUniswapV3Factory__factory,
} from "../../typechain-types";
import { TokenService } from "./tokens";
import invariant from "tiny-invariant";
import { Price, Token } from "@uniswap/sdk-core";

const SUPPORTED_CHAINS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.OPTIMISM,
  ChainId.BSC,
  ChainId.POLYGON,
  ChainId.ARBITRUM,
];

export interface PoolState {
  pool: string;
  token0: TokenModel;
  token1: TokenModel;
  fee: FeeAmount;
  liquidity: string;
  sqrtRatioX96: string;
  tick: number;
}

export class V3PoolPricerService extends BaseService<IUniswapV3Pool> {
  public readonly tokenService: TokenService;
  public readonly poolAddresses: Mapping<string> = {};
  public readonly poolKeys: Set<string> = new Set();
  public readonly factory: IUniswapV3Factory;

  // constructor function
  constructor(chainId: ChainId, provider?: Provider) {
    super(chainId, IUniswapV3Pool__factory, provider);

    invariant(
      !!SUPPORTED_CHAINS.includes(chainId),
      `uniswap v3 is not supported on ${chainId}`
    );

    this.tokenService = new TokenService(chainId, provider);

    this.factory = IUniswapV3Factory__factory.connect(
      FACTORY_ADDRESS,
      this.provider
    );
  }

  // getLatestAnswer function
  public async getLatestAnswer(
    base: string,
    quote: string,
    fee: FeeAmount,
    period?: number
  ) {
    const baseToken = await this.tokenService.getToken(base);
    const quoteToken = await this.tokenService.getToken(quote);

    let tick: number;
    // if period is defined, get twap tick
    if (!!period) {
      tick = await this._twapTick(baseToken, quoteToken, fee, period);
    } else {
      ({ tick } = await this.getPoolState(
        baseToken.address,
        quoteToken.address,
        fee
      ));
    }
    // get price from tick
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
    // get price from sqrtRatioX96 : P
    const ratioX192 = mul(sqrtRatioX96, sqrtRatioX96).toString();
    const Q192 = constants.Q192.toString();

    // calculate price from baseToken and quoteToken using P(y) = 1 / P(x)
    const price = baseToken.sortsBefore(quoteToken)
      ? new Price(baseToken, quoteToken, Q192, ratioX192)
      : new Price(quoteToken, baseToken, ratioX192, Q192);

    return price.toFixed(quoteToken.decimals);
  }

  // getPoolState function
  public async getPoolState(tokenA: string, tokenB: string, fee: FeeAmount) {
    // get pool
    const { pool, token0, token1 } = await this.getPool(tokenA, tokenB, fee);
    // get pool state from Promise.all([pool.slot0(), pool.liquidity()]])
    const [slot0, liquidity] = await Promise.all([
      pool.slot0(),
      pool.liquidity(),
    ]);

    return {
      pool: pool.address,
      token0: {
        chainId: token0.chainId,
        address: token0.address,
        name: token0.name,
        symbol: token0.symbol,
        decimals: token0.decimals,
      },
      token1: {
        chainId: token1.chainId,
        address: token1.address,
        name: token1.name,
        symbol: token1.symbol,
        decimals: token1.decimals,
      },
      fee: fee,
      liquidity: liquidity.toString(),
      sqrtRatioX96: slot0.sqrtPriceX96.toString(),
      tick: slot0.tick,
    } as PoolState;
  }

  // getPoolFees function
  public poolFees() {
    return Object.values(FeeAmount).filter(
      (fee) => typeof fee === "number"
    ) as FeeAmount[];
  }

  // get supported chains function
  public supportedChains() {
    return SUPPORTED_CHAINS.map((chainId) => ({
      id: chainId,
      network: ChainId[chainId],
    })) as { id: number; network: string }[];
  }

  // private functions ========================================================

  // private _twapTick function
  private async _twapTick(
    tokenA: string | Token,
    tokenB: string | Token,
    fee: FeeAmount,
    period: number
  ) {
    invariant(period > 0, "period must be greater than 0");

    // get pool
    const { pool } = await this.getPool(tokenA, tokenB, fee);

    // get tickCumulatives
    const { tickCumulatives } = await pool.observe([period, 0]);

    // get tickCumulativesDelta
    const tickCumulativesDelta = +tickCumulatives[1]
      .sub(tickCumulatives[0])
      .toString();

    // get twapTick
    let twapTick = tickCumulativesDelta / period;

    // if tickCumulativesDelta is negative and not divisible by period, subtract 1 from twapTick
    // cause later when do Math.round(twapTick), it will round up which we need to subtract 1 first
    // to get the correct tick .e g : -1.5 => -2 not -1
    if (tickCumulativesDelta < 0 && tickCumulativesDelta % period != 0) {
      twapTick--;
    }

    return Math.round(twapTick);
  }

  // getPool function
  private async getPool(
    tokenA: string | Token,
    tokenB: string | Token,
    fee: FeeAmount
  ) {
    let token0 =
      typeof tokenA === "string"
        ? await this.tokenService.getToken(tokenA)
        : tokenA;
    let token1 =
      typeof tokenB === "string"
        ? await this.tokenService.getToken(tokenB)
        : tokenB;

    if (!token0.sortsBefore(token1)) {
      [token0, token1] = [token1, token0];
    }

    const poolKey = `${token0.address}-${token1.address}-${fee}`;

    // check if poolKeys has poolKey, if not, add it
    if (!this.poolKeys.has(poolKey)) {
      this.poolKeys.add(poolKey);

      // get pool address from factory
      const poolAddress = await this.factory.getPool(
        token0.address,
        token1.address,
        fee
      );
      invariant(!!poolAddress, "Pool does not exist");

      // add pool address to poolAddresses
      this.poolAddresses[poolKey] = poolAddress;
    }

    // get pool contract
    const pool = this.getContract(this.poolAddresses[poolKey]);

    return { pool, token0, token1 };
  }

  // ==========================================================================
}
