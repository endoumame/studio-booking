<script setup lang="ts">
const cards = [
  {
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    description: "スタジオの空き状況を検索して予約",
    icon: "i-carbon-search",
    iconColor: "text-blue-600",
    path: "/bookings/search",
    title: "予約検索",
  },
  {
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    description: "過去の予約を確認",
    icon: "i-carbon-time",
    iconColor: "text-amber-600",
    path: "/bookings/history",
    title: "予約履歴",
  },
  {
    color: "bg-green-50 border-green-200 hover:border-green-400",
    description: "ルームの状況管理・チェックイン",
    icon: "i-carbon-dashboard",
    iconColor: "text-green-600",
    path: "/staff",
    title: "スタッフダッシュボード",
  },
  {
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    description: "スタジオ・ルームの管理",
    icon: "i-carbon-settings",
    iconColor: "text-purple-600",
    path: "/admin/studios",
    title: "管理画面",
  },
] as const;

export type HomeCard = (typeof cards)[number];
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-16">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">スタジオ予約システム</h1>
      <p class="text-gray-500 mb-10">メニューを選択してください</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RouterLink
          v-for="card in cards"
          :key="card.path"
          :to="card.path"
          class="block rounded-lg border p-6 transition-colors"
          :class="card.color"
        >
          <div class="flex items-start gap-4">
            <div class="text-2xl" :class="[card.icon, card.iconColor]" />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ card.title }}</h2>
              <p class="mt-1 text-sm text-gray-600">{{ card.description }}</p>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
