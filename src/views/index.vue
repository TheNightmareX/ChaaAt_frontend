<template>
  <v-sheet class="fill-height" v-if="$context.user">
    <v-app-bar color="primary" dark app clipped-left>
      <v-app-bar-nav-icon
        @click="navigationDrawerOpen = !navigationDrawerOpen"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>
        {{ currentConcact ? currentConcact.title : "ChaaAt" }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-menu
        min-width="300"
        max-width="300"
        offset-y
        transition="scale-transition"
        origin="top right"
      >
        <template #activator="{ attrs, on }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </template>

        <ProfileCard :user="$context.user">
          <template #actions>
            <v-list class="py-0" style="width: 100%">
              <ProfileEditDialog>
                <template #activator="{ attrs, on }">
                  <v-list-item v-bind="attrs" v-on="on">
                    <v-list-item-icon>
                      <v-icon>mdi-account-edit</v-icon>
                    </v-list-item-icon>

                    <v-list-item-title>编辑资料</v-list-item-title>
                  </v-list-item>
                </template>
              </ProfileEditDialog>

              <v-list-item @click="logout()">
                <v-list-item-icon>
                  <v-icon>mdi-exit-to-app</v-icon>
                </v-list-item-icon>

                <v-list-item-title>退出登录</v-list-item-title>
              </v-list-item>
            </v-list>
          </template>
        </ProfileCard>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer v-model="navigationDrawerOpen" width="270" app clipped>
      <v-sheet class="fill-height d-flex flex-column">
        <v-sheet>
          <v-tabs v-model="sidebarTab" grow>
            <v-tab>最近</v-tab>

            <v-tab>好友</v-tab>

            <v-tab>群聊</v-tab>
          </v-tabs>
        </v-sheet>

        <v-tabs-items
          class="tab-items flex-grow fill-height"
          v-model="sidebarTab"
        >
          <v-tab-item class="fill-height">
            <ContactList
              v-model="chatroom"
              :items="recentContacts"
              :sorter="recentContactSorter"
            ></ContactList>
          </v-tab-item>

          <v-tab-item
            class="fill-height"
            v-for="[i, data] of [
              {
                text: { requests: '好友申请', destroy: '删除好友' },
                items: friendshipContacts,
                destroy: destroyFriendship,
                groups: { items: friendshipGroups, save: saveFriendshipGroups },
                requests: {
                  items: friendshipRequestListItems,
                  accept: acceptFriendshipRequest,
                  reject: rejectFriendshipRequest,
                  destroy: destroyFriendshipRequest,
                },
              },
              {
                text: { requests: '成员申请', destroy: '退出群聊' },
                items: membershipContacts,
                destroy: destroyMembership,
                groups: { items: membershipGroups, save: saveMembershipGroups },
                requests: {
                  items: membershipRequestListItems,
                  accept: acceptMembershipRequest,
                  reject: rejectMembershipRequest,
                  destroy: destroyMembershipRequest,
                },
              },
            ].entries()"
            :key="i"
          >
            <ContactList
              v-model="chatroom"
              :items="data.items"
              :groups="data.groups.items"
              @change="addRecentContact"
            >
              <template #prepend>
                <v-list dense>
                  <v-menu offset-x :close-on-content-click="false">
                    <template #activator="{ attrs, on }">
                      <v-list-item v-bind="attrs" v-on="on">
                        <v-list-item-title>
                          {{ data.text.requests }}
                        </v-list-item-title>

                        <v-list-item-icon>
                          <v-icon>mdi-chevron-right</v-icon>
                        </v-list-item-icon>
                      </v-list-item>
                    </template>

                    <RequestList
                      :items="data.requests.items"
                      :accept="(item) => data.requests.accept(item.proto)"
                      :reject="(item) => data.requests.reject(item.proto)"
                      :destroy="(item) => data.requests.destroy(item.proto)"
                    ></RequestList>
                  </v-menu>
                </v-list>
              </template>

              <template #menu="{ item, close }">
                <v-list>
                  <v-menu
                    open-on-hover
                    :close-on-content-click="$context.isMobile"
                    offset-x
                    nudge-top="9"
                    max-height="90%"
                  >
                    <template #activator="{ attrs, on }">
                      <v-list-item v-bind="attrs" v-on="on">
                        <v-list-item-title>分组</v-list-item-title>

                        <v-list-item-icon>
                          <v-icon>mdi-chevron-right</v-icon>
                        </v-list-item-icon>
                      </v-list-item>
                    </template>

                    <GroupSelectList
                      v-model="item.proto.groups"
                      :items="data.groups.items"
                      :save="() => data.groups.save(item.proto)"
                    ></GroupSelectList>
                  </v-menu>

                  <v-list-item
                    @click="
                      data.destroy(item.proto);
                      close();
                    "
                  >
                    {{ data.text.destroy }}
                  </v-list-item>
                </v-list>
              </template>
            </ContactList>
          </v-tab-item>
        </v-tabs-items>
      </v-sheet>
    </v-navigation-drawer>

    <v-main class="fill-height">
      <v-sheet v-if="!!chatroom" class="fill-height d-flex flex-column">
        <Messages
          class="flex-grow-1"
          :items="contextMessages"
          :chatroom="chatroom"
          :markRead="markRead"
          style="height: 0; overflow: auto"
        ></Messages>

        <MessageInput
          :maxLength="1000"
          :send="(text) => sendMessage(text)"
        ></MessageInput>
      </v-sheet>

      <v-sheet v-else class="pt-12">
        <v-container>
          <v-row justify="center">
            <v-icon size="80">mdi-alert-circle-outline</v-icon>
          </v-row>

          <v-row justify="center">
            <v-sheet class="text-h6 text--secondary">未选择会话</v-sheet>
          </v-row>
        </v-container>
      </v-sheet>
    </v-main>
  </v-sheet>
