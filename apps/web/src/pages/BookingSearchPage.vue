<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { ref } from "vue";

interface AvailableSlot {
  readonly roomId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
}

const DATE_START = 0;
const DATE_STRING_LENGTH = 10;
const MINUTES_PER_HOUR = 60;
const NO_REMAINDER = 0;

const router = useRouter();

const toDateString = (input: Date): string =>
  input.toISOString().slice(DATE_START, DATE_STRING_LENGTH);

const date = ref(toDateString(new Date()));
const roomId = ref("");
const slots = ref<AvailableSlot[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const searched = ref(false);

const formatTime = (iso: string): string => {
  const parsed = new Date(iso);
  return parsed.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins = minutes % MINUTES_PER_HOUR;
  if (mins === NO_REMAINDER) {
    return `${String(hours)}時間`;
  }
  return `${String(hours)}時間${String(mins)}分`;
};

const buildSearchParams = (): URLSearchParams => {
  const params = new URLSearchParams({ date: date.value });
  if (roomId.value !== "") {
    params.set("roomId", roomId.value);
  }
  return params;
};

const fetchSlots = async (params: URLSearchParams): Promise<AvailableSlot[]> => {
  const response = await fetch(`/api/bookings/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`検索に失敗しました (${String(response.status)})`);
  }
  return await response.json();
};

const searchSlots = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = "";
  searched.value = true;

  try {
    slots.value = await fetchSlots(buildSearchParams());
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const selectSlot = async (slot: AvailableSlot): Promise<void> => {
  await router.push({
    path: "/bookings/create",
    query: {
      endTime: slot.endTime,
      roomId: slot.roomId,
      startTime: slot.startTime,
    },
  });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
        <RouterLink to="/" class="text-gray-400 hover:text-gray-600">
          <div class="i-carbon-arrow-left text-xl" />
        </RouterLink>
        <h1 class="text-xl font-bold text-gray-900">空きスタジオ検索</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6">
      <form
        class="bg-white rounded-lg border border-gray-200 p-4 mb-6"
        @submit.prevent="searchSlots"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label for="search-date" class="block text-sm font-medium text-gray-700 mb-1"
              >日付</label
            >
            <input
              id="search-date"
              v-model="date"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label for="search-room" class="block text-sm font-medium text-gray-700 mb-1"
              >部屋ID（任意）</label
            >
            <input
              id="search-room"
              v-model="roomId"
              type="text"
              placeholder="指定なし"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              :disabled="loading"
              class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">検索中...</span>
              <span v-else>検索</span>
            </button>
          </div>
        </div>
      </form>

      <div
        v-if="errorMessage !== ''"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="searched && !loading && slots.length === 0 && errorMessage === ''"
        class="text-center py-12 text-gray-500"
      >
        <div class="i-carbon-calendar text-4xl mx-auto mb-2" />
        <p>空きスロットが見つかりませんでした</p>
      </div>

      <div v-if="slots.length > 0" class="space-y-3">
        <h2 class="text-sm font-medium text-gray-500 mb-2">{{ slots.length }}件の空きスロット</h2>
        <button
          v-for="(slot, index) in slots"
          :key="index"
          type="button"
          class="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          @click="selectSlot(slot)"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">部屋: {{ slot.roomId }}</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ formatTime(slot.startTime) }} 〜 {{ formatTime(slot.endTime) }}
              </p>
            </div>
            <div class="text-right">
              <span
                class="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full"
              >
                {{ formatDuration(slot.durationMinutes) }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </main>
  </div>
</template>
