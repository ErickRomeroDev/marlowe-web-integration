"use client";

import {
  type BroswerWalletExtension,
  type SupportedWalletName,
} from "@marlowe.io/wallet/browser";
import { type RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import {
  mkRuntimeLifecycle,
  type BrowserRuntimeLifecycleOptions,
} from "@marlowe.io/runtime-lifecycle/browser";
import { mkRestClient, type RestClient } from "@marlowe.io/runtime-rest-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import { TSSDKContext } from "~/contexts/tssdk.context";
import { COLORS, ICON_SIZES, IWalletInStorage, PAGES } from "@/constants";
import { TailorButton, SIZE } from "@/components/tailor-button/tailorButton";
import { Loading } from "@/components/loading/loading";
import { WalletsSupported } from "./walletSupported";

export const WalletSelect = () => {
  const [openInfo, setOpenInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletName, setWalletName] = useState<SupportedWalletName | undefined>(
    undefined
  );
  const [availableProviders, setAvailableProviders] = useState<
    BroswerWalletExtension[]
  >([]);
  const [runtimeLifecycle, setRuntimeLifecycle] = useState<
    RuntimeLifecycle | undefined
  >(undefined);
  const [client, setClient] = useState<RestClient | undefined>(undefined); 
  const router = useRouter();

  useEffect(() => {
    const walletsInstalled = async () => {
      const { getInstalledWalletExtensions } = await import(
        "@marlowe.io/wallet"
      );
      const installedWalletExtensions = getInstalledWalletExtensions();
      console.log(installedWalletExtensions)
      setAvailableProviders(installedWalletExtensions);
      setLoading(false);
    };
    walletsInstalled();
  }, []);

  useEffect(() => {
    if (walletName) {
      void getWalletAddress(walletName);
    }    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletName]);

  const getWalletAddress = async (walletName: SupportedWalletName) => {
    const { mkBrowserWallet } = await import("@marlowe.io/wallet");           
    const walletApi = await mkBrowserWallet(walletName); 
    const walletAddress = await walletApi.getChangeAddress();
    console.log(walletAddress)
    // const walletAddress = await runtimeLifecycle?.wallet.getChangeAddress();
    // if (walletAddress !== undefined) {
    //   window.localStorage.setItem(
    //     "walletInfo",
    //     JSON.stringify({
    //       address: walletAddress,
    //       walletProvider: walletName,
    //     }),
    //   );
    // }
  };  

   const handleSelectWallet = (walletName: SupportedWalletName) => async () => {
    const { mkBrowserWallet } = await import("@marlowe.io/wallet");           
    const walletApi = await mkBrowserWallet(walletName);  
    setWalletName(walletName); 
    console.log(walletApi)  
  };

  const toggleInfo = () => setOpenInfo((prev) => !prev);

  if (loading) {
    return (
      <div className="flex flex-grow items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <div className="my-16 flex w-full flex-col justify-center rounded-lg p-8 shadow-container md:w-2/3 lg:w-1/2 xl:w-1/3 2xl:w-1/4">
        <p className="pb-2 text-2xl font-bold lg:text-3xl">No wallet found</p>
        <div className="flex flex-col gap-4">
          <p className="text-base text-m-disabled lg:text-lg">
            Please install a wallet to deploy a contract
          </p>
          <WalletsSupported />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col justify-center rounded-lg p-8 shadow-container md:w-2/3 lg:w-1/2 xl:w-1/3 2xl:w-1/4">
      <div className="flex items-center gap-3">
        <p className="pb-2 text-2xl font-bold lg:text-3xl">Choose a wallet</p>
        <div className="relative">
          <Image
            src="/info.svg"
            alt="i"
            height={ICON_SIZES.L}
            width={ICON_SIZES.L}
            onClick={toggleInfo}
            className="cursor-pointer pb-1"
          />
          {openInfo && (
            <div className="absolute right-0 top-8 w-48 rounded-lg bg-white px-4 py-2 shadow-container sm:left-0 lg:w-56">
              <WalletsSupported />
            </div>
          )}
        </div>
      </div>
      <p className="text-base text-m-disabled lg:text-lg">
        Please select a wallet to deploy a contract
      </p>

      <div className="flex flex-col gap-2 py-8">
        {availableProviders.sort().map((wallet) => {
          return (
            <div
              key={wallet.name}
              className="flex items-center justify-between gap-2 rounded-lg border p-4"
            >
              <div className="flex w-1/4 items-center gap-2">
                <Image
                  src={wallet.icon}
                  alt={wallet.name}
                  height={ICON_SIZES.L}
                  width={ICON_SIZES.L}
                />
                <p className="text-base font-bold capitalize">{wallet.name}</p>
              </div>
              <div className="w-1/2 sm:w-2/5 md:w-2/5 xl:w-1/3 2xl:min-w-min 2xl:max-w-min">
                <TailorButton
                  size={SIZE.SMALL}
                  color={COLORS.BLUE}
                  onClick={handleSelectWallet(
                    wallet.name as SupportedWalletName,
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Image
                      src="/cardano.svg"
                      alt={"C"}
                      height={ICON_SIZES.XS}
                      width={ICON_SIZES.XS}
                    />
                    <p className="font-normal text-black">Cardano</p>
                  </div>
                </TailorButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