</template>

<script lang="ts">
import ContactList, {
  ComputedContact,
  Contact,
} from "@/components/ContactList.vue";
import GroupManagementLists from "@/components/GroupManagementLists.vue";
import GroupSelectList from "@/components/GroupSelectList.vue";
import MessageInput from "@/components/MessageInput.vue";
import Messages from "@/components/Messages.vue";
import ProfileCard from "@/components/ProfileCard.vue";
import ProfileEditDialog from "@/components/ProfileEditDialog.vue";
import RequestList, { RequestListItem } from "@/components/RequestList.vue";
import Searcher from "@/components/Searcher.vue";
import * as models from "@/models";
import { Component, Mixins, Vue, Watch } from "vue-property-decorator";
import { VDialog, VMenu } from "vuetify/lib";

enum SidebarTab {
  Recent,
  Friends,
  Chatrooms,
}

function action(msg: string) {
  return (
    target: Vue,
    propertyKey: PropertyKey,
    descriptor: PropertyDescriptor
  ) => {
    const fn: Function = descriptor.value;

    descriptor.value = async function (
      this: typeof target,
      // eslint-disable-next-line
      ...args: any[]
    ) {
      try {
        return await fn.call(this, ...args);
      } catch {
        this.$notifier.error(msg);
      }
    };

    return descriptor;
  };
}

@Component
class Data extends Vue {
  get friendships() {
    return models.FriendshipResourceHandler.objects.all;
  }

  get memberships() {
    return models.ChatroomMembershipResourceHandler.objects.all;
  }

  get friendshipRequests() {
    return models.FriendshipRequestResourceHandler.objects.all;
  }

  get membershipRequests() {
    return models.ChatroomMembershipRequestResourceHandler.objects.all;
  }

  get friendshipGroups() {
    return models.FriendshipGroupResourceHandler.objects.all;
  }

  get membershipGroups() {
    return models.ChatroomMembershipGroupResourceHandler.objects.all;
  }

  get messages() {
    return models.MessageResourceHandler.objects.all;
  }
}

