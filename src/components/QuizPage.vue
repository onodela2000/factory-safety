```vue
<template>
  <div class="quiz-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="gears">
          <svg class="gear-icon large" viewBox="0 0 24 24">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
          </svg>
          <svg class="gear-icon small" viewBox="0 0 24 24">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
          </svg>
        </div>
        <span>Loading...</span>
      </div>
    </div>
    <div v-show="!isLoading" class="quiz-content">
      <div
        v-if="alertMessage"
        :class="[
          'alert',
          alertType === 'success' ? 'alert-success' : 'alert-error',
        ]"
      >
        {{ alertMessage }}
      </div>
      <div class="quiz-scroll-content">
        <img
          v-if="currentQuiz.imageUrl"
          :src="currentQuiz.imageUrl"
          alt="Quiz Image"
          class="quiz-image"
        />
        <h2 class="quiz-question">{{ currentQuiz.question }}</h2>
        <van-radio-group v-model="selectedAnswer">
          <van-cell-group inset>
            <van-cell
              v-for="(option, index) in currentQuiz.options"
              :key="index"
              :title="option"
              clickable
              @click="selectedAnswer = index"
            >
              <template #right-icon>
                <van-radio :name="index" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
      </div>
      <div class="quiz-button-container">
        <van-button 
          type="primary" 
          block 
          @click="submitAnswer" 
          square 
          :disabled="selectedAnswer === null" 
          style="height: 70px;"
        >
          回答する
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, computed } from "vue";

const { quizzes, navigateTo, setQuizResults } = inject("appContext");

const currentQuizIndex = ref(0);
const selectedAnswer = ref(null);
const alertMessage = ref("");
const alertType = ref("");
const isLoading = ref(true);
const quizResults = ref([]);

const currentQuiz = computed(() => quizzes.value[currentQuizIndex.value]);

const preloadImages = async () => {
  const imagePromises = quizzes.value
    .filter((quiz) => quiz.imageUrl)
    .map((quiz) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = quiz.imageUrl;
      });
    });

  await Promise.all(imagePromises);
};

onMounted(async () => {
  await preloadImages();
  setTimeout(() => {
    isLoading.value = false;
  }, 3000);
});

const showAlert = (message, type) => {
  alertMessage.value = message;
  alertType.value = type;
  setTimeout(() => {
    alertMessage.value = "";
    alertType.value = "";
  }, 3000);
};

const submitAnswer = () => {
  const isCorrect = selectedAnswer.value === currentQuiz.value.correctAnswer;
  quizResults.value.push({
    ...currentQuiz.value,
    userAnswer: selectedAnswer.value,
    isCorrect,
  });

  currentQuizIndex.value++;
  if (currentQuizIndex.value < quizzes.value.length) {
    selectedAnswer.value = null;
  } else {
    setTimeout(() => {
      setQuizResults(quizResults.value);
      navigateTo("リザルト");
    }, 0);
  }
};
</script>

<style scoped>
.quiz-container {
  position: relative;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #3498db;
  font-size: 1.4em;
}

.gears {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
}

.gear-icon {
  position: absolute;
  fill: #3498db;
}

.gear-icon.large {
  width: 80px;
  height: 80px;
  animation: rotate 4s linear infinite;
  left: 0;
  top: 0;
}

.gear-icon.small {
  width: 40px;
  height: 40px;
  animation: rotate-reverse 3s linear infinite;
  right: 0;
  bottom: 0;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rotate-reverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

.quiz-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.quiz-scroll-content {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.quiz-button-container {
  background-color: white;
}

.quiz-question {
  font-size: 1.2em;
  margin: 0 15px 15px 15px;
}

.alert {
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
}

.alert-success {
  background-color: #4caf50;
}

.alert-error {
  background-color: #f44336;
}

.quiz-image {
  width: 100%;
  height: auto;
  margin-bottom: 15px;
}
</style>
```