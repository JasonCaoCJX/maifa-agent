<script setup lang="ts">
import { ref, nextTick, onMounted, getCurrentInstance } from 'vue'
import { initGame } from '@/phaser';
import { AgentGame } from '@/agent'

const instance = getCurrentInstance()
const gameContainer = ref();
const agent = new AgentGame()

let start = false
let toast = ""
let canNext = true

onMounted(() => {
  nextTick(() => {
    const phaser = initGame(gameContainer)
  })
})

const nextStep = () => {
  window.eventBus.publish("V_2_A_NEXT_STEP")
  start = true
  canNext = false
  instance?.proxy?.$forceUpdate()
}

window.eventBus.subscribe("A_2_V_TOAST", (data: any) => {
  toast = data.msg
  instance?.proxy?.$forceUpdate()
  setTimeout(() => {
    toast = ""
    instance?.proxy?.$forceUpdate()
  }, data.duration)
})

window.eventBus.subscribe("A_2_V_CONTINUE", () => {
  canNext = true
  
  instance?.proxy?.$forceUpdate()
})

</script>

<template>
  <div ref="gameContainer" class="game"></div>
  <div class="toast" v-show="toast != ''">{{ toast }}</div>
  <div class="button" @click="nextStep" v-show="canNext">{{!start?'Run Agent':'Next Step'}}</div>
</template>

<style scoped>
.toast {
  width: 100%;
  height: 80px;
  background-color: rgba(0,0,0,0.8);
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 20px;
}
.button {
  width: 100px;
  height: 40px;
  background-color: rgba(0,0,0,0.8);
  color: #ffffff;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 20px;
  bottom: 20px;
}
</style>
