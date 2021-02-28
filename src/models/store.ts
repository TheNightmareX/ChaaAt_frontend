import { Component, Vue } from "vue-property-decorator";
import { Model, PK } from "./handlers";

@Component
export class ResourceStore<M extends Model = Model> extends Vue {
  indexed: Record<PK, M> = {};

  get all() {
    return Object.values(this.indexed);
  }

  commit(pk: PK, data: Partial<M>, partial: true): void;
  commit(pk: PK, data: M): void;
  commit(pk: PK): void;
  commit(): void;
  commit(pk?: PK, data?: Partial<M> | M, partial = false) {
    if (pk) {
      if (data) {
        if (partial) {
          if (pk in this.indexed)
            this.indexed[pk] = {
              ...this.indexed[pk],
              ...data,
            };
          else {
            throw Error(
              `Trying to partial-update an inexistent instance(${pk})`
            );
          }
        } else {
          Vue.set(this.indexed, pk, data);
        }
      } else {
        Vue.delete(this.indexed, pk);
      }
    } else {
      this.indexed = {};
    }
  }
}
