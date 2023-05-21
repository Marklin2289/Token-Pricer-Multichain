import { Token } from "@uniswap/sdk-core";
import invariant from "tiny-invariant";

import { ChainId } from "../constants";
import { Mapping, Provider, TokenModel } from "../types";
import { formatUnits, isAddress, parseUnits } from "../utils";

import { BaseService } from "./common";
import { TokenService } from "./tokens";

import {
  IUniswapV2Factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair,
  IUniswapV2Pair__factory,
} from "../../typechain-types";

const UNISWAP_V2_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const PANCAKE_SWAP_FACTORY_ADDRESS =
  "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const QUICK_SWAP_FACTORY_ADDRESS = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const JOE_FACTORY_ADDRESS = "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10";
const PANGOLIN_FACTORY_ADDRESS = "0xefa94DE7a4656D787667C749f7E1223D71E9FD88";

const SUSHI_FACTORY_ADDRESS: { [id in ChainId]: string | undefined } = {
  [ChainId.MAINNET]: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
  [ChainId.OPTIMISM]: undefined,
  [ChainId.BSC]: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  [ChainId.POLYGON]: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  [ChainId.ARBITRUM]: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  [ChainId.AVALANCHE]: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
};

export interface PairState {
  protocol: string;
  pair: string;
  token0: TokenModel;
  token1: TokenModel;
  liquidity: string;
  reserve0: string;
  reserve1: string;
  blockTimestampLast: string;
}

export class V2PairPricerService extends BaseService<IUniswapV2Pair> {
  public readonly tokensService: TokenService;
  public readonly pairAddresses: Mapping<string> = {};
  public readonly pairKeys: Set<string> = new Set();
  public readonly factories: Mapping<IUniswapV2Factory> = {};
  public readonly protocols: Set<string> = new Set();

  constructor(
    chainId: ChainId,
    protocols?: ProtocolParams[],
    provider?: Provider
  ) {
    super(chainId, IUniswapV2Pair__factory, provider);

    invariant(
      chainId !== ChainId.OPTIMISM,
      "There are no protocols exist on Optimism"
    );

    this.tokensService = new TokenService(chainId, provider);

    // add the default protocols, if protocols are null or undefined then use the default protocols []
    protocols = SUPPORTED_PROTOCOLS[chainId].concat(protocols ?? []);

    // ceheck if there are any protocols, otherwise throw an error
    invariant(
      protocols.length > 0,
      `There are no protocols supported on ${ChainId[chainId].toLowerCase()}`
    );

    protocols.map(({ name, factory }) => {
      const protocol = name.toUpperCase();

      invariant(!this.protocols.has(protocol), "Protocol already exists");
      invariant(!!isAddress(factory), "Invalid factory address");

      this.protocols.add(protocol);
      this.factories[protocol] = IUniswapV2Factory__factory.connect(
        factory,
        this.provider
      );
    });
  }

  public async getLatestAnswer(protocol: string, base: string, quote: string) {
    const baseToken = await this.tokensService.getToken(base);
    const quoteToken = await this.tokensService.getToken(quote);

    // get the pair address
    const { pair } = await this.getPair(
      protocol,
      baseToken.address,
      quoteToken.address
    );

    // get the reserves
    const { reserve0, reserve1 } = await pair.getReserves();

    const [baseReserve, quoteReserve] = !!baseToken.sortsBefore(quoteToken)
      ? [reserve0, reserve1]
      : [reserve1, reserve0];

    const price = parseUnits(1, baseToken.decimals) // 1 ETH / 2000 USDC
      .mul(quoteReserve)
      .div(baseReserve);

    return formatUnits(price, quoteToken.decimals);
  }

