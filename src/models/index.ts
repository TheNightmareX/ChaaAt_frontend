import { Component } from "vue-property-decorator";
import {
  AbstractResourceHandler,
  BaseHTTPHandler,
  Model,
  PK,
  QueryParams,
  RelatedLookupMap,
  RootResourceHandler,
} from "./handlers";
import { ResourceStore } from "./store";

export { Model, PK };

// types

export type UpdatableModelName =
  | "Message"
  | "Friendship"
  | "ChatroomMembership"
  | "FriendshipRequest"
  | "ChatroomMembershipRequest";

export enum RequestState {
  Pending = "P",
  Accepted = "A",
  Rejected = "R",
}

export enum SexOption {
  Male = "M",
  Female = "F",
  Unknow = "X",
}

export interface ModelUpdateMessage {
  model: UpdatableModelName;
  pk: PK;
  event: "create" | "update" | "delete";
  parents: Record<string, PK>;
}

export interface AuthInfo extends Model {
  username: string;
}

// base models

export interface Request extends Model {
  user: User;
  message: string;
  state: RequestState;
  creationTime: Date;
}

// specific models

export interface Group extends Model {
  name: string;
  itemCount: number;
}

export interface User extends Model {
  username: string;
  sex: SexOption;
  bio: string;
}

export interface Chatroom extends Model {
  creator: User;
  name: string;
  friendshipExclusive: boolean;
  creationTime: Date;
}

export interface ChatroomMembership extends Model {
  user: User;
  chatroom: Chatroom;
  groups: Group[] | null;
  isManager: boolean;
  creationTime: Date;
}

export interface ChatroomMembershipRequest extends Request {
  chatroom: Chatroom;
}

export interface Message extends Model {
  senderMembership: ChatroomMembership;
  chatroom: Chatroom;
  text: string;
  read: boolean;
  creationTime: Date;
}

export interface Friendship extends Model {
  target: User;
  chatroom: Chatroom;
  groups: Group[] | null;
  nickname: string | null;
  important: boolean;
  creationTime: Date;
}

export interface FriendshipRequest extends Request {
  target: User;
}

// specific stores

@Component
export class GroupResourceStore extends ResourceStore<Group> {
  get validations() {
    return {
      required: (v: string) => !!v || "不得为空",

      maxLength: (v: string) => v.length <= 20 || "0-20个字符",
      unique: (v: string) =>
        !this.all.some((group) => group.name == v) || "已存在",
    };
  }
}

@Component
export class MessageResourceStore extends ResourceStore<Message> {
  get latest(): (chatroom: Chatroom) => Message | null {
    this.all;

    return (chatroom) =>
      this.all.filter((v) => v.chatroom.pk == chatroom.pk).slice(-1)[0] ?? null;
  }
}

// base handlers

abstract class RequestResourceHandler<
  M extends Request,
  W extends Partial<M>,
  Q extends QueryParams = {}
> extends RootResourceHandler<M, W, Q> {
  async accept(pk: PK) {
    await this.http.post<void>(
      this.getURL(pk, "accept"),
      null,
      this.getRequestConfig()
    );

    this.objects.commit(
      pk,
      { state: RequestState.Accepted } as Partial<M>,
      true
    );
  }

  async reject(pk: PK) {
    await this.http.post<void>(
      this.getURL(pk, "reject"),
      null,
      this.getRequestConfig()
    );

    this.objects.commit(
      pk,
      { state: RequestState.Rejected } as Partial<M>,
      true
    );
  }
}

// specific handlers

export class AuthHandler extends BaseHTTPHandler {
  static readonly validations = {
    username: (v: string) =>
      /^[0-9a-zA-Z@.+-_]{1,10}$/.test(v) ||
      "1-10个字符 只能包含：数字 字母 @ . + - _",

    password: (v: string) => /^.{6,20}$/.test(v) || "6-20个字符",
  };

  static readonly URL = "/auth/";

  async getAuthInfo() {
    return (await this.http.get<AuthInfo>(AuthHandler.URL)).data;
  }

  async login(username: string, password: string) {
    return (
      await this.http.post<AuthInfo>(AuthHandler.URL, { username, password })
    ).data;
  }

  async logout() {
    await this.http.delete<void>(AuthHandler.URL);
  }
}

export class UserResourceHandler extends RootResourceHandler<
  User,
  {
    username: User["username"];
    password: string;
    sex?: User["sex"];
    bio?: User["bio"];
  },
  { search: string }
> {
  static readonly basename = "users";
  static readonly objects = new ResourceStore<User>();
}

export class ChatroomResourceHandler extends RootResourceHandler<
  Chatroom,
  { name: Chatroom["name"] },
  { friendship_exclusive: boolean }
