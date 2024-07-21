```vue
<template>
  <div
    class="home-content"
    @touchstart="touchStart"
    @touchmove="touchMove"
    @touchend="touchEnd"
  >
    <div
      class="pull-to-refresh"
      :style="{ transform: `translateY(${pullDistance}px)` }"
    >
      <svg
        class="refresh-icon"
        viewBox="0 0 24 24"
        :style="{ transform: `rotate(${rotationAngle}deg)` }"
      >
        <path
          d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
      </svg>
      <span>{{ refreshText }}</span>
    </div>
    <h1 style="text-align: center; color: #2c3e50">工場安全教育アプリ</h1>
    <div class="robot-container">
      <div class="robot-character" ref="robotCharacter" @click="greet">
        <div class="head">
          <div class="helmet"></div>
          <div class="face">
            <div class="eye left"></div>
            <div class="eye right"></div>
            <div class="mouth"></div>
          </div>
        </div>
        <div class="body">
          <div class="arm left"></div>
          <div class="arm right"></div>
        </div>
        <div class="speech-bubble" v-if="showSpeechBubble">
          {{ speechText }}
        </div>
      </div>
    </div>
    <div class="home-buttons">
      <van-button
        type="primary"
        size="large"
        style="width: 300px"
        @click="navigateTo('クイズ')"
        >クイズ</van-button
      >
      <van-button
        type="info"
        size="large"
        style="width: 300px"
        @click="navigateTo('マニュアル')"
        >マニュアル</van-button
      >
    </div>
    <button
      v-if="!isMobile"
      class="reload-button"
      @click="reloadPage"
      aria-label="ページをリロード"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path
          d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        ></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { inject, onMounted, ref, computed } from "vue";
import { useOnline, useWindowSize } from "@vueuse/core";

const { navigateTo } = inject("appContext");
const robotCharacter = ref(null);
const showSpeechBubble = ref(false);
const speechText = ref("");
const isOnline = useOnline();
const { width } = useWindowSize();

const isMobile = computed(() => width.value < 768);

const isPulling = ref(false);
const isRefreshing = ref(false);
const pullDistance = ref(-70);
const rotationAngle = ref(0);
const refreshText = ref("下にスワイプして更新");
let startY = -70;
let startX = 0;
const pullThreshold = 1;

const greetings = [
  "安全第一！",
  "一緒に学びましょう！",
  "工場の安全、大切です！",
  "質問があればどうぞ！",
  "今日も安全な一日を！",
];

const greet = () => {
  speechText.value = greetings[Math.floor(Math.random() * greetings.length)];
  showSpeechBubble.value = true;
  setTimeout(() => {
    showSpeechBubble.value = false;
  }, 3000);
};

const reloadPage = () => {
  if (isOnline.value) {
    window.location.reload();
  } else {
    alert("オフラインです。インターネット接続を確認してください。");
  }
};

const touchStart = (e) => {
  if (isMobile.value && window.scrollY === 0) {
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
  }
};

const touchMove = (e) => {
  if (isMobile.value && !isRefreshing.value && window.scrollY === 0) {
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY;
    const diffX = Math.abs(currentX - startX);

    // 縦方向のスワイプのみに反応
    if (diffY > 0 && diffY > diffX) {
      e.preventDefault();
      pullDistance.value = Math.min(diffY / 2, pullThreshold);
      rotationAngle.value = pullDistance.value * 3; // アイコンの回転

      if (pullDistance.value >= pullThreshold) {
        refreshText.value = "指を離して更新";
      } else {
        refreshText.value = "下にスワイプして更新";
      }
    }
  }
};

const touchEnd = () => {
  if (isMobile.value && pullDistance.value > 0) {
    if (pullDistance.value >= pullThreshold) {
      isRefreshing.value = true;
      refreshText.value = "更新中...";
      rotationAngle.value = 30;

      // Rotate the refresh icon for 2 seconds before reloading the page
      const rotateInterval = setInterval(() => {
        rotationAngle.value += 30;
      }, 100);

      setTimeout(() => {
        if (isOnline.value) {
          clearInterval(rotateInterval);
          window.location.reload();
        } else {
          refreshText.value = "インターネット接続を確認してください。";
          setTimeout(() => {
            pullDistance.value = -70;
          }, 1500);
        }
      }, 1500);
    }
  }
};

onMounted(() => {
  const robot = robotCharacter.value;
  let lastTouchY = 0;

  const handleMouseMove = (e) => {
    if (robot) {
      const rect = robot.getBoundingClientRect();
      const robotCenterX = rect.left + rect.width / 2;
      const robotCenterY = rect.top + rect.height / 2;
      const angleRad = Math.atan2(
        e.clientY - robotCenterY,
        e.clientX - robotCenterX
      );
      const angleDeg = angleRad * (180 / Math.PI);
      robot.style.setProperty("--eye-rotation", `${angleDeg}deg`);
    }
  };

  const handleTouchMove = (e) => {
    if (robot && e.touches[0]) {
      const touch = e.touches[0];
      const deltaY = touch.clientY - lastTouchY;
      lastTouchY = touch.clientY;

      let currentTilt = parseFloat(
        robot.style.getPropertyValue("--robot-tilt") || "0"
      );
      currentTilt += deltaY * 0.1;
      currentTilt = Math.max(-20, Math.min(20, currentTilt));

      robot.style.setProperty("--robot-tilt", `${currentTilt}deg`);
    }
  };

  const handleTouchEnd = () => {
    if (robot) {
      robot.style.setProperty("--robot-tilt", "0deg");
    }
  };

  if ("ontouchstart" in window) {
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  } else {
    document.addEventListener("mousemove", handleMouseMove);
  }
});
</script>

<style scoped>
.home-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 20px;
  background-color: #f0f8ff;
}

.pull-to-refresh {
  position: absolute;
  top: -40px;
  left: 0;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f8ff;
  transition: transform 0.3s;
}

.pull-to-refresh.visible {
  transform: translateY(40px);
}

.pull-to-refresh.refreshing {
  transform: translateY(40px);
}

.robot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
}

.home-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 60px;
}

.robot-character {
  width: 200px;
  height: 250px;
  position: relative;
  --eye-rotation: 0deg;
  --robot-tilt: 0deg;
  transform: rotate(var(--robot-tilt));
  transition: transform 0.3s ease;
}

.head {
  width: 100px;
  height: 100px;
  background-color: #3498db;
  border-radius: 50%;
  position: absolute;
  top: 20px;
  left: 50px;
  overflow: hidden;
}

.helmet {
  width: 110px;
  height: 55px;
  background-color: #f1c40f;
  border-radius: 55px 55px 0 0;
  position: absolute;
  top: -10px;
  left: -5px;
}

.face {
  position: relative;
  top: 50px;
}

.eye {
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 10px;
}

.eye::after {
  content: "";
  width: 10px;
  height: 10px;
  background-color: black;
  border-radius: 50%;
  position: absolute;
  top: 5px;
  left: 5px;
  transform: rotate(var(--eye-rotation)) translateX(2px);
}

.eye.left {
  left: 20px;
}

.eye.right {
  right: 20px;
}

.mouth {
  width: 30px;
  height: 10px;
  border-radius: 0 0 15px 15px;
  border: 3px solid white;
  border-top: none;
  position: absolute;
  bottom: 15px;
  left: 35px;
}

.body {
  width: 120px;
  height: 100px;
  background-color: #3498db;
  border-radius: 20px;
  position: absolute;
  top: 130px;
  left: 40px;
}

.arm {
  width: 20px;
  height: 70px;
  background-color: #3498db;
  position: absolute;
  top: 20px;
}

.arm.left {
  left: -10px;
  transform: rotate(20deg);
  animation: wave-left 2s infinite;
}

.arm.right {
  right: -10px;
  transform: rotate(-20deg);
  animation: wave-right 2s infinite;
}

@keyframes wave-left {
  0%,
  100% {
    transform: rotate(20deg);
  }
  50% {
    transform: rotate(40deg);
  }
}

@keyframes wave-right {
  0%,
  100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(-40deg);
  }
}

.speech-bubble {
  position: absolute;
  background-color: white;
  border-radius: 10px;
  padding: 10px;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  animation: pop-in 0.3s ease-out;
}

.speech-bubble::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 50%;
  border-width: 10px 10px 0;
  border-style: solid;
  border-color: white transparent;
  transform: translateX(-50%);
}

@keyframes pop-in {
  0% {
    transform: translateX(-50%) scale(0);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}

.reload-button {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3498db;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
  z-index: 1000;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.reload-button:hover {
  background-color: #2980b9;
}

.reload-button svg {
  width: 24px;
  height: 24px;
  color: white;
}

.pull-to-refresh {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f8ff;
  color: #3498db;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.refresh-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  fill: #3498db;
  transition: transform 0.3s ease;
}

@supports (-webkit-touch-callout: none) {
  .reload-button {
    padding: 0;
  }
}

@media (max-width: 767px) {
  .reload-button {
    display: none;
  }
}
</style>
```