  public async getPairState(protocol: string, tokenA: string, tokenB: string) {
    const { pair, token0, token1 } = await this.getPair(
      protocol,
      tokenA,
      tokenB
    );

    const [{ reserve0, reserve1, blockTimestampLast }, totalSupply] =
      await Promise.all([pair.getReserves(), pair.totalSupply()]);

    return {
      protocol: protocol.toLowerCase().replace("_", "-"),
      pair: pair.address,
      token0: {
        chainId: this.chainId,
        address: token0.address,
        name: token0.name!,
        symbol: token0.symbol!,
        decimals: token0.decimals,
      },
      token1: {
        chainId: this.chainId,
        address: token1.address,
        name: token1.name!,
        symbol: token1.symbol!,
        decimals: token1.decimals,
      },
      liquidity: totalSupply.toString(),
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      blockTimestampLast: blockTimestampLast.toString(),
    } as PairState;
  }

  public async getPair(
    protocol: string,
    tokenA: string | Token,
    tokenB: string | Token
  ) {
    const factory = this.factories[protocol.toUpperCase()];
    invariant(!!factory, "Protocol not found");

    // get the token0 and token1 type
    let token0 =
      typeof tokenA === "string"
        ? await this.tokensService.getToken(tokenA)
        : tokenA;
    let token1 =
      typeof tokenB === "string"
        ? await this.tokensService.getToken(tokenB)
        : tokenB;

    // check if the token0 and token1 are valid
    if (!token0.sortsBefore(token1)) {
      [token0, token1] = [token1, token0];
    }

    // create a pair key, format is: <protocol>-<token0>-<token1>
    const pairKey = `${protocol.toUpperCase()}-${token0.address}-${
      token1.address
    }`;

    // check if the pair key exists, if not then add it to the pair keys
    if (!this.pairKeys.has(pairKey)) {
      this.pairKeys.add(pairKey);

      const pairAddress = await factory.getPair(token0.address, token1.address);
      invariant(!!pairAddress, "Pair does not exist");

      this.pairAddresses[pairKey] = pairAddress;
    }

    // get the pair contract from common
    const pair = this.getContract(this.pairAddresses[pairKey]);

    return { pair, token0, token1 };
  }

  public supportedChains() {
    return Object.entries(SUPPORTED_PROTOCOLS).reduce<
      { id: number; network: string }[]
    >((acc, [chainId, protocols]) => {
      if (protocols.length > 0) {
        acc.push({ id: +chainId, network: ChainId[+chainId] });
      }

      return acc;
    }, []);
  }
}

interface ProtocolParams {
  name: string;
  factory: string;
}

const SUPPORTED_PROTOCOLS: { [id in ChainId]: ProtocolParams[] } = {
  [ChainId.MAINNET]: [
    {
      name: "UNISWAP",
      factory: UNISWAP_V2_FACTORY_ADDRESS,
    },
    {
      name: "SUSHI-SWAP",
      factory: SUSHI_FACTORY_ADDRESS[ChainId.MAINNET]!,
    },
  ],
  [ChainId.OPTIMISM]: [],
  [ChainId.BSC]: [
    {
      name: "PANCAKE-SWAP",
      factory: PANCAKE_SWAP_FACTORY_ADDRESS,
    },
    {
      name: "SUSHI-SWAP",
      factory: SUSHI_FACTORY_ADDRESS[ChainId.BSC]!,
    },
  ],
  [ChainId.POLYGON]: [
    {
      name: "QUICK-SWAP",
      factory: QUICK_SWAP_FACTORY_ADDRESS,
    },
    {
      name: "SUSHI-SWAP",
      factory: SUSHI_FACTORY_ADDRESS[ChainId.POLYGON]!,
    },
  ],
  [ChainId.ARBITRUM]: [
    {
      name: "SUSHI-SWAP",
      factory: SUSHI_FACTORY_ADDRESS[ChainId.ARBITRUM]!,
    },
  ],
  [ChainId.AVALANCHE]: [
    {
      name: "TRADER-JOE",
      factory: JOE_FACTORY_ADDRESS,
    },
    {
      name: "PANGOLIN",
      factory: PANGOLIN_FACTORY_ADDRESS,
    },
    {
      name: "SUSHI-SWAP",
      factory: SUSHI_FACTORY_ADDRESS[ChainId.AVALANCHE]!,
    },
  ],
};
