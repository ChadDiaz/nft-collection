import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { ethers, Contract } from 'ethers';
import styles from '../styles/Home.module.css';
import Web3Modal from 'web3modal';
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants';

export default function Home() {
  // NOTE state variables
  //first one - has the user connected to their wallet
  const [walletConnected, setWalletConnected] = useState(false);
  // we need to be able to update state if the presale has started
  const [preSaleStarted, setPreSaleStarted] = useSate(false);
  // one to know if the owner is the one signed in
  const [isOwner, setIsOwner] = useState(false);

  // NOTE instantiate web3 model here
  const web3ModalRef = useRef();

  // first thing we want to do is to connect our wallet with web3modal and ethers.js
  const connectWallet = async () => {
    try {
      // await the helper function below
      await getProviderOrSigner();
      // update walletConnected to "true"
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };
  // NOTE helper function to determine if signer and/ or provider is needed
  const getProviderOrSigner = async (needSigner = false) => {
    // we need a way to access the users provider, signer from Meta Mask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    // if the user isn't connected to goerli, have them switch to goerli
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert('Please switch to the Goerli Network');
      throw new Error('Incorrect Network - Need Goerli Network');
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  //NOTE we need a helper function so that only the owner can see the button to start the presale
  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        signer
      );
      // need a way to compare the current user address to the owner address
      const owner = nftContract.owner();
      const userAddress = signer.getAddress();
      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
        
      }
    } catch (error) {
      console.error(error);
    }
  };
  //NOTE we need  function to start the preSale only callable by the owner
  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        signer
      );
      const txn = await nftContract.startPresale();
      await txn.await();
      setPreSaleStarted(true);
    } catch (error) {
      console.error(error);
    }
  };

  //NOTE we need a function to see if the preSale has started only callable by the owner
  const checkIfPresaleStarted = async () => {
    try {
      // need to get a provider or signer
      const provider = await getProviderOrSigner();
      // get an instance of your NFT contract
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        provider
      );
      const isPresaleStarted = await nftContract.preSaleStarted();
      setPreSaleStarted(isPresaleStarted);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'goerli',
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, []);

  return (
    <div>
      <Head>
        <title>Chad's First NFT Attempt!</title>
      </Head>
      <div className={styles.main}>
        {walletConnected ? null : (
          <button onClick={connectWallet} className={styles.button}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
