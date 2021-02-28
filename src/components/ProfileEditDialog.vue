<template>
  <v-dialog
    v-model="dialog"
    :width="$context.isMobile ? undefined : 500"
    persistent
    :fullscreen="$context.isMobile"
    :transition="$context.isMobile ? 'dialog-bottom-transition' : undefined"
  >
    <template #activator="bind">
      <slot name="activator" v-bind="bind"></slot>
    </template>

    <v-card :height="$context.isMobile ? undefined : 600">
      <v-toolbar dark color="primary">
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-toolbar-title>个人资料</v-toolbar-title>

        <v-spacer></v-spacer>

        <!-- btn: reset -->
        <v-btn icon :disabled="inProgress || !modified" @click="reset">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>

        <!-- btn: submit -->
        <v-btn
          icon
          :inProgress="inProgress"
          :disabled="inProgress || !modified || !valid"
          @click="save"
        >
          <v-icon>mdi-content-save</v-icon>
        </v-btn>

        <template #extension>
          <v-tabs v-model="tab" :grow="$context.isMobile">
            <v-tab>
              <v-icon>mdi-account-details</v-icon>
            </v-tab>

            <v-tab>
              <v-icon>mdi-lock</v-icon>
            </v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <v-container fluid class="pt-4 px-8">
        <v-form ref="form" v-model="valid" :disabled="inProgress">
          <v-tabs-items v-model="tab">
            <v-tab-item>
              <v-row>
                <v-col cols="7">
                  <v-text-field
                    v-model="formData.username"
                    label="用户名"
                    :rules="rules.username"
                  ></v-text-field>
                </v-col>

                <v-col>
                  <v-select
                    v-model="formData.sex"
                    label="品种"
                    :items="sexSelections"
                  ></v-select>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <v-textarea
                    v-model="formData.bio"
                    label="个性签名"
                    no-resize
                    counter="50"
                    rows="3"
                    :rules="rules.bio"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-tab-item>

            <v-tab-item>
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="formData.password"
                    label="密码"
                    hint="填入空值以保持原密码"
                    type="password"
                    :rules="rules.password"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-tab-item>
          </v-tabs-items>
        </v-form>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import * as models from "@/models";
import { Component, Ref, Vue, Watch } from "vue-property-decorator";
import { VForm } from "vuetify/components";

enum Tab {
  Basic,
  Security,
}

interface FormData {
  username: string;
  password: string;
  sex: models.SexOption;
  bio: string;
}

@Component
export default class ProfileEditDialog extends Vue {
  @Ref() form!: VForm;

  tab = Tab.Basic;
  valid = true;
  dialog: boolean | null = null;
  inProgress = false;

  formData: FormData = {
    username: "",
    password: "",
    sex: models.SexOption.Unknow,
    bio: "",
  };

  sexSelections = [
    { text: "大帅比", value: models.SexOption.Male },
    { text: "小美铝", value: models.SexOption.Female },
    { text: "外星人", value: models.SexOption.Unknow },
  ];

  get rules() {
    return {
      username: [
        (v: string) => !!v || "不得为空",
        models.AuthHandler.validations.username,
      ],
      password: [(v: string) => !v || models.AuthHandler.validations.password(v)],
      bio: [(v: string) => (v.length >= 0 && v.length <= 50) || "0-50个字符"],
    };
  }

  get modifiedData() {
    const ret: Partial<FormData> = { ...this.formData };

    for (const k in this.$context.user) {
      if (
        this.$context.user[k as keyof models.User] == ret[k as keyof typeof ret]
      )
        delete ret[k as keyof typeof ret];
    }

    if (!ret.password) delete ret.password;

    return ret;
  }

  get modified() {
    return !!Object.keys(this.modifiedData).length;
  }

  reset() {
    this.formData = { ...this.$context.user, password: "" };
  }

  @Watch("tab", { immediate: true })
  onTabUpdate() {
    this.reset();
  }

  async save() {
    if (this.inProgress || !this.valid) return;

    try {
      this.inProgress = true;

      const resourceHandler = new models.UserResourceHandler();

      this.$context.user = await resourceHandler.partialUpdate(
        this.$context.user.pk,
        this.modifiedData
      );

      if (this.modifiedData.password)
        await new models.AuthHandler().login(
          this.$context.user.username,
          this.modifiedData.password
        );

      this.reset();
    } finally {
      await new Promise((r) => setTimeout(r, 500));
      this.inProgress = false;
    }
  }
}
</script>