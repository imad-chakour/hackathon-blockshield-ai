// SPDX-License-Identifier: MIT 
// blockchain/contracts/ThreatIntelligence.sol
pragma solidity ^0.8.0;

contract ThreatIntelligence {
    struct ThreatReport {
        address reporter;
        string logData;
        uint256 timestamp;
        bool verified;
    }
    
    mapping(bytes32 => ThreatReport) public threats;
    address public admin;
    
    event ThreatReported(bytes32 indexed threatId, address indexed reporter);
    event ThreatVerified(bytes32 indexed threatId);
    
    constructor() {
        admin = msg.sender;
    }
    //=====================================================================
    function reportThreat(string memory _logData) external returns (bytes32) {
        bytes32 threatId = keccak256(abi.encodePacked(_logData, block.timestamp));
        threats[threatId] = ThreatReport({
            reporter: msg.sender,
            logData: _logData,
            timestamp: block.timestamp,
            verified: false
        });
        emit ThreatReported(threatId, msg.sender);
        return threatId;
    }
    //=====================================================================
    function verifyThreat(bytes32 _threatId) external {
        require(msg.sender == admin, "Only admin can verify");
        threats[_threatId].verified = true;
        emit ThreatVerified(_threatId);
    }
    //=====================================================================
    function getThreatInfo(bytes32 _threatId) external view returns (ThreatReport memory) {
        return threats[_threatId];
    }
}