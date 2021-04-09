import Vue from 'vue'
import Vuex from 'vuex'
import ArenaChat from '@arena-im/chat-sdk';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    arenaChat: new ArenaChat('testnetlify'),
    liveChat: undefined,
    mainChannel: undefined,
    currentChannel: undefined,
    channels: undefined,
    messages: undefined,
    members: undefined,
    uid: undefined,
    message: undefined,
    replyKey: undefined,
    replying: false,
    isModerator: undefined,
    qnaInstance: undefined,
    pollInstance: undefined,
    qnas: undefined,
    polls: undefined,
    logged: false,
    qnaActive: false,
    pollActive: false,
    overlayActive: false,
  },
  mutations: {
    setLiveChat(state, chat) {
      state.liveChat = chat;
    },
    setMainChannel(state, mainChannel) {
      state.mainChannel = mainChannel;
    },
    setCurrentChannel(state, currentChannel) {
      state.currentChannel = currentChannel;
    },
    setChannels(state, channels) {
      state.channels = channels;
    },
    setMessages(state, messages) {
      state.messages = messages;
    },
    setMembers(state, members) {
      state.members = members;
    },
    setUID(state, uid) {
      state.uid = uid;
    },
    setMessage(state, message) {
      state.message = message;
    },
    setIsModerator(state, isModerator) {
      state.isModerator = isModerator;
    },
    setReply(state, {key, replying}) {
      if(replying) {
        state.replyKey = key;
        state.replying = replying;
      } else {
        state.replyKey = undefined;
        state.replying = replying;
      }
    },
    setPollInstance(state, pollInstance) {
      state.pollInstance = pollInstance
    },
    setQnAInstance(state, qnaInstance) {
      state.qnaInstance = qnaInstance
    },
    setPolls(state, polls) {
      state.polls = polls
    },
    setQnAs(state, qnas) {
      state.qnas = qnas
    },
    setLogged(state, logged) {
      state.logged = logged
    },
    setQnaActive(state, qnaActive) {
      state.qnaActive = qnaActive;
    },
    setPollActive(state, pollActive) {
      state.pollActive = pollActive;
    },
    toggleOverlay(state) {
      state.overlayActive = !state.overlayActive;
    }
  },
  actions: {
    async getLiveChat({state, commit, dispatch}) {  
      try {
        let data = await state.arenaChat.getLiveChat('ypqf');
        commit("setLiveChat", data)
      } catch (e) {
        console.error(e)
      } finally {
        dispatch("getMainChannel");
        dispatch("login");
      }
    },
    async getMainChannel({state, commit, dispatch}) {  
      try {
        let mainChannel = await state.liveChat.getMainChannel();
        let allChannels = await state.liveChat.getChannels();

        commit("setMainChannel", mainChannel)
        commit("setCurrentChannel", mainChannel)
        commit("setChannels", allChannels);
      } catch (e) {
        console.error(e)
      } finally {
        dispatch("loadMessages", {quantity: 20, success:() => {
          // mainChannel.onMessageReceived(() => {
          //   commit("setMesssages", [...state.messages, ...[message]]);
          // });
        }});
        dispatch("getQnA");
        dispatch("getPolls");
      }
    },
    async getChannel({ state, commit, dispatch }, {id}) {
      if(state.currentChannel) {
        state.currentChannel.offAllListeners();
        commit("setMesssages", undefined);
      }
      try {
        let currentChannel = await state.liveChat.getChannel(id);
        commit("setCurrentChannel", currentChannel);
      } catch(e) {
        console.error(e)
      } finally {
        dispatch("loadMessages", {quantity: 20, success: () => {
          // state.currentChannel.onMessageReceived((message) => {
          //   commit("setMesssages", [...state.messages, ...[message]]);
          // });
        }});
        dispatch("getQnA");
        dispatch("getPolls");
      }
    },
    async loadMessages({state, commit}, {quantity, success}) {  
      commit("setMessages", null);
      try {
        let data = await state.currentChannel.loadRecentMessages(quantity);
        commit("setMessages", data)
      } catch (e) {
        console.error(e)
      } finally {
        if(success) {
          success();
        }
      }
    },
    async loadPreviousMessages({state, commit}, {quantity}) {  
      try {
        let data = await state.currentChannel.loadPreviousMessages(quantity);
        commit("setMessages", [...state.messages, ...data]);
      } catch (e) {
        console.error(e)
      }
    },
    async getMembers({state, commit}) {
      try {
        let members = await state.liveChat.getMembers();
        commit("setMembers", members);
      } catch (e) {
        console.error(e)
      }
    },
    async login({state, commit}) {  
      try {
        let data = await state.arenaChat.setUser({
          // ID of the user on your authentication system
          id: "user-id",
          name: "Ruby Sims",
          image: "https://randomuser.me/api/portraits/women/21.jpg",
          // User metadata attached to the user object
          metaData: {
            'key1': 'value1',
            'key2': 'value2'
          }
        });
        commit("setUID", data.id);
        commit("setIsModerator", data.isModerator);
        commit("setLogged", true);
      } catch (e) {
        console.error(e)
      }
    },
    async sendMessage({state, dispatch}, { message, success }) {
      const messageBody = state.replying ? 
        {
          text: message, 
          replyTo: state.replyKey 
        } : 
        {
          text: message, 
        };
      try {
        await state.currentChannel.sendMessage(messageBody).then(() => {
          dispatch("loadMessages", {
            quantity: state.messages?.length + 1, 
            success: success()
          });
        })
      } catch(e) {
        console.error(e)
      }
      
    },
    async sendReaction({state, dispatch}, {reaction}){
      try {
        await state.currentChannel.sendReaction(reaction);
      } catch(e) {
        console.error(e);
      } finally {
        dispatch("loadMessages", {quantity: state.messages.length})
      }
    },
    async removeReaction({state, dispatch}, {reaction}){
      try {
        await state.currentChannel.deleteReaction(reaction);
      } catch(e) {
        console.error(e);
      } finally {
        dispatch("loadMessages", {quantity: state.messages.length})
      }
    },
    async requestModeration({state}){
      try {
        await state.currentChannel.requestModeration();
      } catch(e) {
        console.error(e);
      }
    },
    async removeMessage({state, dispatch}, {message}) {
      try {
        await state.currentChannel.deleteMessage(message);
      } catch (e) {
        console.error(e)
      } finally {
        dispatch("loadMessages", {quantity: state.messages.length})
      }
    },
    async getQnA({state, commit, dispatch}) {
      try {
        let data = await state.currentChannel.getChatQnaInstance();
        commit('setQnAInstance', data);
      } catch(e) {
        console.error(e);
      } finally {
        dispatch('loadQnA', {quantity: 50});
      }
    },
    async getPolls({state, commit, dispatch}) {
      try {
        let data = await state.currentChannel.getPollsIntance()

        commit('setPollInstance', data);
      } catch(e) {
        console.error(e);
      } finally {

        dispatch('loadPolls', {quantity: 50});
      }
    },
    async loadQnA({state, commit}, {quantity}) {
      try {
        let data = await state.qnaInstance.loadQuestions(quantity, 'recent');
        commit('setQnAs', data);
      } catch(e) {
        console.error(e);
      }
    },
    async loadPolls({state, commit}, {quantity}) {
      try {
        let data = await state.pollInstance.loadPolls('recent', quantity);
        commit('setPolls', data);
      } catch(e) {
        console.error(e);
      }
    },
    async addQuestion({state, dispatch}, {question , success}) {
      try {
        await state.qnaInstance.addQuestion(question);
      } catch(e) {
        console.error(e)
      } finally {
        success()
        dispatch("loadQnA", {quantity: 50})
      }
    }
  },
  modules: {
  }
})
