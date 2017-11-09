pragma solidity ^0.4.18;

/// @title SafeMath
/// @dev Math operations with safety checks that throw on error
library SafeMath {
    /// @dev Multiplies a times b
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }

    /// @dev Divides a by b
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    /// @dev Subtracts a from b
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    /// @dev Adds a to b
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


contract Ownable {

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function Ownable() public {
        owner = msg.sender;
    }


    function transferOwnership(address newOwner) onlyOwner public {
        require(newOwner != address(0));
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}


contract ERC20Token {
    uint256 public totalSupply;
    function balanceOf(address who) public constant returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);
    function allowance(address owner, address spender) public constant returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function approve(address spender, uint256 value) public returns (bool);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);
}


contract uniswap is Ownable{
    using SafeMath for uint256;

    event TokenPurchase(address indexed buyer, uint256 tokensPurchased, uint256 ethSpent);
    event EthPurchase(address indexed buyer, uint256 ethPurchased, uint256 tokensSpent);

    uint256 public totalEthQuantity;
    uint256 public totalTokenQuantity;
    uint256 public invariant = 0;
    address public tokenAddress;
    ERC20Token token;

    function uniswap(address _tokenAddress) public payable {
        tokenAddress = _tokenAddress;
        token = ERC20Token(tokenAddress);
        totalEthQuantity = msg.value;
    }


    function initiateUniswap(uint256 initialTokenQuantity) public onlyOwner {
        require(invariant == 0);
        token.transferFrom(msg.sender, address(this), initialTokenQuantity);
        totalTokenQuantity = initialTokenQuantity;
        invariant = initialTokenQuantity.mul(totalEthQuantity);
        require(invariant > 0);
    }


    function ethToTokens(uint256 minimumTokens, uint256 timeout) public payable {
        require(msg.value != 0 && timeout != 0);
        uint256 fee = msg.value/500;
        uint256 ethInPurchase = msg.value.sub(fee);
        uint256 newTotalEth = totalEthQuantity.add(ethInPurchase);
        uint256 newTotalTokens = invariant/newTotalEth;
        uint256 purchasedTokens = totalTokenQuantity.sub(newTotalTokens);
        require(purchasedTokens >= minimumTokens);
        require(now < timeout);
        token.transfer(msg.sender, purchasedTokens);
        totalEthQuantity = newTotalEth;
        totalTokenQuantity = newTotalTokens;
        TokenPurchase(msg.sender, purchasedTokens, ethInPurchase);
    }


    function tokenToEth(uint256 sellQuantity, uint256 minimumEth, uint256 timeout) public {
        require(sellQuantity!=0 && minimumEth != 0 && timeout != 0);
        token.transferFrom(msg.sender, address(this), sellQuantity);
        uint256 fee = sellQuantity/500;
        uint256 tokensInPurchase = sellQuantity - fee;
        uint256 newTotalTokens = totalTokenQuantity.add(tokensInPurchase);
        uint256 newTotalEth = invariant/newTotalTokens;
        uint256 purchasedEth = totalEthQuantity.sub(newTotalEth);
        require(purchasedEth >= minimumEth);
        require(now < timeout);
        msg.sender.transfer(purchasedEth);
        totalTokenQuantity = newTotalTokens;
        totalEthQuantity = newTotalEth;
        EthPurchase(msg.sender, purchasedEth, tokensInPurchase);
    }


    function ownerTokenDeposit(uint256 tokenAmount) public onlyOwner {
        require(tokenAmount !=0);
        token.transferFrom(msg.sender, address(this), tokenAmount);
        totalTokenQuantity = totalTokenQuantity.add(tokenAmount);
        invariant = totalTokenQuantity.mul(totalEthQuantity);
    }


    function ownerEthDeposit() public payable onlyOwner {
        require(msg.value != 0);
        totalEthQuantity = totalEthQuantity.add(msg.value);
        invariant = totalEthQuantity.mul(totalTokenQuantity);
    }


    function ownerTokenWithdraw(uint256 tokenAmount) public onlyOwner {
        require(tokenAmount !=0);
        token.transfer(msg.sender, tokenAmount);
        totalTokenQuantity = totalTokenQuantity.sub(tokenAmount);
        invariant = totalTokenQuantity.mul(totalEthQuantity);
    }


    function ownerEthWithdraw(uint256 ethAmount) public onlyOwner {
        require(ethAmount !=0);
        msg.sender.transfer(ethAmount);
        totalEthQuantity = totalEthQuantity.sub(ethAmount);
        invariant = totalEthQuantity.mul(totalTokenQuantity);
    }
}
