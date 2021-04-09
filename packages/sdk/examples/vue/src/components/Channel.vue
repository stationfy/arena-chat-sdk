<template>
  <div class="channel-wrapper">
    <div class="container">
      <div class="list-group-wrapper">
        <transition name="fade">
          <div class="loading" v-show="loading">
            <span class="fa fa-spinner fa-spin"></span> Loading...
          </div>
        </transition>
        <InfiniteScroll @loading="setLoading"></InfiniteScroll>
        <div class="input-chat">
          <div v-if="replying" class="reply-wrapper"> 
            <div class="reply" @click="cancelReply">Cancel Reply</div> 
          </div>
          <input v-model="myMessage" @input="changeMessage" />
          <button @click="send"> 
            <font-awesome-icon icon="paper-plane" color="#676E95" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from 'vuex';
import InfiniteScroll from './InfiniteScroll.vue';

export default {
  components: { InfiniteScroll },
  name: 'HelloWorld',
  data() {
    return {
      loading: false,
      myMessage: undefined
    }
  },
  computed: {
    ...mapState({
      arenaChat: state => {
        return state?.arenaChat;
      },
      liveChat: state => {
        return state?.liveChat;
      },
      currentChannel: state => {
        return state?.currentChannel;
      },
      messages: state => {
        return state?.messages;
      },
      replying: state => {
        return state?.replying;
      }
    })
  },
  methods: {
    ...mapActions(["getLiveChat", "loadMessages", "sendMessage"]),
    ...mapMutations(["setMessage", "setReply"]),
    async send() {
      this.sendMessage(
        {
          message: this.myMessage, 
          success: () => {
            this.myMessage = ''
            this.cancelReply();
          }
        }
      );
    },
    changeMessage() {
      this.setMessage(this.myMessage);
    },
    setLoading(val) {
      this.loading = val;
    },
    async cancelReply() {
      this.setReply({key: undefined, replying: false});
    },
  },
  created () {
    this.getLiveChat();
  },
}
</script>

<style scoped>
.channel-wrapper {
  height: 100%;
}
.container {
  background-color: #444267;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  max-width: 100%;
  position: relative;
}

.list-group-wrapper {
  position: absolute;
  z-index: 1;
  padding-top: 60px;
  width: 100%;
  height: Calc(100% - 160px);
  padding-bottom: 100px;
  top: 0px;
}
.loading {
  text-align: center;
  position: absolute;
  color: #fff;
  z-index: 9;
  background: #676E95;
  padding: 8px 18px;
  border-radius: 8px;
  left: calc(50% - 45px);
  top: calc(50% - 18px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-to {
  opacity: 0
}
.input-chat {
  padding: 5px;
  background: #444267;
  position: absolute;
  padding-top: 15px;
  border-radius: 8px;
  display: flex;
  border: 10px solid #444267;
  bottom: 0px;
  width: Calc(100% - 30px);
}

.input-chat input {
  width: Calc(100% - 110px);
  position: relative;
  display: flex;
  height: 30px;
  border-radius: 8px;
  margin-left: 0px;
  border: none;
  margin: 5px;
  font-size: 16px;
  padding: 5px 10px;
}
.input-chat button {
  position: relative;
  display: flex;
  border-radius: 8px;
  border: none;
  margin: auto;
  font-size: 16px;
  padding: 10px 15px;
  align-items: center;
  background: #A6ACCD;
  text-transform: uppercase;
  color: #292D3E;
  cursor: pointer;
}
.input-chat button:focus, .input-chat input:focus {
  outline: none;
}
.reply-wrapper{
  z-index: 2;
  position: absolute;
  top: -50px;
  width: Calc(100% - 26px);
  padding: 8px;
}
.reply {
  position: relative;
  background: rgba(68,66,103,.5);
  padding: 8px;
  border-radius: 8px;
  margin: 0px 15px;
  color: #b3bbe4;
  font-weight: bold;
  cursor: pointer;
}
</style>
