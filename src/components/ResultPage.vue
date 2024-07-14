<template>
    <div class="result-container">
      <h2 class="result-title">クイズ結果</h2>
      <div class="score-container">
        <svg class="circular-chart" viewBox="0 0 36 36">
          <path class="circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path class="circle"
            :stroke-dasharray="`${correctPercentage}, 100`"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="20.35" class="percentage">{{ correctPercentage }}%</text>
        </svg>
      </div>
      <p class="score-message">{{ scoreMessage }}</p>
      
      <div v-if="incorrectQuizzes.length > 0" class="incorrect-quizzes">
        <h3>間違えた問題の解説:</h3>
        <div v-for="quiz in incorrectQuizzes" :key="quiz.question" class="incorrect-quiz">
          <h4>{{ quiz.question }}</h4>
          <p class="answer">正解: {{ quiz.options[quiz.correctAnswer] }}</p>
          <p class="answer">あなたの回答: {{ quiz.options[quiz.userAnswer] }}</p>
          <p v-if="quiz.explanation" class="explanation">解説: {{ quiz.explanation }}</p>
        </div>
      </div>
      
      <van-button type="primary" @click="goToHome" class="home-button">ホームに戻る</van-button>
      
      <div v-if="correctPercentage === 100" class="confetti-container">
        <div v-for="n in 50" :key="n" class="confetti" :style="confettiStyle(n)"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, inject } from "vue";
  
  const { quizResults, goBack } = inject("appContext");
  
  const correctPercentage = computed(() => {
    const totalQuizzes = quizResults.value.length;
    const correctAnswers = quizResults.value.filter((result) => result.isCorrect).length;
    return Math.round((correctAnswers / totalQuizzes) * 100);
  });
  
  const scoreMessage = computed(() => {
    if (correctPercentage.value === 100) return "パーフェクト！素晴らしい！";
    if (correctPercentage.value >= 80) return "すごい！よくできました！";
    if (correctPercentage.value >= 60) return "いい調子です！";
    return "次はもっと頑張りましょう！";
  });
  
  const incorrectQuizzes = computed(() => {
    return quizResults.value.filter((result) => !result.isCorrect);
  });
  
  const goToHome = () => {
    goBack();
  };
  
  const confettiStyle = (n) => {
    const rand = Math.random;
    return {
      '--x': `${rand() * 100}%`,
      '--y': `${-20 - rand() * 100}%`,
      '--rotate': `${rand() * 360}deg`,
      '--speed': `${5 + rand() * 10}s`,
      '--delay': `${-1 - rand() * 2}s`,
      '--color': `hsl(${210 + rand() * 50}, ${70 + rand() * 30}%, ${70 + rand() * 30}%)`,
    };
  };
  </script>
  
  <style scoped>
  .result-container {
    padding: 20px;
    text-align: center;
    background-color: #f0f8ff;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }
  
  .result-title {
    color: #3498db;
    font-size: 2.5em;
    margin-bottom: 20px;
  }
  
  .score-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .circular-chart {
    width: 150px;
    height: 150px;
  }
  
  .circle-bg {
    fill: none;
    stroke: #eee;
    stroke-width: 3.8;
  }
  
  .circle {
    fill: none;
    stroke: #3498db;
    stroke-width: 2.8;
    stroke-linecap: round;
    animation: progress 0.7s ease-out forwards;
  }
  
  .percentage {
    fill: #3498db;
    font-size: 0.5em;
    text-anchor: middle;
    font-weight: bold;
  }
  
  @keyframes progress {
    0% {
      stroke-dasharray: 0 100;
    }
  }
  
  .score-message {
    font-size: 1.5em;
    color: #2c3e50;
    margin-bottom: 30px;
  }
  
  .incorrect-quizzes {
    text-align: left;
    margin-top: 30px;
  }
  
  .incorrect-quiz {
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .incorrect-quiz h4 {
    color: #3498db;
    margin-bottom: 10px;
  }
  
  .answer {
    color: #2c3e50;
  }
  
  .explanation {
    font-style: italic;
    margin-top: 10px;
    color: #7f8c8d;
  }
  
  .home-button {
    margin-top: 30px;
    font-size: 1.2em;
    padding: 10px 30px;
  }
  
  .confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: var(--color);
    top: var(--y);
    left: var(--x);
    transform: rotate(var(--rotate));
    animation: fall var(--speed) var(--delay) linear infinite;
  }
  
  @keyframes fall {
    to {
      transform: translateY(100vh) rotate(calc(var(--rotate) + 360deg));
    }
  }
  </style>