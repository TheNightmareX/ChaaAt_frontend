import { AxiosInstance, AxiosRequestConfig } from "axios";
import { Field, Lazy, Meta, Values } from "./fields";
import { IsInstanceValidator } from "./validators";

export type PK = string | number;

/**
 * The generic type `F` here is used to get the detailed literal types of the fields' meta.
 *
 * `F` should **NOT** have a value, always keep it empty.
 *
 * Here is an example of why I did this:
 *
 *      function f1<Fields extends FieldsSpecs>(arg: Fields) {}
 *      function f2<Fields extends FieldsSpecs<F>, F extends Field>(arg: Fields) {}
 *
 *      f1({
 *        common: {
 *          field: new StringField({ nullable: true }),
 *        },
 *        receive: {},
 *        send: {},
 *      });
 *
 *      f2({
 *        common: {
 *          field: new StringField({ nullable: true }),
 *        },
 *        receive: {},
 *        send: {},
 *      });
 *
 * Then check the types:
 *
 *      function f1<{
 *        common: {
 *            field: StringField<{
 *                nullable: boolean;  // <- NOTICE HERE
 *            }>;
 *        };
 *        receive: {};
 *        send: {};
 *      }>(arg: {
 *        common: {
 *            field: StringField<{
 *                nullable: boolean;  // <- NOTICE HERE
 *            }>;
 *        };
 *        receive: {};
 *        send: {};
 *      }): void
 *
 *      function f2<{
 *        common: {
 *            field: StringField<{
 *                nullable: true;  // <- NOTICE HERE
 *            }>;
 *        };
 *        receive: {};
 *        send: {};
 *      }, Field<{}, unknown, unknown, unknown, unknown>>(arg: {
 *        common: {
 *            field: StringField<{
 *                nullable: true;  // <- NOTICE HERE
 *            }>;
 *        };
 *        receive: {};
 *        send: {};
 *      }): void
 *
 * As you can see: If I don't set an empty generic type, the type checker will replace
 * the literal types to the normal types, which make it difficult to define further type
 * limits.
 *
 * This is not a perfect solution, so I will keep seeking for better solutions.
 */
export type FieldsSpecs<F extends Field = Field> = Record<
  "common" | "receive" | "send",
  Record<string, F>
>;

export type FieldsValues<Fields extends FieldsSpecs> = {
  toReceive: {
    [N in keyof (Fields["common"] & Fields["receive"])]: Values<
      (Fields["common"] & Fields["receive"])[N]
    >["toReceive"];
  };
  internal: {
    [N in keyof (Fields["common"] & Fields["receive"])]: Values<
      (Fields["common"] & Fields["receive"])[N]
    >["internal"];
  };
  toSend: {
    [N in keyof (Fields["common"] & Fields["send"])]: Values<
      (Fields["common"] & Fields["send"])[N]
    >["toSend"];
  };
  external: {
    [N in keyof (Fields["common"] & Fields["send"])]: Values<
      (Fields["common"] & Fields["send"])[N]
    >["external"];
  };
};

export type Objects<Fields extends FieldsSpecs> = Record<
  PK,
  FieldsValues<Fields>["internal"]
>;

export abstract class BaseResource<
  Fields extends FieldsSpecs<F>,
  PKField extends keyof (Fields["common"] & Fields["receive"]),
  F extends Field
