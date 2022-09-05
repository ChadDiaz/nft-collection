import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { ethers, Contract, utils } from 'ethers';
import styles from '../styles/Home.module.css';
import Web3Modal from 'web3modal';
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants';

export default function Home() {
  // SECTION STATE VARIABLES
  //first one - has the user connected to their wallet
  const [walletConnected, setWalletConnected] = useState(false);
  // we need to be able to update state if the presale has started or stopped
  const [preSaleStarted, setPreSaleStarted] = useState(false);
  // we need to know if presale has ended
  const [preSaleEnded, setPresaleEnded] = useState(false);
  // one to know if the owner is the one signed in
  const [isOwner, setIsOwner] = useState(false);
  // one to keep track of the number of tokens that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState('0');
  // one to tell the app when something is happening and need to wait
  const [isLoading, setIsLoading] = useState(false);

  // NOTE instantiate web3 model here
  const web3ModalRef = useRef();
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
  // NOTE first thing we want to do is to connect our wallet with web3modal and ethers.js
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.log('this is where the error is coming from:', err);
    }
  };

  //NOTE we need a helper function so that only the owner can see the button to start the presale
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        provider
      );
      // need a way to compare the current user address to the owner address
      const _owner = nftContract.owner();
      const userAddress = getProviderOrSigner(true);
      const address = await userAddress.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
      console.log('error in the getOwner function', err);
    }
  };

  //NOTE we need a function to mint during the presale period
  const presaleMint = async () => {
    try {
      // we need a signer here
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        signer
      );
      // call the presale mint from the contract and ensure that only whitelisted addresses can mint
      const tx = await whitelistContract.presaleMint({
        // value of the presale mint - using the utils feature from ethers to parse the string to ether
        value: utils.parseEther('0.001'),
      });
      setIsLoading(true);
      // wait for the transaction to be mined
      await tx.wait();
      setIsLoading(false);
      window.alert('You successfully minted a pre-sale NFT by Chad');
    } catch (err) {
      console.error(err);
    }
  };

  //NOTE we need a function to mint during the public sale/after presale
  const publicMint = async () => {
    try {
      // anytime it is a write transaction - we need signer
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        signer
      );
      // call the mint from the contract
      const tx = await nftContract.mint({
        value: utils.parseEther('0.01'),
      });
      setIsLoading(true);
      // wait for the mint
      await tx.wait();
      setIsLoading(false);
      window.alert("You've successfully minted a public NFT by Chad");
    } catch (err) {
      console.error(err);
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
      setIsLoading(true);
      await txn.await();
      setIsLoading(false);
      await checkIfPresaleStarted();
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
      const _presaleStarted = await nftContract.preSaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPreSaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  //NOTE we need a function to see if the presale has ended only called by the owner
  const checkIfPresaleEnded = async () => {
    try {
      const signer = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        signer
      );
      //NOTE presaleEndTime returns a BIG NUMBER and a timestamp in seconds.  Date.now returns in milliseconds so we divide Date.now by 1000 to compare
      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  //NOTE need a function to get the total number of tokenIds minted
  const getTokenIdsMinted = async () => {
    try {
      // only need a provider here
      const provider = getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        provider
      );
      // get a variable for the tokens
      const _tokenIds = await nftContract.tokenIds();
      // tokenIds is a BIG number so we set it to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };
  // NOTE useEffect to be called each time the state needs to re-render
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: 'goerli',
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // Check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  //SECTION area to render in the return / done as a function
  const renderButton = () => {
    // this is incase the wallet isn't connected - they see button to connect wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }
    // if we are waiting for something to happen, return a button that says loading
    if (isLoading) {
      return <button className="styles button">Loading...</button>;
    }

    if (isOwner && !preSaleStarted) {
      // render a button to start the presale
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale Now!
        </button>
      );
    }
    if (!preSaleStarted) {
      // just say "presale hasn't started yet. come back later"
      return (
        <div>
          <div className="styles description">
            Presale hasn't started yet. Check back later!
          </div>
        </div>
      );
    }
    if (preSaleStarted && !preSaleEnded) {
      // allows user to min in presale and they MUST be in whitelist for this to work
      return (
        <div>
          <div className={styles.description}>
            Presale has started!! If your address is whitelisted, mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }
    if (preSaleStarted && preSaleEnded) {
      // allow users to take part in public sale
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint! 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Chad's First NFT Attempt!</title>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
            Welcome to Chad's Crypto Dev NFT Offering
          </h1>
          <div className={styles.description}>
            This is a NFT collection to prepare for the DAO that is coming SOON!
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img
            src="./public/cryptodev/0.svg"
            alt="crypto devs image"
            className={styles.image}
          />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Ender0530;
      </footer>
    </div>
  );
}
