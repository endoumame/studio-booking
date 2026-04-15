<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref } from "vue";

const route = useRoute();
const router = useRouter();

const roomId = ref((route.query.roomId as string) ?? "");
const startTime = ref((route.query.startTime as string) ?? "");
const endTime = ref((route.query.endTime as string) ?? "");
const memberId = ref("");
const bandId = ref("");
const INITIAL_POINTS = 0;

const paymentMethod = ref("ON_SITE_CASH");
const pointsToUse = ref(INITIAL_POINTS);

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const formatDateTime = (iso: string): string => {
  if (!iso) {
    return "";
  }
  const dt = new Date(iso);
  return dt.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const paymentOptions = [
  { label: "現地現金払い", value: "ON_SITE_CASH" },
  { label: "現地カード払い", value: "ON_SITE_CARD" },
  { label: "オンラインカード払い", value: "ONLINE_CREDIT_CARD" },
] as const;

const validateBookingInputs = (): boolean => {
  if (!memberId.value) {
    errorMessage.value = "会員IDを入力してください";
    return false;
  }
  if (!roomId.value || !startTime.value || !endTime.value) {
    errorMessage.value = "ルーム・時間情報が不足しています";
    return false;
  }
  return true;
};

const buildBookingBody = (): Record<string, unknown> => ({
  bandId: bandId.value || null,
  endTime: endTime.value,
  memberId: memberId.value,
  paymentMethod: paymentMethod.value,
  pointsToUse: pointsToUse.value,
  roomId: roomId.value,
  startTime: startTime.value,
});

const postBooking = async (): Promise<void> => {
  const response = await fetch("/api/bookings", {
    body: JSON.stringify(buildBookingBody()),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    errorMessage.value = data.message ?? "予約の作成に失敗しました";
    return;
  }
  successMessage.value = "予約が作成されました";
};

const submit = async (): Promise<void> => {
  if (!validateBookingInputs()) {
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await postBooking();
  } catch {
    errorMessage.value = "通信エラーが発生しました";
  } finally {
    loading.value = false;
  }
};

const goBack = async (): Promise<void> => {
  await router.push("/bookings/search");
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 py-10">
      <RouterLink
        to="/bookings/search"
        class="text-sm text-blue-600 hover:underline mb-6 inline-block"
      >
        &larr; 検索に戻る
      </RouterLink>

      <h1 class="text-2xl font-bold text-gray-900 mb-8">予約作成</h1>

      <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p class="text-green-800 font-medium">{{ successMessage }}</p>
        <button class="mt-3 text-sm text-green-700 underline" @click="goBack">検索に戻る</button>
      </div>

      <form
        v-else
        class="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
        @submit.prevent="submit"
      >
        <div class="bg-gray-50 rounded-md p-4 border border-gray-100">
          <h2 class="text-sm font-medium text-gray-700 mb-2">予約スロット情報</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt class="text-gray-500">ルームID</dt>
              <dd class="font-medium text-gray-900">{{ roomId }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">開始</dt>
              <dd class="font-medium text-gray-900">{{ formatDateTime(startTime) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">終了</dt>
              <dd class="font-medium text-gray-900">{{ formatDateTime(endTime) }}</dd>
            </div>
          </dl>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="create-member">
            会員ID <span class="text-red-500">*</span>
          </label>
          <input
            id="create-member"
            v-model="memberId"
            type="text"
            placeholder="member-xxx"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="create-band">
            バンドID（任意）
          </label>
          <input
            id="create-band"
            v-model="bandId"
            type="text"
            placeholder="band-xxx"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="create-payment">
            支払い方法
          </label>
          <select
            id="create-payment"
            v-model="paymentMethod"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="opt in paymentOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="create-points">
            使用ポイント
          </label>
          <input
            id="create-points"
            v-model.number="pointsToUse"
            type="number"
            min="0"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? "送信中..." : "予約する" }}
        </button>
      </form>
    </div>
  </div>
</template>
