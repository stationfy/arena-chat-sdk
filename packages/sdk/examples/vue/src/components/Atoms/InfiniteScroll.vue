<template>
  <div class="list-group" id="infinite-list">
    <div
      :style="replying ? 'transform: translate(0px, 0px);' : ''"
      v-for="(message, indexMessage) in messages"
      :key="message + indexMessage"
      class="list-group-item-wrapper"
      :class="message.uid ? 'my-message-wrapper' : ''"
    >
      <div v-if="isModerator && message.uid === uid" class="mod-me">
        Mod
      </div>
      <div v-if="message.sender.moderator == true && message.uid !== uid" class="mod">
        Mod
      </div>
      <div
        class="list-group-item"
        :class="message.uid ? 'my-message' : ''"
        v-if="!message.poll"
        @click="() => replyTo(message, true)"
      >
        <div v-if="message.replyMessage" class="replied-message-wrapper">
          <div class="replied-message">
            <div class="from">{{ message.replyMessage.sender.displayName }}</div>
            <div
              v-html="
                message.replyMessage.message.text
                  ? message.replyMessage.message.text
                  : message.replyMessage.message.media.html
              "
              @click="() => replyTo(message, true)"
              class="message"
              :class="message.replyMessage.message.media.html ? 'media-message' : ''"
            ></div>
          </div>
        </div>
        <div class="like-own-message" v-if="message.uid" @click="() => like(message)">
          <font-awesome-icon icon="heart" :color="message.currentUserReactions ? 'red' : 'darkgrey'" />
        </div>
        <div class="remove-own-message" v-if="isModerator && message.uid" @click="() => remove(message.message)">
          <font-awesome-icon icon="trash" color="darkgrey" />
        </div>
        <div v-html="message.text" class="message" :class="message.isMedia ? 'media-message' : ''"></div>
        <div class="remove-message" v-if="!message.uid && isModerator" @click="() => remove(message.message)">
          <font-awesome-icon icon="trash" color="darkgrey" />
        </div>
        <div v-if="!message.uid" class="like-message" @click="() => like(message)">
          <font-awesome-icon icon="heart" :color="message.currentUserReactions ? 'red' : 'darkgrey'" />
        </div>
        <div
          v-if="replyKey === message.key"
          :class="message.uid ? 'cancel-my-reply' : 'cancel-reply'"
          @click="() => replyTo(message, false)"
        >
          Replying
        </div>
      </div>
      <div class="question" v-else>
        <div class="title">{{ message.poll.question }}</div>
        <div class="options-wrapper">
          <div v-for="(option, indexOption) in message.poll.options" :key="option + indexOption">
            <div class="option">
              <div>
                {{ option.name }}
              </div>
              <div>
                {{ option.total }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from 'vuex';
export default {
  data() {
    return {
      firstLoad: true,
    };
  },
  computed: {
    ...mapState({
      messages: state => {
        return state?.messages
          ?.sort(function(a, b) {
            return a.createdAt - b.createdAt;
          })
          .map(message => {
            let currentMessage = {};
            if (message?.sender?.uid === state?.uid) {
              currentMessage.uid = state?.uid;
            }
            if (message?.message?.media) {
              currentMessage.text = message?.message?.media?.html;
              currentMessage.isMedia = true;
            } else {
              currentMessage.text = message?.message?.text;
              currentMessage.isMedia = false;
            }
            if (message?.poll) {
              currentMessage.poll = message?.poll;
            }
            currentMessage.key = message.key;
            currentMessage.message = message;
            currentMessage.sender = message?.sender;
            currentMessage.currentUserReactions = message.currentUserReactions;
            currentMessage.replyMessage = message.replyMessage;
            return currentMessage;
          });
      },
      uid: state => {
        return state?.uid;
      },
      isModerator: state => {
        return state?.isModerator;
      },
      replying: state => {
        return state?.replying;
      },
      replyKey: state => {
        return state?.replyKey;
      },
    }),
  },
  methods: {
    ...mapMutations(['setReply', 'setMessages']),
    ...mapActions(['sendReaction', 'removeReaction', 'removeMessage', 'loadPreviousMessages']),
    load() {
      this.setMessages(null);
      this.loadPreviousMessages({ quantity: 10 });
    },
    loadMore() {
      this.$emit('loading', true);
      setTimeout(() => {
        this.load();
        this.$emit('loading', false);
      }, 200);
      if (!this.firstLoad) {
        const listElm = document.querySelector('#infinite-list');
        listElm.scrollTop = 200;
      }
    },
    scrollBottom() {
      const listElm = document.querySelector('#infinite-list');
      listElm.scrollTop = listElm.scrollHeight;
      // this.firstLoad = false
    },
    async replyTo(message, reply) {
      this.setReply({ key: message.key, replying: reply });
    },
    like(message) {
      const reaction = {
        type: 'like',
        messageID: message.key,
      };
      if (message.currentUserReactions) {
        this.removeReaction({ reaction });
      } else {
        this.sendReaction({ reaction });
      }
    },
    remove(message) {
      message;
      this.removeMessage({ message });
    },
  },
  mounted() {
    const listElm = document.querySelector('#infinite-list');
    listElm.addEventListener('scroll', () => {
      if (listElm.scrollTop === 0) {
        this.loadMore();
      }
    });
    this.loadMore();
  },
  watch: {
    messages(val) {
      if (val) {
        setTimeout(() => {
          if (this.firstLoad) {
            this.scrollBottom();
          }
        }, 200);
      }
    },
  },
};
</script>

<style scoped>
.list-group {
  overflow: auto;
  border-radius: 0px 0px 8px 8px;
  background: #a6accd;
  border: 10px solid #a6accd;
  height: Calc(100% - 20px);
  padding-top: 20px;
}
.list-group-item-wrapper {
  position: relative;
  width: 50%;
}
.list-group-item {
  margin-top: 1px;
  margin: 10px;
  position: relative;
  background: #292d3e;
  border-radius: 0px 8px 8px 8px;
  color: #a6accd;
  text-align: start;
  box-shadow: 2px 3px 2px 1px #292d3efa;
  display: flex;
  justify-content: space-between;
}
.list-group-item > div {
  padding: 5px 8px;
}
.my-message {
  margin-left: auto;
  border-radius: 8px 0px 8px 8px;
  display: flex;
  flex-direction: column;
  background: #676e95;
  color: #292d3e;
  box-shadow: 2px 3px 2px 1px #676e95fa;
}
.my-message-wrapper {
  margin-left: auto;
}
.list-group-item blockquote {
  margin: 10px;
}
.cancel-reply {
  position: absolute;
  background: rgba(68, 66, 103, 0.5);
  padding: 8px;
  border-radius: 8px;
  color: #b3bbe4;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  box-shadow: 2px 3px 2px 1px rgba(68, 66, 103, 0.5);
  justify-content: flex-end;
  padding-top: 9px;
  top: 0px;
  right: -70px;
  z-index: -1;
  height: 15px;
  padding-left: 22px !important;
}
.cancel-my-reply {
  position: absolute;
  background: rgba(68, 66, 103, 0.5);
  padding: 8px;
  border-radius: 8px;
  color: #b3bbe4;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  box-shadow: 2px 3px 2px 1px rgba(68, 66, 103, 0.5);
  justify-content: flex-end;
  padding-top: 9px;
  top: 0px;
  left: -70px;
  z-index: -1;
  height: 15px;
  padding-right: 22px !important;
}
.replied-message-wrapper {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px 0px 8px 8px;
  color: white;
}

.replied-message {
  border-left: 1px solid pink;
  padding-left: 10px;
}
.replied-message .from {
  color: pink;
}
.like-message {
  font-size: 9px;
  position: absolute;
  bottom: 0px;
  right: 0px;
  cursor: pointer;
}
.remove-message {
  font-size: 9px;
  position: absolute;
  bottom: 0px;
  right: 15px;
  cursor: pointer;
}
.like-own-message {
  font-size: 9px;
  position: absolute;
  bottom: 0px;
  left: 0px;
  cursor: pointer;
}
.remove-own-message {
  font-size: 9px;
  position: absolute;
  bottom: 0px;
  left: 15px;
  cursor: pointer;
}
.my-message .message {
  margin-left: auto;
}
.my-message .media-message {
  width: 90% !important;
  margin-left: auto;
  margin-top: 5px;
}
.media-message {
  width: 90% !important;
  margin-right: auto;
  margin-top: 5px;
}
.mod-me {
  width: fit-content;
  margin-left: auto;
  margin-right: 10px;
  text-transform: uppercase;
  padding: 5px;
  background: #292d3e;
  border-radius: 8px;
  color: #a6accd;
  font-weight: bold;
  box-shadow: 2px 3px 2px 1px #292d3efa;
  margin-bottom: -3px;
}
.mod {
  width: fit-content;
  margin-right: auto;
  margin-left: 10px;
  text-transform: uppercase;
  padding: 5px;
  background: #676e95;
  border-radius: 8px;
  color: #292d3e;
  font-weight: bold;
  box-shadow: 2px 3px 2px 1px #676e95fa;
  margin-bottom: -3px;
}
.question {
  margin-top: 1px;
  margin: 10px;
  position: relative;
  background: #292d3e;
  border-radius: 0px 8px 8px 8px;
  color: #a6accd;
  text-align: start;
  box-shadow: 2px 3px 2px 1px #292d3efa;
  padding: 5px 8px;
}
.options-wrapper {
  margin-top: 20px;
}
.title {
  margin-left: 10px;
  margin-top: 10px;
  font-size: 20px;
  font-weight: bold;
}
.option {
  padding: 8px;
  display: flex;
  justify-content: center;
  margin: 5px;
  place-content: space-between;
  padding: 8px 25px;
}
.active-option {
  background: rebeccapurple;
  border-radius: 8px;
  cursor: pointer;
}
</style>
<style>
.media-message iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}
.list-group-item a {
  color: #89ddff !important;
  text-transform: none;
}
</style>
