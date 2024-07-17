<template>
  <div class="quiz-management">
    <van-form @submit="handleSubmit">
      <van-field
        v-model="currentQuiz.question"
        name="question"
        label="問題"
        :rules="[{ required: true, message: '問題を入力してください' }]"
      />

      <van-field
        v-model.number="currentQuiz.correctAnswer"
        name="correctAnswer"
        label="正解"
        type="number"
        :rules="[{ required: true, message: '正解を選択してください' }]"
      />

      <van-field
        v-for="(option, index) in currentQuiz.options"
        :key="index"
        v-model="currentQuiz.options[index]"
        :name="`option-${index}`"
        :label="`選択肢 ${index + 1}`"
        :rules="[{ required: true, message: '選択肢を入力してください' }]"
      />

      <div style="margin: 16px">
        <van-button type="primary" size="small" @click="addOption">
          選択肢を追加
        </van-button>
      </div>

      <van-field name="uploader" label="画像">
        <template #input>
          <van-uploader
            v-model="fileList"
            :after-read="handleImageUpload"
            :max-count="1"
            :preview-full-image="false"
            @click-preview="handlePreview"
            multiple
          />
        </template>
      </van-field>

      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit">
          {{ editingQuizId ? "更新" : "追加" }}
        </van-button>
      </div>
    </van-form>

    <van-divider>クイズ一覧</van-divider>

    <van-loading v-if="isLoading" vertical>読み込み中...</van-loading>

    <van-list v-else>
      <van-cell v-for="quiz in quizzes" :key="quiz.id" :title="quiz.question">
        <template #right-icon>
          <van-button size="small" type="primary" @click="editQuiz(quiz)">
            編集
          </van-button>
          <van-button
            size="small"
            type="danger"
            @click="showDeleteConfirm(quiz.id)"
          >
            削除
          </van-button>
        </template>
      </van-cell>
    </van-list>
    <div>
      <van-image-preview
        v-model:show="showPreview"
        :images="previewImages"
        @click="closePreview"
      />
    </div>
  </div>
</template>
  <script setup>
import { ref, onMounted, inject } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase";
import {
  Form as VanForm,
  Field as VanField,
  Button as VanButton,
  List as VanList,
  Cell as VanCell,
  Uploader as VanUploader,
  Divider as VanDivider,
  Loading as VanLoading,
  ImagePreview as VanImagePreview,
} from "vant";

const { quizzes, navigateTo } = inject("appContext");

const currentQuiz = ref({
  question: "",
  correctAnswer: null,
  options: ["", ""],
  imageRef: "",
});

const editingQuizId = ref(null);
const fileList = ref([]);

const handleSubmit = async () => {
  try {
    if (editingQuizId.value) {
      await updateQuiz();
      showToast("クイズを更新しました");
    } else {
      await addQuiz();
      showToast("クイズを追加しました");
    }
    resetForm();
  } catch (error) {
    console.error("Error submitting quiz:", error);
    showToast("エラーが発生しました");
  }
};

const addQuiz = async () => {
  const newQuiz = { ...currentQuiz.value };
  const docRef = await addDoc(collection(db, "quizzes"), newQuiz);
  quizzes.value.push({ id: docRef.id, ...newQuiz });
};

const updateQuiz = async () => {
  const updatedQuiz = { ...currentQuiz.value };
  await updateDoc(doc(db, "quizzes", editingQuizId.value), updatedQuiz);
  const index = quizzes.value.findIndex((q) => q.id === editingQuizId.value);
  if (index !== -1) {
    quizzes.value[index] = { id: editingQuizId.value, ...updatedQuiz };
  }
};

const showDeleteConfirm = (id) => {
  showConfirmDialog({
    title: "確認",
    message: "このクイズを削除してもよろしいですか？",
  })
    .then(() => {
      deleteQuiz(id);
    })
    .catch(() => {
      // キャンセルされた場合は何もしない
    });
};

const deleteQuiz = async (id) => {
  try {
    await deleteDoc(doc(db, "quizzes", id));
    const quizToDelete = quizzes.value.find((q) => q.id === id);
    if (quizToDelete?.imageRef) {
      await deleteObject(storageRef(storage, quizToDelete.imageRef));
    }
    quizzes.value = quizzes.value.filter((q) => q.id !== id);
    showToast("クイズを削除しました");
  } catch (error) {
    console.error("Error deleting quiz:", error);
    showToast("削除中にエラーが発生しました");
  }
};

const editQuiz = async (quiz) => {
  currentQuiz.value = { ...quiz };
  editingQuizId.value = quiz.id;
  if (quiz.imageRef) {
    try {
      const imageUrl = await getDownloadURL(storageRef(storage, quiz.imageRef));
      fileList.value = [{ url: imageUrl }];
    } catch (error) {
      console.error("Error loading image:", error);
      fileList.value = [];
    }
  } else {
    fileList.value = [];
  }
};

const resetForm = () => {
  currentQuiz.value = {
    question: "",
    correctAnswer: null,
    options: ["", ""],
    imageRef: "",
  };
  editingQuizId.value = null;
  fileList.value = [];
};

const addOption = () => {
  currentQuiz.value.options.push("");
};

const handleImageUpload = async (file) => {
  try {
    const imageRef = storageRef(
      storage,
      `quizImages/${Date.now()}_${file.file.name}`
    );
    await uploadBytes(imageRef, file.file);
    const fullPath = imageRef.fullPath;
    currentQuiz.value.imageRef = `gs://factory-safety.appspot.com/${fullPath}`;
    //showToast("画像をアップロードしました");
  } catch (error) {
    console.error("Error uploading image:", error);
    //showToast("画像のアップロードに失敗しました");
  }
};

const isLoading = ref(true);

onMounted(async () => {
  try {
    // クイズデータがまだ読み込まれていない場合は、ここで読み込む
    if (quizzes.value.length === 0) {
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      quizzes.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // 画像のプリロード
    //await preloadImages();
    console.log(quizzes.value);

    isLoading.value = false;
  } catch (error) {
    console.error("Error initializing quiz management page:", error);
    showToast("データの読み込み中にエラーが発生しました");
    isLoading.value = false;
  }
});

const showPreview = ref(false);
const previewImages = ref([]);

const handlePreview = (file) => {
  previewImages.value = [file.url || file.content];
  showPreview.value = true;
};

const closePreview = () => {
  showPreview.value = false;
};

const preloadImages = async () => {
  const imagePromises = quizzes.value
    .filter((quiz) => quiz.imageRef)
    .map((quiz) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = quiz.imageRef;
      });
    });

  await Promise.all(imagePromises);
};
</script>
  
  <style scoped>
.quiz-management {
  padding-bottom: 50px;
}

.van-button {
  margin: 5px;
}

.van-divider {
  margin-top: 20px;
  margin-bottom: 20px;
}

.van-cell {
  align-items: center;
}

.van-cell__right-icon {
  display: flex;
  align-items: center;
}
</style>