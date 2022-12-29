<template>
    <div>
        <NavBar
            :sender="sender"
            :network="network"
            @setNetwork="setNetwork"
            @disconnectWallet="disconnectWallet"
            @connectMyAlgo="connectMyAlgo"
            @connectToAlgoSigner="connectToAlgoSigner"
            @connectToWalletConnect="connectToWalletConnect"
        />
        <div id="home" class="container-sm mt-5">
            <VoteForm
                v-if="this.sender !== ''"
                :connection="this.connection"
                :network="this.network"
                :connector="this.connector"
                :sender="this.sender"
            />
        </div>
    </div>
</template>

<script>
import VoteForm from "@/components/VoteForm.vue";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

export default {
    data() {
        return {
            connection: "",
            connector: null,
            network: "Localhost",
            sender: "", // connected account
        };
    },
    methods: {
        setNetwork(network) {
            this.disconnectWallet();
            this.network = network;
        },
        disconnectWallet() {
            this.connection = "";
            this.connector = null;
            this.sender = "";
        },
        async connectMyAlgo() {
            try {
                // force connection to TestNet
                this.network = "TestNet";
                const myAlgoWallet = new MyAlgoConnect();
                const accounts = await myAlgoWallet.connect();
                this.sender = accounts[0].address;
                this.connection = "myalgo";
            }
            catch (err) {
                console.error(err);
            }
        },
        async connectToAlgoSigner() {
            const AlgoSigner = window.AlgoSigner;
            if (typeof AlgoSigner !== "undefined") {
                await AlgoSigner.connect();
                const accounts = await AlgoSigner.accounts({
                    ledger: this.network,
                });
                if (this.network === "Localhost") {
                    // use non-creator address
                    this.sender = accounts[1].address;
                }
                else {
                    this.sender = accounts[0].address;
                }
                this.connection = "algosigner";
            }
        },
        async connectToWalletConnect() {
            // force connection to TestNet
            this.network = "TestNet";
            // Create a connector
            this.connector = new WalletConnect({
                bridge: "https://bridge.walletconnect.org",
                qrcodeModal: QRCodeModal,
            });
            // Kill existing session
            if (this.connector.connected) {
                await this.connector.killSession();
            }
            this.connector.createSession();
            // Subscribe to connection events
            this.connector.on("connect", (error, payload) => {
                if (error) {
                    throw error;
                }
                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.connection = "walletconnect";
            });
            this.connector.on("session_update", (error, payload) => {
                if (error) {
                    throw error;
                }
                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.connection = "walletconnect";
            });
            this.connector.on("disconnect", (error, payload) => {
                if (error) {
                    throw error;
                }
                // Delete connector
                console.log(payload);
                this.sender = "";
                this.connection = "";
            });
        },
    },
    components: { VoteForm }
};
</script>
