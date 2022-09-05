// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
// import all of the needed tools and files
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
  /**
   * @dev _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
   * token will be the concatenation of the `baseURI` and the `tokenId`.
   */
  string _baseTokenURI;
  //  _price is the price of one Crypto Dev NFT
  uint256 public _price = 0.01 ether;

  // _paused is used to pause the contract incase of emergency
  bool public _paused;

  //max number of CryptoDevs
  uint256 public maxTokenIds = 20;

  // total number of tokenIds minted
  uint256 public tokenIds;

  // Whitelist contract instance
  IWhitelist whitelist;

  //boolen to keep track of whether presale started or not
  bool public presaleStarted;

  //timestamp for when presale would end
  uint256 public presaleEnded;

  modifier onlyWhenNotPaused {
    require(!_paused, "Contract currently paused");
    _;
  }




  
}