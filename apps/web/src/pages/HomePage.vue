<script setup lang="ts">
import { RouterLink } from "vue-router";

interface NavItem {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

const navItems: NavItem[] = [
  {
    description: "空き状況を検索して予約",
    icon: "i-carbon-search",
    path: "/bookings/search",
    title: "スタジオ検索・予約",
  },
  {
    description: "予約履歴の確認",
    icon: "i-carbon-list",
    path: "/bookings/history",
    title: "予約履歴",
  },
  {
    description: "チェックイン・延長承認",
    icon: "i-carbon-dashboard",
    path: "/staff",
    title: "スタッフ管理",
  },
  {
    description: "スタジオ・部屋の管理",
    icon: "i-carbon-settings",
    path: "/admin/studios",
    title: "管理者設定",
  },
];
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-gray-900">スタジオ予約システム</h1>
        <p class="mt-1 text-sm text-gray-500">リハーサルスタジオのオンライン予約</p>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <nav class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div class="flex items-center gap-3 mb-2">
            <div :class="[item.icon, 'text-xl text-blue-600']" />
            <h2 class="text-lg font-semibold text-gray-900">{{ item.title }}</h2>
          </div>
          <p class="text-sm text-gray-500">{{ item.description }}</p>
        </RouterLink>
      </nav>
    </main>
  </div>
</template>
