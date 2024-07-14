<template>
  <div id="app">
    <div class="page-container">
      <home-page v-show="currentPage === 'ホーム'"></home-page>
    </div>
    <transition name="overlay" @after-leave="afterLeave">
      <div v-if="showOverlay" class="overlay-page">
        <van-nav-bar
          :title="currentPage"
          left-text="戻る"
          left-arrow
          @click-left="goBack"
          class="fixed-header"
        />
        <div class="overlay-content">
          <component :is="currentPageComponent"></component>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent, provide } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

import HomePage from './components/HomePage.vue'
const QuizPage = defineAsyncComponent(() => import('./components/QuizPage.vue'))
const ManualPage = defineAsyncComponent(() => import('./components/ManualPage.vue'))
const ResultPage = defineAsyncComponent(() => import('./components/ResultPage.vue'))

const currentPage = ref('ホーム')
const showOverlay = ref(false)
const quizzes = ref([])
const quizResults = ref([])

const currentPageComponent = computed(() => {
  switch (currentPage.value) {
    case 'クイズ': return QuizPage
    case 'マニュアル': return ManualPage
    case 'リザルト': return ResultPage
    default: return null
  }
})

onMounted(async () => {
  await fetchQuizzes()
})

const fetchQuizzes = async () => {
  const querySnapshot = await getDocs(collection(db, 'quizzes'))
  const fetchedQuizzes = []
  for (const doc of querySnapshot.docs) {
    const quiz = doc.data()
    if (quiz.imageRef) {
      const imageUrl = await getDownloadURL(storageRef(storage, quiz.imageRef))
      quiz.imageUrl = imageUrl
    }
    fetchedQuizzes.push(quiz)
  }
  quizzes.value = fetchedQuizzes
}

const navigateTo = (page) => {
  currentPage.value = page
  showOverlay.value = true
}

const goBack = () => {
  showOverlay.value = false
  currentPage.value = 'ホーム'
}

const setQuizResults = (results) => {
  quizResults.value = results
}

const appContext = {
  navigateTo,
  goBack,
  quizzes,
  quizResults,
  setQuizResults,
  currentPage
}

provide('appContext', appContext)
</script>

<style scoped>
#app {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
}

.page-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.overlay-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.fixed-header {
  flex-shrink: 0;
}

.overlay-content {
  flex-grow: 1;
  overflow-y: auto;
  height: calc(100% - 46px); /* Subtract nav bar height */
}

.overlay-enter-active,
.overlay-leave-active {
  transition: transform 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  transform: translateX(100%);
}
</style>