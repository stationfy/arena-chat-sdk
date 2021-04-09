<template>
  <div class="chat-wrapper">
    <div class="chat">
      <div class="side-menu-wrapper">
       <SideMenu />
      </div>
      <div class="content-chat">
        <div class="menu-icon">
          <font-awesome-icon icon="ellipsis-v" color="#676E95" @click="() => toggle()"/>
          <div class="menu-channel" v-if="overlayActive">
            <div class="button" @click="setQnA">
              Q&A        
            </div>
            <div class="button" @click="setPoll">
              Polls       
            </div>
          </div>
        </div>
        <Channel v-if="!qnaActive && !pollActive" />
        <QnA v-else-if="qnaActive && !pollActive" />
        <Polls v-else-if="!qnaActive && pollActive" />
      </div>
    </div>
    <div class="overlay" v-if="overlayActive" @click="() => toggle()"></div>
  </div>
</template>

<script>
import Channel from '@/components/Channel.vue'
import QnA from '@/components/QnA.vue'
import Polls from '@/components/Organisms/Polls.vue'
import SideMenu from '@/components/Molecules/SideMenu.vue'
import { mapState, mapMutations } from 'vuex'

export default {
  name: 'Home',
  components: {
    SideMenu,
    Channel,
    QnA,
    Polls
  },
  data() {
    return {
      channelMenuActive: false
    }
  },
  computed: {
    ...mapState({
      channels: state => {
        return state?.channels;
      },
      members: state => {
        return state?.members;
      },
      qnaActive: state => {
        return state?.qnaActive;
      },
      pollActive: state => {
        return state?.pollActive;
      },
      overlayActive: state => {
        return state.overlayActive;
      }
    })
  },
  methods: {
    ...mapMutations(["setQnaActive", "setPollActive", "setMessages", "toggleOverlay"]),
    setQnA() {
      this.setMessages(undefined);
      this.setPollActive(false)
      this.setQnaActive(true)
    },
    setPoll() {
      this.setMessages(undefined);
      this.setQnaActive(false)
      this.setPollActive(true)
    },
    toggle() {
      this.toggleOverlay();
    }
  },
}
</script>
<style >
.members-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 200px;
  overflow: auto;
  width: 30%;
}
.chat-wrapper {
  height: -webkit-fill-available;
  width: auto;
  position: relative;
  padding: 20px;
  box-shadow: rgb(17 17 26 / 10%) 0px 4px 16px, rgb(17 17 26 / 10%) 0px 8px 24px, rgb(17 17 26 / 10%) 0px 16px 56px;
}
.chat {
  position: relative;
  display: grid;
  grid-template-columns: 20% 80%;
  width: 85%;
  margin: auto;
  height: 100%;
  background: #444267;
  border-radius: 8px;
  box-shadow: rgba(17, 17, 26, .10) 0px 4px 16px, rgba(17, 17, 26, .10) 0px 8px 24px, rgba(17, 17, 26, .10) 0px 16px 56px;
}
.content-chat {
  position: relative;
}
.menu-icon {
  position: absolute;
  z-index: 2;
  background: #414863;
  width: 100%;
  height: 70px;
  border-radius: 0px 8px 8px 0px;
}
.side-menu-wrapper {
  background: #34324a;
  border-radius: 8px;
  box-shadow: rgb(17 17 26 / 10%) 0px 4px 16px, rgb(17 17 26 / 10%) 0px 8px 24px, rgb(17 17 26 / 10%) 0px 16px 56px;
}
.menu-icon {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.menu-icon svg {
  padding: 5px;
  border-radius: 8px;
  color: #202332;
  margin-right: 20px;
  cursor: pointer;
}
.menu-channel {
  background: #717CB4;
  padding: 10px;
  position: absolute;
  bottom: -60px;
  right: 20px;
  width: 100px;
  border-radius: 8px;
}
.menu-channel .button {
  background: #202331;
  padding: 5px;
  border-radius: 8px;
  color: #717CB4;
  text-align: inherit;
}
.overlay {
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
}
.button {
  cursor: pointer;
  margin: 5px 0px;
}
</style>
