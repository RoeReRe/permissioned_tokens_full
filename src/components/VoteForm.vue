<template>
    <div id="voteproposal" class="mb-5">
        <h3>{{ this.title }}</h3>
        <p>{{ this.desc }}</p>
        <div
            v-if="this.acsTxId !== ''"
            class="alert alert-success"
            role="alert"
        >
            Txn Ref:
            <a :href="explorerURL" target="_blank">{{ this.acsTxId }}</a>
        </div>
        <p>For: {{ this.forVote }}</p>
        <p>Against: {{ this.againstVote }}</p>
        <form
            action="#"
            @submit.prevent="handleVote"
        >
            <div class="d-flex">
                <div class="dropdown">
                    <button
                        class="btn btn-secondary dropdown-toggle me-2"
                        type="button"
                        id="voteBtn"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        {{ this.vote }}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="voteBtn">
                        <li><button @click="handleSetVote('For')" class="dropdown-item" type="button">For</button></li>
                        <li><button @click="handleSetVote('Against')" class="dropdown-item" type="button">Against</button></li>
                    </ul>
                </div>
                <div><button type="submit" class="btn btn-primary">Vote</button></div>
            </div>
        </form>
    </div>
</template>

<script>
import * as helpers from '../helpers';

export default {
    props: {
        connection: String,
        network: String,
        sender: String,
        connector: Object,
    },
    data() {
        return {
            acsTxId: "",
            explorerURL: "",
            title: "",
            desc: "",
            forVote: 0,
            againstVote: 0,
            vote: "Select Vote"
        };
    },
    methods: {
        async updateTxn(value) {
            this.acsTxId = value;
            this.explorerURL = helpers.getExplorerURL(this.acsTxId, this.network);
            await this.updateState();
        },
        async handleSetVote(value) {
            this.vote = value;
        },
        async handleVote() {
            // write code here
            const tx = await helpers.purchaseToken(this.sender,
                                                this.vote,
                                                this.network,
                                                this.connection,
                                                this.connector,
                                                );

            if (tx.txId != "") {this.updateTxn(tx.txId);}
        },
        async updateState() {
            const info = await helpers.coinsLeft(this.network);
            this.title = info[0];
            this.desc = info[1];
            this.forVote = info[2];
            this.againstVote = info[3];
        }
    },
    async mounted() {  
        await this.updateState();
    }
};
</script>