@Component
class Handlers extends Vue {
  get friendshipGroupResourceHandler() {
    return new models.FriendshipGroupResourceHandler();
  }

  get membershipGroupResourceHandler() {
    return new models.ChatroomMembershipGroupResourceHandler();
  }

  get friendshipResourceHandler() {
    return new models.FriendshipResourceHandler({
      expand: ["target", "chatroom.creator"],
    });
  }

  get membershipResourceHandler() {
    return new models.ChatroomMembershipResourceHandler({
      expand: ["user", "chatroom.creator"],
    });
  }

  get friendshipRequestResourceHandler() {
    return new models.FriendshipRequestResourceHandler({
      expand: ["user", "target"],
    });
  }

  get membershipRequestResourceHandler() {
    return new models.ChatroomMembershipRequestResourceHandler({
      expand: ["user", "chatroom.creator"],
    });
  }

  get messageResourceHandler() {
    return new models.MessageResourceHandler();
  }
}

@Component({
  components: {
    ProfileCard,
    ProfileEditDialog,
    Searcher,
    GroupManagementLists,
    GroupSelectList,
    ContactList,
    RequestList,
    Messages,
    MessageInput,

    VMenu,
    VDialog,
  },
})
export default class Index extends Mixins(Data, Handlers) {
  sidebarTab = SidebarTab.Recent;
  navigationDrawerOpen: boolean | null = null;

  ws!: WebSocket;

  chatroom: models.Chatroom | null = null;

  recentContacts: Contact[] = [];
  recentContactSorter: (a: ComputedContact, b: ComputedContact) => number = (
    a,
    b
  ) => {
    if (a.latestMessage.instance && b.latestMessage.instance)
      return -(
        a.latestMessage.instance.creationTime.getTime() -
        b.latestMessage.instance.creationTime.getTime()
      );
    else if (a.latestMessage.instance) return -1;
    else if (b.latestMessage.instance) return 1;
    else return 0;
  };

  get currentConcact() {
    return this.chatroom ? this.getConcactFromChatroom(this.chatroom) : null;
  }

  get currentMembership() {
    const chatroom = this.chatroom;
    return chatroom
      ? this.memberships.find(
          (v) =>
            v.chatroom.pk == chatroom.pk && v.user.pk == this.$context.user.pk
        )
      : null;
  }

  get friendshipContacts(): Contact[] {
    return this.friendships.reverse().map((v) => ({
      title: v.nickname || v.target.username,
      chatroom: v.chatroom,
      proto: v,
    }));
  }

  get membershipContacts(): Contact[] {
    return this.memberships
      .filter(
        (v) =>
          !v.chatroom.friendshipExclusive && v.user.pk == this.$context.user.pk
      )
      .reverse()
      .map((v) => ({
        title: v.chatroom.name,
        chatroom: v.chatroom,
        proto: v,
      }));
  }

  get friendshipRequestListItems(): RequestListItem[] {
    return this.friendshipRequests.reverse().map((v) => ({
      source: v.user.username,
      target: v.target.username,
      message: v.message,
      date: v.creationTime,
      type: v.user.pk == this.$context.user.pk ? "send" : "receive",
      state: v.state,
      proto: v,
    }));
  }

  get membershipRequestListItems(): RequestListItem[] {
    return this.membershipRequests.reverse().map((v) => ({
      source: v.user.username,
      target: v.chatroom.name,
      message: v.message,
      date: v.creationTime,
      type: v.user.pk == this.$context.user.pk ? "send" : "receive",
      state: v.state,
      proto: v,
    }));
  }

  get contextMessages() {
    return this.messages.filter((v) => v.chatroom.pk == this.chatroom?.pk);
  }

  @Watch("messages")
  onMessagesUpdate(to: models.Message[], from: models.Message[]) {
    to.slice(from.length).forEach((message) => {
      const contact = this.getConcactFromChatroom(message.chatroom);
      if (!contact) throw Error();

      this.addRecentContact(contact);
    });
  }

