<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from "vue-router";
import { computed, ref } from "vue";

const PAYMENT_METHODS = [
  { label: "現地払い（現金）", value: "ON_SITE_CASH" },
  { label: "現地払い（カード）", value: "ON_SITE_CARD" },
  { label: "オンライン決済（クレジットカード）", value: "ONLINE_CREDIT_CARD" },
] as const;

const DEFAULT_POINTS = 0;

interface BookingResponse {
  readonly bookingId: string;
  readonly status: string;
}

const route = useRoute();
const router = useRouter();

const slotRoomId = computed(() => String(route.query["roomId"] ?? ""));
const slotStartTime = computed(() => String(route.query["startTime"] ?? ""));
const slotEndTime = computed(() => String(route.query["endTime"] ?? ""));

const memberId = ref("");
const bandId = ref("");
const paymentMethod = ref("ON_SITE_CASH");
const pointsToUse = ref(DEFAULT_POINTS);
const loading = ref(false);
const errorMessage = ref("");
const successBookingId = ref("");

const formatDateTime = (iso: string): string => {
  if (iso === "") {
    return "";
  }
  const parsed = new Date(iso);
  return parsed.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const buildRequestBody = (): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    endTime: slotEndTime.value,
    memberId: memberId.value,
    paymentMethod: paymentMethod.value,
    pointsToUse: pointsToUse.value,
    roomId: slotRoomId.value,
    startTime: slotStartTime.value,
  };
  if (bandId.value !== "") {
    body["bandId"] = bandId.value;
  }
  return body;
};

const submitBooking = async (): Promise<BookingResponse> => {
  const response = await fetch("/api/bookings", {
    body: JSON.stringify(buildRequestBody()),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text === "" ? `予約に失敗しました (${String(response.status)})` : text);
  }
  return await response.json();
};

const handleSubmit = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const result = await submitBooking();
    successBookingId.value = result.bookingId;
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : "不明なエラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const goToHistory = async (): Promise<void> => {
  await router.push("/bookings/history");
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
        <RouterLink to="/bookings/search" class="text-gray-400 hover:text-gray-600">
          <div class="i-carbon-arrow-left text-xl" />
        </RouterLink>
        <h1 class="text-xl font-bold text-gray-900">予約作成</h1>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
      <div
        v-if="successBookingId !== ''"
        class="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
      >
        <div class="i-carbon-checkmark-filled text-3xl text-green-600 mx-auto mb-3" />
        <h2 class="text-lg font-semibold text-green-800 mb-2">予約が完了しました</h2>
        <p class="text-sm text-green-700 mb-4">予約ID: {{ successBookingId }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          @click="goToHistory"
        >
          予約履歴を確認
        </button>
      </div>

      <template v-else>
        <section class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 class="text-sm font-medium text-gray-500 mb-3">選択されたスロット</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-gray-500">部屋ID</dt>
              <dd class="font-medium text-gray-900">{{ slotRoomId }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">開始</dt>
              <dd class="font-medium text-gray-900">{{ formatDateTime(slotStartTime) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">終了</dt>
              <dd class="font-medium text-gray-900">{{ formatDateTime(slotEndTime) }}</dd>
            </div>
          </dl>
        </section>

        <div
          v-if="errorMessage !== ''"
          class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>

        <form
          class="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label for="member-id" class="block text-sm font-medium text-gray-700 mb-1"
              >会員ID</label
            >
            <input
              id="member-id"
              v-model="memberId"
              type="text"
              required
              placeholder="会員IDを入力"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="band-id" class="block text-sm font-medium text-gray-700 mb-1"
              >バンドID（任意）</label
            >
            <input
              id="band-id"
              v-model="bandId"
              type="text"
              placeholder="バンドIDを入力（任意）"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="payment-method" class="block text-sm font-medium text-gray-700 mb-1"
              >支払方法</label
            >
            <select
              id="payment-method"
              v-model="paymentMethod"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="method in PAYMENT_METHODS" :key="method.value" :value="method.value">
                {{ method.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="points" class="block text-sm font-medium text-gray-700 mb-1"
              >使用ポイント</label
            >
            <input
              id="points"
              v-model.number="pointsToUse"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            :disabled="loading || memberId === ''"
            class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">送信中...</span>
            <span v-else>予約する</span>
          </button>
        </form>
      </template>
    </main>
  </div>
</template>