> {
  static readonly basename = "chatrooms";
  static readonly objects = new ResourceStore<Chatroom>();
  static readonly relatedLookupMap: RelatedLookupMap<Chatroom> = {
    creator: UserResourceHandler,
  };
}

export class ChatroomMembershipGroupResourceHandler extends RootResourceHandler<
  Group,
  { name: Group["name"] }
> {
  static readonly basename = "membership-groups";
  static readonly objects = new GroupResourceStore();
}

export class ChatroomMembershipResourceHandler extends RootResourceHandler<
  ChatroomMembership,
  {
    chatroom: ChatroomMembership["chatroom"];
    groups: ChatroomMembership["groups"];
  },
  { user: PK; chatroom: PK; groups: PK }
> {
  static readonly basename = "memberships";
  static readonly objects = new ResourceStore<ChatroomMembership>();
  static readonly relatedLookupMap: RelatedLookupMap<ChatroomMembership> = {
    user: UserResourceHandler,
    chatroom: ChatroomResourceHandler,
    groups: ChatroomMembershipGroupResourceHandler,
  };

  async promote(pk: PK) {
    await this.http.post<void>(this.getURL(pk, "promote"));
    this.objects.commit(pk, { isManager: true }, true);
  }

  async demote(pk: PK) {
    await this.http.post<void>(this.getURL(pk, "demote"));
    this.objects.commit(pk, { isManager: false }, true);
  }

  async read(pk: PK) {
    await this.http.post<void>(this.getURL(pk, "read"));
  }
}

export class ChatroomMembershipRequestResourceHandler extends RequestResourceHandler<
  ChatroomMembershipRequest,
  {
    chatroom: ChatroomMembershipRequest["chatroom"];
    message: ChatroomMembershipRequest["message"];
  },
  { state: RequestState; user: PK; chatroom: PK }
> {
  static readonly basename = "membership-requests";
  static readonly objects = new ResourceStore<ChatroomMembershipRequest>();
  static readonly relatedLookupMap: RelatedLookupMap<
    ChatroomMembershipRequest
  > = {
    user: UserResourceHandler,
    chatroom: ChatroomResourceHandler,
  };
}

export class MessageResourceHandler extends RootResourceHandler<
  Message,
  { chatroom: Message["chatroom"]; text: Message["text"] },
  { senderMembership: PK }
> {
  static readonly basename = "messages";
  static readonly objects = new MessageResourceStore();
  static readonly relatedLookupMap: RelatedLookupMap<Message> = {
    senderMembership: ChatroomMembershipResourceHandler,
    chatroom: ChatroomResourceHandler,
  };
}

export class FriendshipGroupResourceHandler extends RootResourceHandler<
  Group,
  { name: Group["name"] }
> {
  static readonly basename = "friendship-groups";
  static readonly objects = new GroupResourceStore();
}

export class FriendshipResourceHandler extends RootResourceHandler<
  Friendship,
  {
    target: Friendship["target"];
    groups: Friendship["groups"];
    nickname: Friendship["nickname"];
    important: Friendship["important"];
  },
  { groups: PK }
> {
  static readonly basename = "friendships";
  static readonly objects = new ResourceStore<Friendship>();
  static readonly relatedLookupMap: RelatedLookupMap<Friendship> = {
    target: UserResourceHandler,
    chatroom: ChatroomResourceHandler,
    groups: FriendshipGroupResourceHandler,
  };
}

export class FriendshipRequestResourceHandler extends RequestResourceHandler<
  FriendshipRequest,
  {
    target: FriendshipRequest["target"];
    message: FriendshipRequest["message"];
  },
  { state: RequestState }
> {
  static readonly basename = "friendship-requests";
  static readonly objects = new ResourceStore<FriendshipRequest>();
  static readonly relatedLookupMap: RelatedLookupMap<FriendshipRequest> = {
    user: UserResourceHandler,
    target: UserResourceHandler,
  };
}

export class UpdateWebSocket extends WebSocket {
  static readonly URL = "/ws/updates/";

  constructor(
    protected readonly handlerMap: {
      [N in UpdatableModelName]: (
        message: ModelUpdateMessage
      ) => AbstractResourceHandler;
    }
  ) {
    super(location.origin.replace(/^http:\/\//, "ws://") + UpdateWebSocket.URL);

    this.addEventListener("message", async (ev: MessageEvent) => {
      const message: ModelUpdateMessage = JSON.parse(ev.data);
      const handler = this.handlerMap[message.model](message);
      const handlerClass = handler.constructor as typeof AbstractResourceHandler;

      switch (message.event) {
        case "create":
          await handler.retrieve(message.pk);
          break;
        case "update":
          await handler.retrieve(message.pk);
          break;
        case "delete":
          handlerClass.objects.commit(message.pk);
          break;
      }
    });
  }
}
