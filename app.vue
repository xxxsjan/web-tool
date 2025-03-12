<template>
  <div>
    <!-- <NuxtRouteAnnouncer /> -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Analytics />
    <NuxtPath />
  </div>
</template>


<script>
import { Analytics } from '@vercel/analytics/nuxt';
</script>