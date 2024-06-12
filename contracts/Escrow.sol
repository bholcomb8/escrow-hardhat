// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
    address public arbiterOne;
    address public arbiterTwo;
    address public beneficiary;
    address public depositor;
    uint256 public creationTime;

    bool public isApproved;

    mapping(address => bool) public signed;

    constructor(address _arbiterOne, address _arbiterTwo, address _beneficiary) payable {
        arbiterOne = _arbiterOne;
        arbiterTwo = _arbiterTwo;
        beneficiary = _beneficiary;
        depositor = msg.sender;
        creationTime = block.timestamp;
    }

    event Approved(uint);

    function Sign() public {
        require(msg.sender == arbiterOne || msg.sender == arbiterTwo, "Must be member of multisig");
        require(!signed[msg.sender], "Already signed");
        signed[msg.sender] = true;
    }

    function approve() external {
        require(msg.sender == arbiterOne || msg.sender == arbiterTwo, "Must be member of multisig to call Approve");
        require(signed[arbiterOne] && signed[arbiterTwo], "Escrow approval requires 2 of 2 multi sig");
        require(block.timestamp >= creationTime + 7 days, "Timelock: Cannot approve before 7 days");

        uint balance = address(this).balance;
        (bool sent, ) = payable(beneficiary).call{value: balance}("");
        require(sent, "Failed to send Ether");
        emit Approved(balance);
        isApproved = true;
    }
}