> {
  readonly Field;
  protected readonly field;
  protected abstract readonly axios: AxiosInstance;
  protected readonly cases?: Record<
    "internal" | "external",
    (v: string) => string
  >;

  constructor(
    protected readonly basename: string,
    readonly objects: Objects<Fields>,
    protected readonly description: { fields: Fields; pkField: PKField }
  ) {
    this.Field = this.buildField();
    this.field = new this.Field({});
  }

  getURL(pk: PK = "", action = "") {
    return `/${this.basename}/${pk && pk + "/"}${action && action + "/"}`;
  }

  protected getPK(value: FieldsValues<Fields>["internal"] | PK) {
    return typeof value == "object"
      ? (value[this.description.pkField] as PK)
      : value;
  }

  protected matchFields<K extends string, V, R>(
    data: Record<K, V>,
    fields: Record<string, Field>,
    callback: (k: K, v: V, field: Field) => R
  ) {
    const entries = Object.entries(data)
      .filter(([k]) => !!fields[k])
      .map(([k, v]) => [k, callback(k as K, v as V, fields[k])]);
    return Object.fromEntries(entries) as Record<K, R>;
  }

  protected commit<T extends FieldsValues<Fields>["internal"]>(data: Lazy<T>) {
    const processed = new Proxy(data, {
      get: (target, p: string) => (p in target ? target[p]() : undefined),
      set: (target, p: string, value) => {
        const fields = {
          ...this.description.fields.common,
          ...this.description.fields.send,
        };
        if (!(p in fields)) return false;
        fields[p].runAllValidations(value);
        target[p as keyof T] = value;
        return true;
      },
    }) as T;
    this.objects[this.getPK(processed)] = processed;
    return processed;
  }

  protected transformCase<R extends Record<string, unknown>>(
    data: R,
    type: "internal" | "external"
  ): R {
    const handler = this?.cases?.[type] ?? ((v: string) => v);
    const ret: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      ret[handler(k)] =
        typeof v == "object"
          ? v instanceof Array
            ? v.map((v) => this.transformCase(v, type))
            : this.transformCase(v as typeof data, type)
          : v;
    }
    return ret as R;
  }

  protected buildField() {
    // eslint-disable-next-line
    const resource = this;

    type ToReceive = FieldsValues<Fields>["toReceive"] | PK;
    type Internal = FieldsValues<Fields>["internal"];
    type ToSend = FieldsValues<Fields>["toSend"];
    type External = FieldsValues<Fields>["external"];

    return class ResourceField extends Field<
      Meta,
      ToReceive,
      Internal,
      ToSend,
      External
    > {
      setup() {
        this.validators.push(new IsInstanceValidator(Object));
      }

      toInternalValue(value: ToReceive): () => Internal {
        return typeof value == "object"
          ? () =>
              resource.commit(
                resource.matchFields(
                  value,
                  {
                    ...resource.description.fields.common,
                    ...resource.description.fields.receive,
                  },
                  (k, v, field) => field.toInternal(v)
                ) as Lazy<Internal>
              )
          : () => resource.objects[value];
      }
      toExternalValue(value: ToSend): External {
        return resource.matchFields(
          value,
          {
            ...resource.description.fields.common,
            ...resource.description.fields.send,
          },
          (k, v, field) => {
            return field.toExternal(v);
          }
        ) as External;
      }
      validate(value: Record<string, unknown>) {
        resource.matchFields(
          value,
          {
            ...resource.description.fields.common,
            ...resource.description.fields.receive,
            ...resource.description.fields.send,
          },
          (k, v, field) => field.runAllValidations(v)
        );
      }
    };
  }
}

export abstract class SimpleResource<
  Fields extends FieldsSpecs<F>,
  PKField extends keyof (Fields["common"] & Fields["receive"]),
  F extends Field
> extends BaseResource<Fields, PKField, F> {
  protected parseListResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"][];
  }
  protected parseCreateResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }
  protected parseRetrieveResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }
  protected parseUpdateResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }
  protected parsePartialUpdateResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }

  async list(config?: AxiosRequestConfig) {
    const response = await this.axios.get(this.getURL(), config);
    return {
      response,
      data: this.parseListResponse(
        this.transformCase(response.data, "internal")
      ).map((data) => this.field.toInternal(data)()),
    };
  }

  async create(
    data: FieldsValues<Fields>["toSend"],
    config?: AxiosRequestConfig
  ) {
    const response = await this.axios.post(
      this.getURL(),
      this.transformCase(this.field.toExternal(data), "external"),
      config
    );
    return {
      response,
      data: this.field.toInternal(
        this.transformCase(this.parseCreateResponse(response.data), "internal")
      )(),
    };
  }

  async retrieve(pk: PK, config?: AxiosRequestConfig) {
    const response = await this.axios.get(this.getURL(pk), config);
    return {
      response,
      data: this.field.toInternal(
        this.transformCase(
          this.parseRetrieveResponse(response.data),
          "internal"
        )
      )(),
    };
  }

  async update(
    pk: PK,
    data: FieldsValues<Fields>["toSend"],
    config?: AxiosRequestConfig
  ) {
    const response = await this.axios.put(
      this.getURL(pk),
      this.transformCase(this.field.toExternal(data), "external"),
      config
    );
    return {
      response,
      data: this.field.toInternal(
        this.transformCase(this.parseUpdateResponse(response.data), "internal")
      )(),
    };
  }

  async partialUpdate(
    pk: PK,
    data: Partial<FieldsValues<Fields>["toSend"]>,
    config?: AxiosRequestConfig
  ) {
    const response = await this.axios.patch(
      this.getURL(pk),
      this.transformCase(
        this.field.toExternal(data as Required<typeof data>),
        "external"
      ),
      config
    );
    return {
      response,
      data: this.field.toInternal(
        this.transformCase(
          this.parsePartialUpdateResponse(response.data),
          "internal"
        )
      )(),
    };
  }

  async destroy(pk: PK, config?: AxiosRequestConfig) {
    const response = await this.axios.delete(this.getURL(pk), config);
    delete this.objects[pk];
    return { response };
  }
}
