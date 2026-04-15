<script setup lang="ts">
import { ref } from "vue";

interface RoomBookingInfo {
  readonly bookingId: string;
  readonly status: string;
  readonly startTime: string;
  readonly endTime: string;
}

interface RoomStatusItem {
  readonly roomId: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
  readonly bookings: readonly RoomBookingInfo[];
}

const DEFAULT_EXTENSION_MINUTES = 30;

const studioId = ref("");
const date = ref("");
const rooms = ref<RoomStatusItem[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const actionMessage = ref("");

const statusLabels: Record<string, string> = {
  AWAITING_PAYMENT: "支払い待ち",
  CANCELLED: "キャンセル",
  CHECKED_IN: "チェックイン済",
  COMPLETED: "完了",
  CONFIRMED: "確定",
  IN_USE: "利用中",
  TENTATIVE: "仮予約",
};

const statusColors: Record<string, string> = {
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-red-100 text-red-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_USE: "bg-purple-100 text-purple-800",
  TENTATIVE: "bg-yellow-100 text-yellow-800",
};

const formatTime = (iso: string): string => {
  const dt = new Date(iso);
  return dt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
};

const fetchRoomStatus = async (): Promise<void> => {
  const params = new URLSearchParams({ date: date.value, studioId: studioId.value });
  const response = await fetch(`/api/staff/rooms/status?${params.toString()}`);
  if (!response.ok) {
    errorMessage.value = "ルーム情報の取得に失敗しました";
    return;
  }
  const data = (await response.json()) as RoomStatusItem[];
  rooms.value = data;
};

const validateInputs = (): boolean => {
  if (!studioId.value) {
    errorMessage.value = "スタジオIDを入力してください";
    return false;
  }
  if (!date.value) {
    errorMessage.value = "日付を入力してください";
    return false;
  }
  return true;
};

const loadStatus = async (): Promise<void> => {
  if (!validateInputs()) {
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    await fetchRoomStatus();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const postCheckIn = async (bookingId: string): Promise<void> => {
  const response = await fetch(`/api/staff/bookings/${bookingId}/check-in`, { method: "POST" });
  if (!response.ok) {
    actionMessage.value = "チェックインに失敗しました";
    return;
  }
  actionMessage.value = "チェックインが完了しました";
  await fetchRoomStatus();
};

const postExtension = async (bookingId: string): Promise<void> => {
  const body = { extraMinutes: DEFAULT_EXTENSION_MINUTES };
  const response = await fetch(`/api/staff/bookings/${bookingId}/extension`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    actionMessage.value = "延長リクエストに失敗しました";
    return;
  }
  actionMessage.value = "延長リクエストが送信されました";
  await fetchRoomStatus();
};

const handleCheckIn = async (bookingId: string): Promise<void> => {
  actionMessage.value = "";
  try {
    await postCheckIn(bookingId);
  } catch {
    actionMessage.value = "通信エラーが発生しました";
  }
};

const handleExtension = async (bookingId: string): Promise<void> => {
  actionMessage.value = "";
  try {
    await postExtension(bookingId);
  } catch {
    actionMessage.value = "通信エラーが発生しました";
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 py-10">
      <RouterLink to="/" class="text-sm text-blue-600 hover:underline mb-6 inline-block">
        &larr; ホームに戻る
      </RouterLink>

      <h1 class="text-2xl font-bold text-gray-900 mb-8">スタッフダッシュボード</h1>

      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="staff-studio">
              スタジオID
            </label>
            <input
              id="staff-studio"
              v-model="studioId"
              type="text"
              placeholder="studio-xxx"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="staff-date">
              日付
            </label>
            <input
              id="staff-date"
              v-model="date"
              type="date"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            :disabled="loading"
            @click="loadStatus"
          >
            {{ loading ? "読込中..." : "状況を読み込む" }}
          </button>
        </div>
        <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>
        <p v-if="actionMessage" class="mt-3 text-sm text-green-700">{{ actionMessage }}</p>
      </div>

      <div v-if="rooms.length > 0" class="space-y-4">
        <div
          v-for="room in rooms"
          :key="room.roomId"
          class="bg-white rounded-lg border border-gray-200 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ room.name }}</h2>
              <p class="text-sm text-gray-500">
                定員: {{ room.capacity }}名 / &yen;{{ room.hourlyRate.toLocaleString() }}/時間
              </p>
            </div>
            <span class="text-xs text-gray-400 font-mono">{{ room.roomId }}</span>
          </div>

          <div v-if="room.bookings.length > 0" class="space-y-2">
            <div
              v-for="booking in room.bookings"
              :key="booking.bookingId"
              class="flex items-center justify-between bg-gray-50 rounded-md p-3"
            >
              <div class="flex items-center gap-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="statusColors[booking.status] ?? 'bg-gray-100 text-gray-800'"
                >
                  {{ statusLabels[booking.status] ?? booking.status }}
                </span>
                <span class="text-sm text-gray-900">
                  {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}
                </span>
                <span class="text-xs text-gray-400 font-mono">{{ booking.bookingId }}</span>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="booking.status === 'CONFIRMED'"
                  class="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
                  @click="handleCheckIn(booking.bookingId)"
                >
                  チェックイン
                </button>
                <button
                  v-if="booking.status === 'IN_USE'"
                  class="bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-purple-700"
                  @click="handleExtension(booking.bookingId)"
                >
                  延長リクエスト
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">予約なし</p>
        </div>
      </div>
    </div>
  </div>
</template>
