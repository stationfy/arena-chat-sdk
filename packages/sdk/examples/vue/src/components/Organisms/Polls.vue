<template>
  <div style="height: 100%">
    <div  class="qna-content">
      <div v-for="(poll, indexPoll) in polls" :key="poll+indexPoll" class="question-wrapper">
        <div class="question">
          <div class="title">{{poll.question}}</div>
            <div class="options-wrapper">
              <div v-for="(option, indexOption) in poll.options" :key="option+indexOption">
                <div 
                  class="option" 
                  :class="canVote(poll) ? 'active-option' : ''" 
                  @click="() => vote(indexOption, poll)"
                >
                  <div>
                    {{option.name}} 
                  </div>
                  <div>
                    {{option.total}}
                  </div> 
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      question: ''
    }
  },
  computed: {
    ...mapState({
      polls: state => {
        state?.polls.map( poll => {
          (poll)
          if(typeof poll?.options == 'object'){
            let newOptions = [];
            Object.entries(poll?.options).map((value) => {
              newOptions[value[0]] = value[1];
            })
            poll.options = newOptions;
          }
          return poll
        })
        return state?.polls;
      },
      pollInstance: state => {
        return state?.pollInstance;
      }
    }),
  },
  methods: {
    async vote(index, poll) {
      if(!poll.currentUserVote) {
        await this.pollInstance.pollVote(
          poll._id,
          index
        )
      }
    },
    canVote(poll) {
      let canVote = true;

      if(new Date() >= new Date(poll.expireAt)) {
        canVote = false
      }
      if(poll.currentUserVote != undefined) {
        canVote = false        
      }
      return canVote;
    }
  },
}
</script>

<style scoped>
.qna-content {
  background: #A6ACCD;
  padding-top: 90px;
  height: Calc(100% - 190px);
  position: absolute;
  top: 0px;
  width: 100%;
  padding-bottom: 100px;
  border-radius: 8px;
}
.qna-input {
  padding: 5px;
  position: absolute;
  background: #444267;
  bottom: 0px;
  padding-top: 15px;
  border-radius: 8px 8px 8px 0px;
  display: flex;
  width: Calc(100% - 30px);
  border: 10px solid #444267;
}
.qna-input input {
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
.qna-input button {
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
.qna-input button:focus, .qna-input input:focus {
  outline: none;
}
.question-wrapper {
  position: relative;
  width: 50%;
}
.question {
  margin-top: 1px;
  margin: 10px;
  position: relative;
  background: #292D3E;
  border-radius: 0px 8px 8px 8px;
  color: #A6ACCD;
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
  cursor: pointer
}
</style>
<style>
</style>