<template>
  <div class="quiz-management">
    <van-form @submit="handleSubmit">
      <van-field
        v-model="currentQuiz.question"
        name="question"
        label="問題文"
        :rules="[{ required: true, message: '問題を入力してください' }]"
      />

      <van-field
        v-for="(option, index) in currentQuiz.options"
        :key="index"
        v-model="currentQuiz.options[index]"
        :name="`option-${index}`"
        :label="`選択肢 ${index + 1}`"
        :rules="[{ required: true, message: '選択肢を入力してください' }]"
      />

      <van-field
        v-model="currentQuiz.correctAnswer"
        name="correctAnswer"
        label="正解"
        :rules="[{ required: true, message: '正解を選択してください' }]"
      >
        <template #input>
          <select
            :value="currentQuiz.correctAnswer"
            class="custom-select"
            @change="handleCorrectAnswerChange"
          >
            <option value="" disabled>正解を選択</option>
            <option
              v-for="(option, index) in currentQuiz.options"
              :key="index"
              :value="index"
            >
              選択肢 {{ index + 1 }}
            </option>
          </select>
        </template>
      </van-field>

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
    <van-button @click="goBack">ホームに戻る</van-button>
  </div>
</template>
  
  <script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
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
  showConfirmDialog,
  showToast,
} from "vant";

const router = useRouter();

const quizzes = ref([]);
const currentQuiz = ref({
  question: "",
  correctAnswer: null,
  options: ["", "", ""],
  imageRef: "",
});

const editingQuizId = ref(null);
const fileList = ref([]);
const isLoading = ref(true);
const showPreview = ref(false);
const previewImages = ref([]);
const selectedFile = ref(null);

const handleSubmit = async () => {
  try {
    if (selectedFile.value) {
      await uploadImage();
    }
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

const handleCorrectAnswerChange = (event) => {
  currentQuiz.value.correctAnswer = parseInt(event.target.value, 10);
};

const addQuiz = async () => {
  const newQuiz = {
    ...currentQuiz.value,
    correctAnswer: parseInt(currentQuiz.value.correctAnswer, 10),
  };
  const docRef = await addDoc(collection(db, "quizzes"), newQuiz);
  quizzes.value.push({ id: docRef.id, ...newQuiz });
};

const updateQuiz = async () => {
  const updatedQuiz = {
    ...currentQuiz.value,
    correctAnswer: parseInt(currentQuiz.value.correctAnswer, 10),
  };
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
    confirmButtonText: "削除する",
    cancelButtonText: "キャンセル"
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
  selectedFile.value = null;
};

const addOption = () => {
  currentQuiz.value.options.push("");
};

const uploadImage = async () => {
  const file = selectedFile.value;
  const imageRef = storageRef(storage, `quizImages/${Date.now()}_${file.name}`);
  await uploadBytes(imageRef, file);
  const fullPath = imageRef.fullPath;
  currentQuiz.value.imageRef = `gs://factory-safety.appspot.com/${fullPath}`;
};

const handleImageUpload = (file) => {
  selectedFile.value = file.file;
  fileList.value = [file];
};

const handlePreview = (file) => {
  previewImages.value = [file.url || file.content];
  showPreview.value = true;
};

const closePreview = () => {
  showPreview.value = false;
};

const fetchQuizzes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "quizzes"));
    quizzes.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    isLoading.value = false;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    showToast("クイズの読み込み中にエラーが発生しました");
    isLoading.value = false;
  }
};

const goBack = () => {
  router.push("/");
};

onMounted(async () => {
  await fetchQuizzes();
});
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

.custom-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdee0;
  border-radius: 4px;
  background-color: #fff;
  font-size: 14px;
  color: #323233;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8.825L1.175 4 2.59 2.59 6 6l3.41-3.41L10.825 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.custom-select:focus {
  outline: none;
  border-color: #1989fa;
}
</style>