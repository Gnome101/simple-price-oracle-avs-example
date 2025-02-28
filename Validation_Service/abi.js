const abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "marketDescription",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "registrationDelay",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "marketLength",
        type: "uint256",
      },
    ],
    name: "MakeMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "proofOfTask",
            type: "string",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "address",
            name: "taskPerformer",
            type: "address",
          },
          {
            internalType: "uint16",
            name: "taskDefinitionId",
            type: "uint16",
          },
        ],
        internalType: "struct IAttestationCenter.TaskInfo",
        name: "_taskInfo",
        type: "tuple",
      },
      {
        internalType: "bool",
        name: "_isApproved",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "_tpSignature",
        type: "bytes",
      },
      {
        internalType: "uint256[2]",
        name: "_taSignature",
        type: "uint256[2]",
      },
      {
        internalType: "uint256[]",
        name: "_operatorIds",
        type: "uint256[]",
      },
    ],
    name: "afterTaskSubmission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "proofOfTask",
            type: "string",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "address",
            name: "taskPerformer",
            type: "address",
          },
          {
            internalType: "uint16",
            name: "taskDefinitionId",
            type: "uint16",
          },
        ],
        internalType: "struct IAttestationCenter.TaskInfo",
        name: "_taskInfo",
        type: "tuple",
      },
      {
        internalType: "bool",
        name: "_isApproved",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "_tpSignature",
        type: "bytes",
      },
      {
        internalType: "uint256[2]",
        name: "_taSignature",
        type: "uint256[2]",
      },
      {
        internalType: "uint256[]",
        name: "_operatorIds",
        type: "uint256[]",
      },
    ],
    name: "beforeTaskSubmission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "winner",
        type: "bool",
      },
    ],
    name: "chooseWinner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getDecryptionShares",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getKeys",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarket",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "keyRegistrationExpiration",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expiration",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "c1",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "c2",
            type: "bytes",
          },
          {
            internalType: "string[]",
            name: "publicKeys",
            type: "string[]",
          },
          {
            internalType: "string[]",
            name: "partialDecripts",
            type: "string[]",
          },
          {
            internalType: "bool",
            name: "isFinalized",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "winner",
            type: "bool",
          },
        ],
        internalType: "struct Market",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "market",
    outputs: [
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "keyRegistrationExpiration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiration",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "c1",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "c2",
        type: "bytes",
      },
      {
        internalType: "bool",
        name: "isFinalized",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "winner",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "newVote",
        type: "bytes",
      },
    ],
    name: "modifyVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "publicKey",
        type: "string",
      },
    ],
    name: "submitKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "partialDecript",
        type: "string",
      },
    ],
    name: "submitPartialDecript",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
module.exports = { abi };
