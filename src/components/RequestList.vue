<template>
  <v-list width="300" max-height="90vh" style="overflow: auto">
    <template v-if="!!computedItems.length">
      <template v-for="item of computedItems">
        <v-fade-transition :key="item.proto.pk" mode="out-in">
          <v-list-item
            v-if="!item.detailed"
            @click="detailed = item.proto.pk"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ item.title }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ item.message }}
              </v-list-item-subtitle>

              <v-list-item-subtitle>
                {{ item.timeAgo }}
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-sheet v-if="!item.stateText">
                <template v-if="item.type == 'receive'">
                  <v-btn
                    icon
                    :disabled="inProgress"
                    :loading="item.accepting"
                    @click.stop="performAccept(item)"
                  >
                    <v-icon>mdi-check</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    :disabled="inProgress"
                    :loading="item.rejecting"
                    @click.stop="performReject(item)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </template>

                <template v-else>
                  <v-btn
                    icon
                    :disabled="inProgress"
                    :loading="item.destroying"
                    @click.stop="performDestroy(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-sheet>

              <v-btn v-else text disabled>{{ item.stateText }}</v-btn>
            </v-list-item-action>
          </v-list-item>

          <v-card v-else outlined @click="detailed = null">
            <v-card-text>
              {{ item.message }}
            </v-card-text>
          </v-card>
        </v-fade-transition>
      </template>
    </template>

    <template v-else>
      <v-list-item>暂无申请</v-list-item>
    </template>
  </v-list>
</template>

<script lang="ts">
import { TickMixin } from "@/mixins";
import * as models from "@/models";
import { Component, Mixins, Prop } from "vue-property-decorator";
import * as timeago from "timeago.js";

type State = number | string | null;

export interface RequestListItem {
  source: string;
  target: string;
  message: string;
  date: Date;
  type: "send" | "receive";
  state: models.RequestState;
  proto: models.Model;
}

export interface ComputedRequestListItem extends RequestListItem {
  title: string;
  timeAgo: string;
  stateText: string | null;
  accepting: boolean;
  rejecting: boolean;
  destroying: boolean;
  detailed: boolean;
}

@Component
export default class RequestList extends Mixins(TickMixin) {
  @Prop({ type: Array, required: true }) items!: RequestListItem[];
  @Prop({ type: Function, required: true }) accept!: (
    item: RequestListItem
  ) => Promise<void>;
  @Prop({ type: Function, required: true }) reject!: (
    item: RequestListItem
  ) => Promise<void>;
  @Prop({ type: Function, required: true }) destroy!: (
    item: RequestListItem
  ) => Promise<void>;

  accepting: State = null;
  rejecting: State = null;
  destroying: State = null;
  detailed: State = null;

  get inProgress() {
    return !!this.accepting || !!this.rejecting || !!this.destroying;
  }

  get computedItems(): ComputedRequestListItem[] {
    this.tick;

    return this.items.map((v) => ({
      ...v,
      title:
        v.type == "send"
          ? `${v.source} -> ${v.target}`
          : `${v.target} <- ${v.source}`,
      timeAgo: timeago.format(v.date, "zh_CN"),
      stateText:
        v.state == models.RequestState.Pending
          ? null
          : v.state == models.RequestState.Accepted
          ? "已接受"
          : "已拒绝",
      accepting: this.accepting == v.proto.pk,
      rejecting: this.rejecting == v.proto.pk,
      destroying: this.destroying == v.proto.pk,
      detailed: this.detailed == v.proto.pk,
    }));
  }

  async performAccept(item: RequestListItem) {
    try {
      this.accepting = item.proto.pk;
      await this.accept(item);
    } finally {
      this.accepting = null;
    }
  }

  async performReject(item: RequestListItem) {
    try {
      this.rejecting = item.proto.pk;
      await this.reject(item);
    } finally {
      this.rejecting = null;
    }
  }

  async performDestroy(item: RequestListItem) {
    try {
      this.destroying = item.proto.pk;
      await this.destroy(item);
    } catch {
      this.destroying = null;
    }
  }
}
</script>