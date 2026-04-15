<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

interface AvailableSlot {
  readonly roomId: string;
  readonly startTime: string;
  readonly endTime: string;
}

const router = useRouter();

const date = ref("");
const roomId = ref("");
const slots = ref<AvailableSlot[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const formatTime = (iso: string): string => {
  const dt = new Date(iso);
  return dt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
};

const validateSearchInputs = (): boolean => {
  if (!date.value) {
    errorMessage.value = "日付を入力してください";
    return false;
  }
  if (!roomId.value) {
    errorMessage.value = "ルームIDを入力してください";
    return false;
  }
  return true;
};

const resetSearchState = (): void => {
  loading.value = true;
  errorMessage.value = "";
  slots.value = [];
};

const fetchSlots = async (): Promise<void> => {
  const params = new URLSearchParams({ date: date.value, roomId: roomId.value });
  const response = await fetch(`/api/bookings/search?${params.toString()}`);
  if (!response.ok) {
    errorMessage.value = "検索に失敗しました";
    return;
  }
  const data = (await response.json()) as AvailableSlot[];
  slots.value = data;
};

const search = async (): Promise<void> => {
  if (!validateSearchInputs()) {
    return;
  }
  resetSearchState();
  try {
    await fetchSlots();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
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
    <div class="max-w-3xl mx-auto px-4 py-10">
      <RouterLink to="/" class="text-sm text-blue-600 hover:underline mb-6 inline-block">
        &larr; ホームに戻る
      </RouterLink>

      <h1 class="text-2xl font-bold text-gray-900 mb-8">予約検索</h1>

      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="search-date">
              日付
            </label>
            <input
              id="search-date"
              v-model="date"
              type="date"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="search-room">
              ルームID
            </label>
            <input
              id="search-room"
              v-model="roomId"
              type="text"
              placeholder="room-xxx"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
          @click="search"
        >
          {{ loading ? "検索中..." : "検索" }}
        </button>

        <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>
      </div>

      <div v-if="slots.length > 0">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">空きスロット</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="(slot, index) in slots"
            :key="index"
            class="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
            @click="selectSlot(slot)"
          >
            <p class="text-sm text-gray-500">{{ slot.roomId }}</p>
            <p class="text-lg font-semibold text-gray-900 mt-1">
              {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
            </p>
            <p class="text-xs text-blue-600 mt-2">クリックして予約 &rarr;</p>
          </button>
        </div>
      </div>

      <p
        v-else-if="!loading && date && roomId && slots.length === 0 && !errorMessage"
        class="text-sm text-gray-500"
      >
        空きスロットが見つかりませんでした
      </p>
    </div>
  </div>
</template>
