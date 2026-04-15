<script setup lang="ts">
import { ref } from "vue";

interface StudioRoomItem {
  readonly roomId: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
}

interface StudioListItem {
  readonly studioId: string;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;
  readonly rooms: readonly StudioRoomItem[];
}

const INITIAL_CAPACITY = 1;
const INITIAL_HOURLY_RATE = 1000;

const studios = ref<StudioListItem[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const actionMessage = ref("");

const studioName = ref("");
const studioPrefecture = ref("");
const studioCity = ref("");
const studioStreet = ref("");
const studioZipCode = ref("");

const roomStudioId = ref("");
const roomName = ref("");
const roomCapacity = ref(INITIAL_CAPACITY);
const roomHourlyRate = ref(INITIAL_HOURLY_RATE);

const loadStudiosFromApi = async (): Promise<void> => {
  const response = await fetch("/api/admin/studios");
  if (!response.ok) {
    errorMessage.value = "スタジオ一覧の取得に失敗しました";
    return;
  }
  const data = (await response.json()) as StudioListItem[];
  studios.value = data;
};

const fetchStudios = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = "";
  try {
    await loadStudiosFromApi();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const validateStudioInputs = (): boolean => {
  if (!studioName.value || !studioPrefecture.value || !studioCity.value) {
    errorMessage.value = "スタジオ名・都道府県・市区町村は必須です";
    return false;
  }
  return true;
};

const buildStudioBody = (): Record<string, string> => ({
  city: studioCity.value,
  name: studioName.value,
  prefecture: studioPrefecture.value,
  street: studioStreet.value,
  zipCode: studioZipCode.value,
});

const resetStudioForm = (): void => {
  studioName.value = "";
  studioPrefecture.value = "";
  studioCity.value = "";
  studioStreet.value = "";
  studioZipCode.value = "";
};

const postStudio = async (): Promise<void> => {
  const response = await fetch("/api/admin/studios", {
    body: JSON.stringify(buildStudioBody()),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    errorMessage.value = "スタジオの追加に失敗しました";
    return;
  }
  actionMessage.value = "スタジオを追加しました";
  resetStudioForm();
  await fetchStudios();
};

const addStudio = async (): Promise<void> => {
  if (!validateStudioInputs()) {
    return;
  }
  errorMessage.value = "";
  actionMessage.value = "";
  try {
    await postStudio();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
  }
};

const validateRoomInputs = (): boolean => {
  if (!roomStudioId.value || !roomName.value) {
    errorMessage.value = "スタジオID・ルーム名は必須です";
    return false;
  }
  return true;
};

const buildRoomBody = (): Record<string, unknown> => ({
  capacity: roomCapacity.value,
  hourlyRate: roomHourlyRate.value,
  name: roomName.value,
  studioId: roomStudioId.value,
});

const resetRoomForm = (): void => {
  roomStudioId.value = "";
  roomName.value = "";
  roomCapacity.value = INITIAL_CAPACITY;
  roomHourlyRate.value = INITIAL_HOURLY_RATE;
};

const postRoom = async (): Promise<void> => {
  const response = await fetch("/api/admin/rooms", {
    body: JSON.stringify(buildRoomBody()),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    errorMessage.value = "ルームの追加に失敗しました";
    return;
  }
  actionMessage.value = "ルームを追加しました";
  resetRoomForm();
  await fetchStudios();
};

const addRoom = async (): Promise<void> => {
  if (!validateRoomInputs()) {
    return;
  }
  errorMessage.value = "";
  actionMessage.value = "";
  try {
    await postRoom();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
  }
};

fetchStudios();
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 py-10">
      <RouterLink to="/" class="text-sm text-blue-600 hover:underline mb-6 inline-block">
        &larr; ホームに戻る
      </RouterLink>

      <h1 class="text-2xl font-bold text-gray-900 mb-8">管理画面</h1>

      <p v-if="errorMessage" class="text-sm text-red-600 mb-4">{{ errorMessage }}</p>
      <p v-if="actionMessage" class="text-sm text-green-700 mb-4">{{ actionMessage }}</p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <form class="bg-white rounded-lg border border-gray-200 p-6" @submit.prevent="addStudio">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">スタジオ追加</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-studio-name">
                スタジオ名 <span class="text-red-500">*</span>
              </label>
              <input
                id="admin-studio-name"
                v-model="studioName"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-pref">
                  都道府県 <span class="text-red-500">*</span>
                </label>
                <input
                  id="admin-pref"
                  v-model="studioPrefecture"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-city">
                  市区町村 <span class="text-red-500">*</span>
                </label>
                <input
                  id="admin-city"
                  v-model="studioCity"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-street">
                  番地
                </label>
                <input
                  id="admin-street"
                  v-model="studioStreet"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-zip">
                  郵便番号
                </label>
                <input
                  id="admin-zip"
                  v-model="studioZipCode"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              class="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              スタジオを追加
            </button>
          </div>
        </form>

        <form class="bg-white rounded-lg border border-gray-200 p-6" @submit.prevent="addRoom">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">ルーム追加</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-room-studio">
                スタジオID <span class="text-red-500">*</span>
              </label>
              <input
                id="admin-room-studio"
                v-model="roomStudioId"
                type="text"
                placeholder="studio-xxx"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-room-name">
                ルーム名 <span class="text-red-500">*</span>
              </label>
              <input
                id="admin-room-name"
                v-model="roomName"
                type="text"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-room-cap">
                  定員
                </label>
                <input
                  id="admin-room-cap"
                  v-model.number="roomCapacity"
                  type="number"
                  min="1"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="admin-room-rate">
                  時間単価 (&yen;)
                </label>
                <input
                  id="admin-room-rate"
                  v-model.number="roomHourlyRate"
                  type="number"
                  min="0"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              class="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              ルームを追加
            </button>
          </div>
        </form>
      </div>

      <h2 class="text-xl font-semibold text-gray-900 mb-4">スタジオ一覧</h2>

      <div v-if="loading" class="text-sm text-gray-500">読み込み中...</div>

      <div v-else-if="studios.length > 0" class="space-y-4">
        <div
          v-for="studio in studios"
          :key="studio.studioId"
          class="bg-white rounded-lg border border-gray-200 p-5"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-900">{{ studio.name }}</h3>
            <span class="text-xs text-gray-400 font-mono">{{ studio.studioId }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">
            〒{{ studio.zipCode }} {{ studio.prefecture }}{{ studio.city }}{{ studio.street }}
          </p>

          <div v-if="studio.rooms.length > 0">
            <p class="text-sm font-medium text-gray-700 mb-2">ルーム</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div
                v-for="room in studio.rooms"
                :key="room.roomId"
                class="bg-gray-50 rounded-md p-3 text-sm"
              >
                <p class="font-medium text-gray-900">{{ room.name }}</p>
                <p class="text-gray-500">
                  定員: {{ room.capacity }}名 / &yen;{{ room.hourlyRate.toLocaleString() }}/時間
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">ルームなし</p>
        </div>
      </div>

      <p v-else class="text-sm text-gray-500">スタジオが登録されていません</p>
    </div>
  </div>
</template>
