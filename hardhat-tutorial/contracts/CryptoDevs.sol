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
/** 
* @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
* name in our case is `Crypto Devs` and symbol is `CD`.
* Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
* It also initializes an instance of whitelist interface.
*/
constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD"){
  _baseTokenURI = baseURI;
  whitelist = IWhitelist(whitelistContract);
}
// @dev startPresale starts a presale for whitelisted addresses
function startPresale() public onlyOwner {
  presaleStarted= true;
  // set presaleEnded time as current timestamp + 5 min
  // Solidity has cool syntax for timestamps (seconds, min, hours, days, years)
  presaleEnded = block.timestamp + 60 minutes;
}
function presaleMint() public payable onlyWhenNotPaused {
  require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
  require(whitelist.whitelistedAddress(msg.sender), "You are not whitelisted");
  require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs Supply");
  require(msg.value >= _price, "Ether sent is not correct");
  tokenIds += 1;
  // _safeMint is a safer version of the _mint function as it ensures that if the address being minted to is a contract, then it knows how to deal with ERC721 tokens.  If the address being minted to is not a contract, it works the same way as _mint
  _safeMint(msg.sender, tokenIds);
}
// @dev mint allows a users to mint 1 NFT per transaction after the presale has ended
function mint() public payable onlyWhenNotPaused {
  require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended");
  require(tokenIds < maxTokenIds, "Exceeds maximum Crypto Devs supply");
  require(msg.value >= _price, "Ether sent is not correct");
  tokenIds += 1;
  _safeMint(msg.sender, tokenIds);
}
// @dev _baseURI overides the Openzepplin's ERC721 implementation which by default returned an empty string for the baseURI
function _baseURI() internal view virtual override returns (string memory){
  return _baseTokenURI;
}
// @dev setPaused makes the contract paused or unpaused
function setPaused(bool val) public onlyOwner {
  _paused = val;
}
// @dev withdraw sends all the ether in the contract to the owner of the contract
function withdraw() public onlyOwner {
  address _owner = owner();
  uint256 amount = address(this).balance;
  (bool sent, )= _owner.call{value: amount}("");
  require(sent, "Failed to send Ether");
}
// function to receive Ether. msg.data must be empty
receive() external payable{}

// Fallback function is called when msg.data is not empty
fallback() external payable{}
}
