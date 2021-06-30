<template>
  <div class="side-menu">
    <div class="header">
      <div class="user-photo" v-if="logged">
        <img src="https://randomuser.me/api/portraits/women/21.jpg" />
      </div>
      <div class="menu">
        <font-awesome-icon icon="ellipsis-v" color="#676E95" />
      </div>
    </div>
    <div class="rooms"></div>
    <div v-for="(channel, indexChannel) in channels" :key="channel + indexChannel">
      <div class="button" @click="() => changeChannel(channel)">{{ channel.name }}</div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState, mapActions } from 'vuex';
export default {
  computed: {
    ...mapState({
      logged: state => {
        return state?.logged;
      },
      channels: state => {
        return state?.channels;
      },
    }),
  },
  methods: {
    ...mapActions(['getChannel', 'requestModeration']),
    ...mapMutations(['setQnaActive', 'setPollActive', 'setMessages']),
    changeChannel(channel) {
      this.setQnaActive(false);
      this.setPollActive(false);
      this.getChannel({ id: channel._id });
    },
    setQnA() {
      this.setMessages(undefined);
      this.setPollActive(false);
      this.setQnaActive(true);
    },
    setPoll() {
      this.setMessages(undefined);
      this.setQnaActive(false);
      this.setPollActive(true);
    },
  },
};
</script>

<style scoped>
.side-menu {
  height: 70px;
}
.header {
  display: flex;
  height: 100%;
  background: #202331;
  border-radius: 8px 0px 0px 8px;
  box-shadow: rgba(33, 35, 38, 0.1) 0px 10px 10px -10px;
  justify-content: space-between;
}
.user-photo {
  align-self: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  margin-left: 15px;
}
.user-photo img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.button {
  height: 50px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #676e95;
  padding-left: 20px;
  font-weight: bold;
}
.button:hover {
  background: #717cb470 !important;
  color: #ffffff !important;
  cursor: pointer;
}
.menu {
  display: flex;
  align-items: center;
  margin-right: 20px;
}
.menu svg {
  background: #676e95;
  padding: 5px;
  border-radius: 8px;
  color: #202331;
  cursor: pointer;
}
</style>
