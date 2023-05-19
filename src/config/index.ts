import "dotenv/config";
import { ChainId, getNetwork } from "../constants";
import { HttpNetworkUserConfig, NetworksUserConfig } from "hardhat/types";

//  from .env
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const INFURA_API_KEY = process.env.INFURA_API_KEY;

export const getRpcUrl = (chainId: ChainId) => {
  // getNetwork from constants
  const network = getNetwork(chainId);
  // destructure rpcUrl from network
  const { alchemy, infura } = network.rpcUrl;

  if (!!ALCHEMY_API_KEY && !!alchemy) {
    return `${alchemy}${ALCHEMY_API_KEY}`;
  }
  if (!!INFURA_API_KEY && !!infura) {
    return `${infura}${INFURA_API_KEY}`;
  }

  return "https://localhost:8545";
};

export const buildNetworksConfig = (forkId: ChainId, enableFork: boolean) => {
  const config: NetworksUserConfig = {
    hardhat: {
      chainId: forkId,
      forking: {
        enabled: (!!INFURA_API_KEY || !!ALCHEMY_API_KEY) && enableFork === true,
        url: getRpcUrl(forkId),
      },
    },
  };

  return Object.entries(ChainId).reduce<NetworksUserConfig>(
    (acc, [key, value]) => {
      if (!!isNaN(+key) && !isNaN(+value)) {
        const networkName = key.toLowerCase();
        const networkId = +value as ChainId;

        const networkConfig: HttpNetworkUserConfig = {
          chainId: networkId,
          url: getRpcUrl(networkId),
        };

        acc[networkName] = networkConfig;
      }

      return acc;
    },
    config
  );
};
