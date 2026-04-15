/* oxlint-disable require-await, typescript-eslint/explicit-function-return-type */
import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { component: HomePage, path: "/" },
    { component: async () => import("../pages/BookingSearchPage.vue"), path: "/bookings/search" },
    { component: async () => import("../pages/BookingCreatePage.vue"), path: "/bookings/create" },
    { component: async () => import("../pages/BookingHistoryPage.vue"), path: "/bookings/history" },
    { component: async () => import("../pages/StaffDashboardPage.vue"), path: "/staff" },
    { component: async () => import("../pages/AdminStudioPage.vue"), path: "/admin/studios" },
  ],
});
