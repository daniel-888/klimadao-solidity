// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
  uint256 initialSupply = 100000 * 10**decimals();

  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, initialSupply);
  }
}
