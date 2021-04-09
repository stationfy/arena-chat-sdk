<template>
  <div style="height: 100%">
    <div  class="qna-content">
      <div v-for="(qna, indexQna) in qnas" :key="qna+indexQna" class="question-wrapper">
        <div class="question">
          <div v-html="qna.text" />
          <font-awesome-icon icon="reply" color="#676E95" />
        </div>
      </div>
    </div>
    <div class="qna-input">
      <input v-model="question" />
      <button @click="sendQuestion"> 
        <font-awesome-icon icon="paper-plane" color="#676E95" />
      </button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
export default {
  data() {
    return {
      question: ''
    }
  },
  computed: {
    ...mapState({
      qnas: state => {
        return state.qnas;
      }
    })
  },
  methods: {
    ...mapActions(["addQuestion"]),
    sendQuestion() {
      this.addQuestion({
        question: this.question,
        success: () => {
          this.question = ''
        }
      });
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
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
}
.question svg {
  font-size: 10px;
  display: flex;
  align-self: flex-end;
  cursor: pointer;
}
</style>
<style>
</style>