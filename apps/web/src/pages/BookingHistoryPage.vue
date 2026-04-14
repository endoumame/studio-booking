<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref } from "vue";

interface BookingSummary {
  readonly bookingId: string;
  readonly roomId: string;
  readonly status: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly totalAmount: number;
  readonly createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-red-100 text-red-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_USE: "bg-purple-100 text-purple-800",
  TENTATIVE: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: "支払待ち",
  CANCELLED: "キャンセル",
  CHECKED_IN: "チェックイン済",
  COMPLETED: "完了",
  CONFIRMED: "確定",
  IN_USE: "利用中",
  TENTATIVE: "仮予約",
};

const DEFAULT_STYLE = "bg-gray-100 text-gray-800";

const memberId = ref("");
const bookings = ref<BookingSummary[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const searched = ref(false);

const formatDateTime = (iso: string): string => {
  const parsed = new Date(iso);
  return parsed.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const statusStyle = (status: string): string => STATUS_STYLES[status] ?? DEFAULT_STYLE;

const statusLabel = (status: string): string => STATUS_LABELS[status] ?? status;

const fetchBookings = async (memberIdValue: string): Promise<BookingSummary[]> => {
  const params = new URLSearchParams({ memberId: memberIdValue });
  const response = await fetch(`/api/bookings?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`取得に失敗しました (${String(response.status)})`);
  }
  return await response.json();
};

const searchHistory = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = "";
  searched.value = true;

  try {
    bookings.value = await fetchBookings(memberId.value);
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    loading.value = false;
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
        <h1 class="text-xl font-bold text-gray-900">予約履歴</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6">
      <form
        class="bg-white rounded-lg border border-gray-200 p-4 mb-6"
        @submit.prevent="searchHistory"
      >
        <div class="flex gap-4">
          <div class="flex-1">
            <label for="history-member" class="block text-sm font-medium text-gray-700 mb-1"
              >会員ID</label
            >
            <input
              id="history-member"
              v-model="memberId"
              type="text"
              required
              placeholder="会員IDを入力"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              :disabled="loading || memberId === ''"
              class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        v-if="searched && !loading && bookings.length === 0 && errorMessage === ''"
        class="text-center py-12 text-gray-500"
      >
        <div class="i-carbon-document text-4xl mx-auto mb-2" />
        <p>予約が見つかりませんでした</p>
      </div>

      <div v-if="bookings.length > 0" class="space-y-3">
        <article
          v-for="booking in bookings"
          :key="booking.bookingId"
          class="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div class="flex items-start justify-between mb-2">
            <p class="text-xs text-gray-400 font-mono">{{ booking.bookingId }}</p>
            <span
              :class="[statusStyle(booking.status), 'px-2 py-0.5 text-xs font-medium rounded-full']"
            >
              {{ statusLabel(booking.status) }}
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <p class="text-gray-500">部屋</p>
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
              <p class="text-gray-500">金額</p>
              <p class="font-medium text-gray-900">
                &yen;{{ booking.totalAmount.toLocaleString() }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
