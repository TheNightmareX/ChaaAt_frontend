declare module "vuetify/components" {
  export interface VForm extends Vue {
    reset: () => void;
    validate: () => boolean;
    resetValidation: () => void;
  }
}
