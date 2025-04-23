// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ThreatIntelligence {
    // Struct to store threat information
    struct Threat {
        bytes32 id;
        string url;
        string threatSignature;
        uint8 threatLevel;
        uint8 confidence; // Stored as percentage (0-100)
        uint256 timestamp;
        address reporter;
        bool isMalicious;
        bool verified;
    }

    // Events
    event ThreatReported(
        bytes32 indexed threatId,
        address indexed reporter,
        string url,
        string threatSignature
    );

    event ThreatVerified(
        bytes32 indexed threatId,
        address indexed verifier,
        uint256 timestamp
    );

    // Mappings
    mapping(bytes32 => Threat) public threats;
    mapping(address => bytes32[]) public reporterThreats;
    bytes32[] public allThreats;

    // Modifiers
    modifier onlyExistingThreat(bytes32 threatId) {
        require(threatExists(threatId), "Threat does not exist");
        _;
    }

    // Report a new threat
    function reportThreat(
        bytes32 threatId,
        string memory url,
        string memory threatSignature,
        uint8 threatLevel,
        uint8 confidence,
        bool isMalicious
    ) external returns (bool) {
        require(!threatExists(threatId), "Threat already reported");
        require(bytes(url).length > 0, "URL cannot be empty");
        require(threatLevel > 0 && threatLevel <= 10, "Invalid threat level");
        require(confidence > 0 && confidence <= 100, "Invalid confidence value");

        threats[threatId] = Threat({
            id: threatId,
            url: url,
            threatSignature: threatSignature,
            threatLevel: threatLevel,
            confidence: confidence,
            timestamp: block.timestamp,
            reporter: msg.sender,
            isMalicious: isMalicious,
            verified: false
        });

        reporterThreats[msg.sender].push(threatId);
        allThreats.push(threatId);

        emit ThreatReported(threatId, msg.sender, url, threatSignature);
        return true;
    }

    // Verify a threat
    function verifyThreat(bytes32 threatId)
        external
        onlyExistingThreat(threatId)
        returns (bool)
    {
        Threat storage threat = threats[threatId];
        require(!threat.verified, "Threat already verified");
        
        threat.verified = true;
        emit ThreatVerified(threatId, msg.sender, block.timestamp);
        return true;
    }
    
    // Get threat info
    function getThreatInfo(bytes32 threatId)
        external
        view
        onlyExistingThreat(threatId)
        returns (
            address reporter,
            string memory url,
            string memory threatSignature,
            uint8 threatLevel,
            uint8 confidence,
            uint256 timestamp,
            bool isMalicious,
            bool verified
        )
    {
        Threat memory threat = threats[threatId];
        return (
            threat.reporter,
            threat.url,
            threat.threatSignature,
            threat.threatLevel,
            threat.confidence,
            threat.timestamp,
            threat.isMalicious,
            threat.verified
        );
    }

    // Get all threat IDs
    function getAllThreats() external view returns (bytes32[] memory) {
        return allThreats;
    }

    // Get threats count
    function getThreatsCount() external view returns (uint256) {
        return allThreats.length;
    }

    function threatExists(bytes32 threatId) public view returns (bool) {
        return threats[threatId].timestamp > 0;
    }
}