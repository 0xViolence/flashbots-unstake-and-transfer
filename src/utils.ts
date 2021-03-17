import { FlashbotsBundleProvider, FlashbotsBundleTransaction } from "@flashbots/ethers-provider-bundle";
import { BigNumber } from "ethers";

export const ETHER = BigNumber.from(10).pow(18);
export const GWEI = BigNumber.from(10).pow(9);

export async function checkSimulation(flashbotsProvider: FlashbotsBundleProvider, signedBundle: Array<string>, timestamp?: number): Promise<BigNumber> {
  const simulationResponse = await flashbotsProvider.simulate(signedBundle, "latest", undefined, timestamp);

  for (let i = 0; i < simulationResponse.results.length; i++) {
    const txSimulation = simulationResponse.results[i]
    if ("error" in txSimulation) {
      throw new Error(`TX #${i} : ${txSimulation.error} ${txSimulation.revert}`)
    }
  }

  if (simulationResponse.coinbaseDiff.eq(0)) {
    throw new Error("Does not pay coinbase")
  }

  const gasUsed = simulationResponse.results.reduce((acc: number, txSimulation) =>
    acc + txSimulation.gasUsed, 0)

  const gasPrice = simulationResponse.coinbaseDiff.div(gasUsed)
  return gasPrice
}

export async function printTransactions(bundleTransactions: Array<FlashbotsBundleTransaction>, signedBundle: Array<string>): Promise<void> {
  console.log("--------------------------------\n" +
    (await Promise.all(
      bundleTransactions.map(async (bundleTx, index) =>
        `TX #${index} (${bundleTx.transaction.nonce ?? '?'}): ${await bundleTx.signer.getAddress()} => ${bundleTx.transaction.to}`)))
      .join("\n"))

  // console.log("--------------------------------\n" +
  //   (await Promise.all(
  //     signedBundle.map(async (signedTx, index) =>
  //       `TX #${index}: ${signedTx}`)))
  //     .join("\n"))

  console.log("--------------------------------")
}

export function gasPriceToGwei(gasPrice: BigNumber): number {
  return gasPrice.mul(100).div(GWEI).toNumber() / 100;
}
