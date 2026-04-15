<script setup lang="ts">
import { ref } from "vue";

interface BookingHistoryItem {
  readonly bookingId: string;
  readonly roomId: string;
  readonly status: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly totalAmount: number;
  readonly paymentMethod: string | null;
  readonly paymentStatus: string | null;
  readonly createdAt: string;
}

const memberId = ref("");
const bookings = ref<BookingHistoryItem[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const hasSearched = ref(false);

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

const formatDateTime = (iso: string): string => {
  const dt = new Date(iso);
  return dt.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fetchHistory = async (): Promise<void> => {
  const params = new URLSearchParams({ memberId: memberId.value });
  const response = await fetch(`/api/bookings?${params.toString()}`);
  if (!response.ok) {
    errorMessage.value = "履歴の取得に失敗しました";
    return;
  }
  const data = (await response.json()) as BookingHistoryItem[];
  bookings.value = data;
};

const search = async (): Promise<void> => {
  if (!memberId.value) {
    errorMessage.value = "会員IDを入力してください";
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  hasSearched.value = true;
  try {
    await fetchHistory();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-10">
      <RouterLink to="/" class="text-sm text-blue-600 hover:underline mb-6 inline-block">
        &larr; ホームに戻る
      </RouterLink>

      <h1 class="text-2xl font-bold text-gray-900 mb-8">予約履歴</h1>

      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1" for="history-member">
              会員ID
            </label>
            <input
              id="history-member"
              v-model="memberId"
              type="text"
              placeholder="member-xxx"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="search"
            />
          </div>
          <button
            class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            :disabled="loading"
            @click="search"
          >
            {{ loading ? "検索中..." : "検索" }}
          </button>
        </div>
        <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>
      </div>

      <div v-if="bookings.length > 0" class="space-y-3">
        <div
          v-for="booking in bookings"
          :key="booking.bookingId"
          class="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400 font-mono">{{ booking.bookingId }}</span>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="statusColors[booking.status] ?? 'bg-gray-100 text-gray-800'"
            >
              {{ statusLabels[booking.status] ?? booking.status }}
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p class="text-gray-500">ルーム</p>
              <p class="font-medium text-gray-900">{{ booking.roomId }}</p>
            </div>
            <div>
              <p class="text-gray-500">開始</p>
              <p class="font-medium text-gray-900">{{ formatDateTime(booking.startTime) }}</p>
            </div>
            <div>
              <p class="text-gray-500">終了</p>
              <p class="font-medium text-gray-900">{{ formatDateTime(booking.endTime) }}</p>
            </div>
            <div>
              <p class="text-gray-500">合計金額</p>
              <p class="font-medium text-gray-900">
                &yen;{{ booking.totalAmount.toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p v-else-if="hasSearched && !loading && !errorMessage" class="text-sm text-gray-500">
        予約履歴が見つかりませんでした
      </p>
    </div>
  </div>
</template>
