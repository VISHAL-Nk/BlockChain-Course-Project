// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts@4.9.3/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.9.3/access/Ownable.sol";
import "@openzeppelin/contracts@4.9.3/security/ReentrancyGuard.sol";

contract TicketNFT is ERC721, Ownable, ReentrancyGuard {
    struct Event {
        uint256 eventId;
        string  name;
        address organizer;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 priceWei;
        string  metadataCID;
        bool    isActive;
    }

    mapping(uint256 => Event)   public events;
    mapping(uint256 => bool)    public usedTickets;
    mapping(uint256 => uint256) public ticketEvent;
    mapping(uint256 => uint256) public ticketResalePrice;
    mapping(address => bool)    private verifiers;

    uint256 private _eventCounter;
    uint256 private _tokenCounter;

    event EventCreated(uint256 indexed eventId, string name, uint256 maxTickets, uint256 priceWei);
    event TicketPurchased(uint256 indexed tokenId, uint256 indexed eventId, address buyer);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, uint256 timestamp);
    event EventCancelled(uint256 indexed eventId);

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "TicketNFT: caller is not a verifier");
        _;
    }

    constructor() ERC721("TicketNFT", "TNFT") {}

    function createEvent(
        string memory name,
        uint256 maxTickets,
        uint256 priceWei,
        string memory metadataCID
    ) external onlyOwner {
        require(maxTickets > 0, "TicketNFT: max tickets must be > 0");
        require(priceWei > 0, "TicketNFT: price must be > 0");

        events[_eventCounter] = Event({
            eventId:     _eventCounter,
            name:        name,
            organizer:   msg.sender,
            maxTickets:  maxTickets,
            ticketsSold: 0,
            priceWei:    priceWei,
            metadataCID: metadataCID,
            isActive:    true
        });

        emit EventCreated(_eventCounter, name, maxTickets, priceWei);
        _eventCounter++;
    }

    function purchaseTicket(uint256 eventId) external payable {
        Event storage evt = events[eventId];
        require(evt.isActive, "TicketNFT: event not active");
        require(evt.ticketsSold < evt.maxTickets, "TicketNFT: sold out");
        require(msg.value == evt.priceWei, "TicketNFT: incorrect ETH amount");

        uint256 newTokenId = _tokenCounter;
        _tokenCounter++;
        evt.ticketsSold++;
        ticketEvent[newTokenId] = eventId;

        _safeMint(msg.sender, newTokenId);
        emit TicketPurchased(newTokenId, eventId, msg.sender);
    }

    function markUsed(uint256 tokenId) external onlyVerifier {
        require(_exists(tokenId), "TicketNFT: token does not exist");
        require(!usedTickets[tokenId], "TicketNFT: ticket already used");

        usedTickets[tokenId] = true;
        emit TicketUsed(tokenId, ticketEvent[tokenId], block.timestamp);
    }

    function isTicketValid(uint256 tokenId, address wallet) public view returns (bool) {
        return ownerOf(tokenId) == wallet && !usedTickets[tokenId];
    }

    function tokenURI(uint256 tokenId)
        public view override returns (string memory) {
        require(_exists(tokenId), "TicketNFT: URI query for nonexistent token");
        string memory cid = events[ticketEvent[tokenId]].metadataCID;
        return string(abi.encodePacked("ipfs://", cid));
    }

    function setVerifier(address addr, bool status) external onlyOwner {
        verifiers[addr] = status;
    }

    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "TicketNFT: no funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "TicketNFT: transfer failed");
    }

    function cancelEvent(uint256 eventId) external onlyOwner {
        require(events[eventId].isActive, "TicketNFT: already cancelled");
        events[eventId].isActive = false;
        emit EventCancelled(eventId);
    }

    function listTicketForSale(uint256 tokenId, uint256 salePriceWei) external {
        require(ownerOf(tokenId) == msg.sender, "TicketNFT: not the owner");
        require(!usedTickets[tokenId], "TicketNFT: ticket already used");
        
        uint256 eventId = ticketEvent[tokenId];
        uint256 originalPrice = events[eventId].priceWei;
        uint256 maxResalePrice = (originalPrice * 120) / 100;
        require(salePriceWei <= maxResalePrice, "TicketNFT: price exceeds 120% cap");

        ticketResalePrice[tokenId] = salePriceWei;
    }

    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        uint256 salePrice = ticketResalePrice[tokenId];
        require(salePrice > 0, "TicketNFT: ticket not for sale");
        require(msg.value == salePrice, "TicketNFT: incorrect ETH amount");
        require(!usedTickets[tokenId], "TicketNFT: ticket already used");

        address seller = ownerOf(tokenId);
        
        // Clear the listing
        ticketResalePrice[tokenId] = 0;

        // Transfer the ticket
        _transfer(seller, msg.sender, tokenId);

        // Calculate 10% royalty for the organizer
        uint256 royalty = (msg.value * 10) / 100;
        uint256 sellerShare = msg.value - royalty;

        // Send funds to seller
        (bool successSeller, ) = payable(seller).call{value: sellerShare}("");
        require(successSeller, "TicketNFT: transfer to seller failed");
        
        // Send royalty to organizer (the contract owner)
        (bool successOrganizer, ) = payable(owner()).call{value: royalty}("");
        require(successOrganizer, "TicketNFT: transfer to organizer failed");
    }

    function totalEvents() external view returns (uint256) { return _eventCounter; }
}
