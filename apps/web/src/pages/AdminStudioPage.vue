<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

interface RoomDto {
  readonly roomId: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
}

interface StudioDto {
  readonly studioId: string;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;
  readonly rooms: readonly RoomDto[];
}

const DEFAULT_CAPACITY = 4;
const DEFAULT_RATE = 1000;

const studios = ref<StudioDto[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const studioName = ref("");
const prefecture = ref("");
const city = ref("");
const street = ref("");
const zipCode = ref("");
const studioSubmitting = ref(false);

const selectedStudioId = ref("");
const roomName = ref("");
const roomCapacity = ref(DEFAULT_CAPACITY);
const roomHourlyRate = ref(DEFAULT_RATE);
const roomSubmitting = ref(false);

const fetchStudios = async (): Promise<StudioDto[]> => {
  const response = await fetch("/api/admin/studios");
  if (!response.ok) {
    throw new Error(`取得に失敗しました (${String(response.status)})`);
  }
  return await response.json();
};

const loadStudios = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = "";

  try {
    studios.value = await fetchStudios();
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const postStudio = async (): Promise<void> => {
  const response = await fetch("/api/admin/studios", {
    body: JSON.stringify({
      city: city.value,
      name: studioName.value,
      prefecture: prefecture.value,
      street: street.value,
      zipCode: zipCode.value,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`スタジオの作成に失敗しました (${String(response.status)})`);
  }
};

const resetStudioForm = (): void => {
  studioName.value = "";
  prefecture.value = "";
  city.value = "";
  street.value = "";
  zipCode.value = "";
};

const handleAddStudio = async (): Promise<void> => {
  studioSubmitting.value = true;
  errorMessage.value = "";

  try {
    await postStudio();
    await loadStudios();
    resetStudioForm();
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    studioSubmitting.value = false;
  }
};

const postRoom = async (): Promise<void> => {
  const response = await fetch(`/api/admin/studios/${selectedStudioId.value}/rooms`, {
    body: JSON.stringify({
      capacity: roomCapacity.value,
      hourlyRate: roomHourlyRate.value,
      name: roomName.value,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`部屋の作成に失敗しました (${String(response.status)})`);
  }
};

const handleAddRoom = async (): Promise<void> => {
  roomSubmitting.value = true;
  errorMessage.value = "";

  try {
    await postRoom();
    await loadStudios();
    roomName.value = "";
    roomCapacity.value = DEFAULT_CAPACITY;
    roomHourlyRate.value = DEFAULT_RATE;
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    roomSubmitting.value = false;
  }
};

onMounted(loadStudios);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
        <RouterLink to="/" class="text-gray-400 hover:text-gray-600">
          <div class="i-carbon-arrow-left text-xl" />
        </RouterLink>
        <h1 class="text-xl font-bold text-gray-900">スタジオ管理</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6">
      <div
        v-if="errorMessage !== ''"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">スタジオ一覧</h2>

        <div v-if="loading" class="text-center py-8 text-gray-500">読み込み中...</div>

        <div v-else-if="studios.length === 0" class="text-center py-8 text-gray-500">
          <p>スタジオが登録されていません</p>
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="studio in studios"
            :key="studio.studioId"
            class="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div class="mb-3">
              <h3 class="text-base font-semibold text-gray-900">{{ studio.name }}</h3>
              <p class="text-sm text-gray-500">
                〒{{ studio.zipCode }} {{ studio.prefecture }}{{ studio.city }}{{ studio.street }}
              </p>
            </div>
            <div v-if="studio.rooms.length > 0">
              <h4 class="text-xs font-medium text-gray-400 mb-2">部屋</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  v-for="room in studio.rooms"
                  :key="room.roomId"
                  class="p-2 bg-gray-50 rounded text-sm"
                >
                  <p class="font-medium text-gray-900">{{ room.name }}</p>
                  <p class="text-gray-500">
                    定員{{ room.capacity }}名 / &yen;{{ room.hourlyRate.toLocaleString() }}/h
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">部屋が登録されていません</p>
          </article>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">スタジオ追加</h2>
        <form
          class="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
          @submit.prevent="handleAddStudio"
        >
          <div>
            <label for="studio-name" class="block text-sm font-medium text-gray-700 mb-1"
              >スタジオ名</label
            >
            <input
              id="studio-name"
              v-model="studioName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="studio-zip" class="block text-sm font-medium text-gray-700 mb-1"
                >郵便番号</label
              >
              <input
                id="studio-zip"
                v-model="zipCode"
                type="text"
                required
                placeholder="100-0001"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="studio-pref" class="block text-sm font-medium text-gray-700 mb-1"
                >都道府県</label
              >
              <input
                id="studio-pref"
                v-model="prefecture"
                type="text"
                required
                placeholder="東京都"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="studio-city" class="block text-sm font-medium text-gray-700 mb-1"
                >市区町村</label
              >
              <input
                id="studio-city"
                v-model="city"
                type="text"
                required
                placeholder="千代田区"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="studio-street" class="block text-sm font-medium text-gray-700 mb-1"
                >番地</label
              >
              <input
                id="studio-street"
                v-model="street"
                type="text"
                required
                placeholder="丸の内1-1-1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            :disabled="studioSubmitting || studioName === ''"
            class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="studioSubmitting">送信中...</span>
            <span v-else>スタジオを追加</span>
          </button>
        </form>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">部屋追加</h2>
        <form
          class="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
          @submit.prevent="handleAddRoom"
        >
          <div>
            <label for="room-studio" class="block text-sm font-medium text-gray-700 mb-1"
              >スタジオ</label
            >
            <select
              id="room-studio"
              v-model="selectedStudioId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>スタジオを選択</option>
              <option v-for="studio in studios" :key="studio.studioId" :value="studio.studioId">
                {{ studio.name }}
              </option>
            </select>
          </div>
          <div>
            <label for="room-name" class="block text-sm font-medium text-gray-700 mb-1"
              >部屋名</label
            >
            <input
              id="room-name"
              v-model="roomName"
              type="text"
              required
              placeholder="Studio A"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="room-capacity" class="block text-sm font-medium text-gray-700 mb-1"
                >定員</label
              >
              <input
                id="room-capacity"
                v-model.number="roomCapacity"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="room-rate" class="block text-sm font-medium text-gray-700 mb-1"
                >時間単価（円）</label
              >
              <input
                id="room-rate"
                v-model.number="roomHourlyRate"
                type="number"
                min="0"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            :disabled="roomSubmitting || selectedStudioId === '' || roomName === ''"
            class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="roomSubmitting">送信中...</span>
            <span v-else>部屋を追加</span>
          </button>
        </form>
      </section>
    </main>
  </div>
</template>
