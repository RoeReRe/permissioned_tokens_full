/* eslint-disable */
const algosdk = require("algosdk");
import { getAlgodClient } from "./client.js";
import wallets from "./wallets.js";
import proposalInfo from "./artifacts/1-deploy-proposal-contract.js.cp.yaml";

const getExplorerURL = (txId, network) => {
    switch (network) {
        case "TestNet":
            return "https://testnet.algoexplorer.io/tx/" + txId;
        default:
            return "http://localhost:8980/v2/transactions/" + txId + "?pretty";
    }
}

const readGlobalState = async (appId, algodClient) => {
    const app = await algodClient.getApplicationByID(appId).do();
    
    // global state is a key value array
    const globalState = app.params["global-state"];
    const formattedGlobalState = globalState.map(item => {
      // decode from base64 and utf8
      const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));
  
      let formattedValue;
      if (item.value.type === 1) {
        if (formattedKey === "voted") {
          formattedValue = decodeURIComponent(Buffer.from(item.value.bytes, "base64"));
        } else {
          formattedValue = item.value.bytes;
        }
      } else {
        formattedValue = item.value.uint;
      }
      
      return {
        key: formattedKey,
        value: formattedValue
      }
    });
  
    return formattedGlobalState;
}

// Default or purestake
const prop = Object.keys(proposalInfo)[0];
const proposalID = proposalInfo[prop]["metadata"]["AppID"];
const proposalAddress = proposalInfo[prop]["metadata"]["AppAddress"];

const coinsLeft = async (network) => {
    const algodClient = getAlgodClient(network);
    const proposalGlobalState = await readGlobalState(proposalID, algodClient);
    
    const titleEnc = await proposalGlobalState.find((e) => {
      return e["key"] === "Title";
    })["value"];
    const title = Buffer.from(titleEnc, "base64");

    const descEnc = await proposalGlobalState.find((e) => {
      return e["key"] === "Desc";
    })["value"];
    const desc = Buffer.from(descEnc, "base64");

    const forVote = await proposalGlobalState.find((e) => {
      return e["key"] === "For";
    })["value"];

    const againstVote = await proposalGlobalState.find((e) => {
      return e["key"] === "Against";
    })["value"];

    const assetID = await proposalGlobalState.find((e) => {
      return e["key"] === "assetID";
    })["value"];

    return [title, desc, forVote, againstVote, assetID];
};

const isOptedIn = async (receiver, algodClient) => {
    const proposalGlobalState = await readGlobalState(proposalID, algodClient);
    const assetID = Number(await proposalGlobalState.find((e) => {
      return e["key"] === "assetID";
    })["value"]);
    let accountInfo = await algodClient.accountInformation(receiver).do();
    const assets = accountInfo["assets"].find((asset) => {
      return asset["asset-id"] === assetID;
    });
    return typeof assets !== "undefined";
};

const sendTransaction = async (txns, client, connector, connection) => {
    if (connection == "algosigner") {
        return await wallets.sendAlgoSignerTransaction(txns, client);
    } else if (connection == "walletconnect") {
        return await wallets.sendWalletConnectTransaction(connector, txns, client);
    } else if (connection == "myalgo") {
        return await wallets.sendMyAlgoTransaction(txns, client);
    };
}

const purchaseToken = async (receiver, vote, network, connection, connector) => {
    const algodClient = getAlgodClient(network);
    const proposalGlobalState = await readGlobalState(proposalID, algodClient);
    const assetID = Number(await proposalGlobalState.find((e) => {
      return e["key"] === "assetID";
    })["value"]);

    const params = await algodClient.getTransactionParams().do();
    
    // Opt in contract
    const txnOptIn = algosdk.makeApplicationOptInTxnFromObject({
      from: receiver,
      suggestedParams: params,
      appIndex: proposalID,
      foreignAssets: [assetID],
    });

    await sendTransaction([txnOptIn], algodClient, connector, connection);

    const txnAppCall = algosdk.makeApplicationCallTxnFromObject({
      from: receiver,
      suggestedParams: params,
      appIndex: proposalID,
      appArgs: [new Uint8Array(Buffer.from(vote))],
      foreignAssets: [assetID],
    });

    let txns = [txnAppCall];

    // Buy tokens
    return await sendTransaction(txns, algodClient, connector, connection);
};

export {
    getExplorerURL,
    coinsLeft,
    purchaseToken,
};
