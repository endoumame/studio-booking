<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref } from "vue";

interface RoomStatusBooking {
  readonly startTime: string;
  readonly endTime: string;
  readonly status: string;
  readonly bookingId?: string;
}

interface RoomStatus {
  readonly roomId: string;
  readonly roomName: string;
  readonly availability: "available" | "occupied" | "upcoming";
  readonly bookings: readonly RoomStatusBooking[];
}

const AVAILABILITY_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  occupied: "bg-red-100 text-red-800",
  upcoming: "bg-yellow-100 text-yellow-800",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "空室",
  occupied: "利用中",
  upcoming: "予約あり",
};

const DEFAULT_STYLE = "bg-gray-100 text-gray-800";
const DATE_START = 0;
const DATE_STRING_LENGTH = 10;

const studioId = ref("");
const date = ref(new Date().toISOString().slice(DATE_START, DATE_STRING_LENGTH));
const rooms = ref<RoomStatus[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const actionLoading = ref("");

const formatTime = (iso: string): string => {
  const parsed = new Date(iso);
  return parsed.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const availabilityStyle = (availability: string): string =>
  AVAILABILITY_STYLES[availability] ?? DEFAULT_STYLE;

const availabilityLabel = (availability: string): string =>
  AVAILABILITY_LABELS[availability] ?? availability;

const fetchRoomStatus = async (sid: string, dt: string): Promise<RoomStatus[]> => {
  const params = new URLSearchParams({ date: dt, studioId: sid });
  const response = await fetch(`/api/staff/rooms/status?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`取得に失敗しました (${String(response.status)})`);
  }
  return await response.json();
};

const loadRoomStatus = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = "";

  try {
    rooms.value = await fetchRoomStatus(studioId.value, date.value);
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const postAction = async (url: string): Promise<void> => {
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text === "" ? `操作に失敗しました (${String(response.status)})` : text);
  }
};

const handleCheckin = async (bookingId: string): Promise<void> => {
  actionLoading.value = bookingId;
  try {
    await postAction(`/api/staff/checkin/${bookingId}`);
    await loadRoomStatus();
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "チェックインに失敗しました";
  } finally {
    actionLoading.value = "";
  }
};

const handleApproveExtension = async (bookingId: string): Promise<void> => {
  actionLoading.value = bookingId;
  try {
    await postAction(`/api/staff/extension/${bookingId}/approve`);
    await loadRoomStatus();
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "延長承認に失敗しました";
  } finally {
    actionLoading.value = "";
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
        <RouterLink to="/" class="text-gray-400 hover:text-gray-600">
          <div class="i-carbon-arrow-left text-xl" />
        </RouterLink>
        <h1 class="text-xl font-bold text-gray-900">スタッフ管理</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6">
      <form
        class="bg-white rounded-lg border border-gray-200 p-4 mb-6"
        @submit.prevent="loadRoomStatus"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label for="staff-studio" class="block text-sm font-medium text-gray-700 mb-1"
              >スタジオID</label
            >
            <input
              id="staff-studio"
              v-model="studioId"
              type="text"
              required
              placeholder="スタジオIDを入力"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label for="staff-date" class="block text-sm font-medium text-gray-700 mb-1"
              >日付</label
            >
            <input
              id="staff-date"
              v-model="date"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              :disabled="loading || studioId === ''"
              class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">読込中...</span>
              <span v-else>表示</span>
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

      <div v-if="rooms.length > 0" class="space-y-4">
        <article
          v-for="room in rooms"
          :key="room.roomId"
          class="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-gray-900">{{ room.roomName }}</h2>
            <span
              :class="[
                availabilityStyle(room.availability),
                'px-3 py-1 text-xs font-medium rounded-full',
              ]"
            >
              {{ availabilityLabel(room.availability) }}
            </span>
          </div>

          <div v-if="room.bookings.length > 0" class="space-y-2">
            <div
              v-for="(booking, index) in room.bookings"
              :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div class="text-sm">
                <p class="font-medium text-gray-900">
                  {{ formatTime(booking.startTime) }} 〜 {{ formatTime(booking.endTime) }}
                </p>
                <p class="text-gray-500">{{ booking.status }}</p>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="booking.status === 'CONFIRMED' && booking.bookingId != null"
                  type="button"
                  :disabled="actionLoading === booking.bookingId"
                  class="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  @click="handleCheckin(booking.bookingId)"
                >
                  チェックイン
                </button>
                <button
                  v-if="booking.status === 'IN_USE' && booking.bookingId != null"
                  type="button"
                  :disabled="actionLoading === booking.bookingId"
                  class="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
                  @click="handleApproveExtension(booking.bookingId)"
                >
                  延長承認
                </button>
              </div>
            </div>
          </div>

          <p v-else class="text-sm text-gray-400">本日の予約はありません</p>
        </article>
      </div>
    </main>
  </div>
</template>