  async logout() {
    await new models.AuthHandler().logout();
    // @ts-expect-error
    this.$context.user = null;
    this.$router.push({ name: "Login" });
  }

  addRecentContact(item?: Contact) {
    if (!item || this.recentContacts.some((v) => v.proto.pk == item.proto.pk))
      return;

    this.recentContacts.push(item);

    const MAX_LENGTH = 15;
    if (this.recentContacts.length >= MAX_LENGTH)
      this.recentContacts = this.recentContacts.slice(
        this.recentContacts.length - MAX_LENGTH
      );
  }

  getConcactFromChatroom(chatroom: models.Chatroom) {
    return (chatroom.friendshipExclusive
      ? this.friendshipContacts
      : this.membershipContacts
    ).find((v) => v.chatroom.pk == chatroom.pk);
  }

  @action("分组更新失败")
  async saveFriendshipGroups(instance: models.Friendship) {
    await this.friendshipResourceHandler.partialUpdate(instance.pk, {
      groups: instance.groups,
    });
  }

  @action("分组更新失败")
  async saveMembershipGroups(instance: models.ChatroomMembership) {
    await this.membershipResourceHandler.partialUpdate(instance.pk, {
      groups: instance.groups,
    });
  }

  @action("好友删除失败")
  async destroyFriendship(instance: models.Friendship) {
    await this.friendshipResourceHandler.destroy(instance.pk);
  }

  @action("群聊退出失败")
  async destroyMembership(instance: models.ChatroomMembership) {
    await this.membershipResourceHandler.destroy(instance.pk);
  }

  @action("申请接受失败")
  async acceptFriendshipRequest(instance: models.FriendshipRequest) {
    await this.friendshipRequestResourceHandler.accept(instance.pk);
  }

  @action("申请接受失败")
  async acceptMembershipRequest(instance: models.ChatroomMembershipRequest) {
    await this.membershipRequestResourceHandler.accept(instance.pk);
  }

  @action("申请拒绝失败")
  async rejectFriendshipRequest(instance: models.FriendshipRequest) {
    await this.friendshipRequestResourceHandler.reject(instance.pk);
  }

  @action("申请拒绝失败")
  async rejectMembershipRequest(instance: models.ChatroomMembershipRequest) {
    await this.membershipRequestResourceHandler.reject(instance.pk);
  }

  @action("申请删除失败")
  async destroyFriendshipRequest(instance: models.FriendshipRequest) {
    await this.friendshipRequestResourceHandler.destroy(instance.pk);
  }

  @action("申请删除失败")
  async destroyMembershipRequest(instance: models.ChatroomMembershipRequest) {
    await this.membershipRequestResourceHandler.destroy(instance.pk);
  }

  @action("消息发送失败")
  async sendMessage(text: string) {
    if (!this.chatroom) throw Error();

    await this.messageResourceHandler.create({
      chatroom: this.chatroom,
      text,
    });
  }

  @action("标记已读失败")
  async markRead() {
    if (!this.currentMembership) throw Error();

    await this.membershipResourceHandler.read(this.currentMembership.pk);
  }

  async created() {
    this.ws = new models.UpdateWebSocket({
      Message: () => this.messageResourceHandler,
      Friendship: () => this.friendshipResourceHandler,
      ChatroomMembership: () => this.membershipResourceHandler,
      FriendshipRequest: () => this.friendshipRequestResourceHandler,
      ChatroomMembershipRequest: () => this.membershipRequestResourceHandler,
    });
    this.friendshipGroupResourceHandler.list();
    this.membershipGroupResourceHandler.list();
    this.friendshipResourceHandler.list();
    this.membershipResourceHandler.list();
    this.friendshipRequestResourceHandler.list({ page: 1 });
    this.membershipRequestResourceHandler.list({ page: 1 });
    this.messageResourceHandler.list();
  }

  destroyed() {
    this.ws.close();
  }
}
</script>