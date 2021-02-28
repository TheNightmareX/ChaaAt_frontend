<template>
  <v-menu offset-y nudge-bottom="5">
    <template #activator="{ on }">
      <v-text-field
        prepend-icon="mdi-magnify"
        hide-details
        v-on="on"
        style="cursor: text"
      ></v-text-field>
    </template>
  </v-menu>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class SearchToolbar extends Vue {}
</script>