import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Field, Lazy, Meta, Values } from "./fields";
import { IsInstanceValidator } from "./validators";

export type PK = string | number;

export type FieldsSpecs = Record<
  "common" | "receive" | "send",
  Record<string, Field>
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

export interface URLDescription {
  pk?: PK;
  action?: string;
  parent?: URLDescription;
  value: string;
}

export abstract class BaseResource<
  Fields extends FieldsSpecs,
  PKField extends keyof (Fields["common"] & Fields["receive"])
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

  getURL({
    pk,
    action,
    parent,
  }: {
    pk?: PK;
    action?: string;
    parent?: URLDescription;
  } = {}): URLDescription {
    return {
      pk,
      action,
      parent,
      value: `${parent?.value ?? "/"}${this.basename}/${pk ? `${pk}/` : ""}${
        action ? `${action}/` : ""
      }`,
    };
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
  Fields extends FieldsSpecs,
  PKField extends keyof (Fields["common"] & Fields["receive"])
> extends BaseResource<Fields, PKField> {
  async list(url: URLDescription, config?: AxiosRequestConfig) {
    const response = await this.axios.get<unknown>(url.value, config);
    return this.parseListResponse(response.data).map((data) =>
      this.field.toInternal(this.transformCase(data, "internal"))()
    );
  }
  
  protected parseListResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"][];
  }

  async create(
    url: URLDescription,
    data: FieldsValues<Fields>["toSend"],
    config?: AxiosRequestConfig
  ) {
    const response = await this.axios.post<unknown>(
      url.value,
      this.transformCase(this.field.toExternal(data), "external"),
      config
    );
    return this.field.toInternal(
      this.transformCase(this.parseCreateResponse(response.data), "internal")
    )();
  }
  
  protected parseCreateResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }

  async retrieve(url: URLDescription, config?: AxiosRequestConfig) {
    const response = await this.axios.get<unknown>(url.value, config);
    return this.field.toInternal(
      this.transformCase(this.parseRetrieveResponse(response.data), "internal")
    )();
  }
  
  protected parseRetrieveResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }

  async update(
    url: URLDescription,
    data: FieldsValues<Fields>["toSend"],
    config?: AxiosRequestConfig
  ) {
    const response = await this.axios.put<unknown>(
      url.value,
      this.transformCase(this.field.toExternal(data), "external"),
      config
    );
    return this.field.toInternal(
      this.transformCase(this.parseUpdateResponse(response.data), "internal")
    )();
  }
  
  protected parseUpdateResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }

  async partialUpdate(
    url: URLDescription,
    data: Partial<FieldsValues<Fields>["toSend"]>,
    config?: AxiosRequestConfig
  ) {
    const response = await this.axios.patch<unknown>(
      url.value,
      this.transformCase(
        this.field.toExternal(data as Required<typeof data>),
        "external"
      ),
      config
    );
    return this.field.toInternal(
      this.transformCase(
        this.parsePartialUpdateResponse(response.data),
        "internal"
      )
    )();
  }
  
  protected parsePartialUpdateResponse(data: unknown) {
    return data as FieldsValues<Fields>["toReceive"];
  }

  async destroy(url: URLDescription, config?: AxiosRequestConfig) {
    if (!url.pk) throw new Error("Invalid URL description");
    await this.axios.delete<void>(url.value, config);
    delete this.objects[url.pk];
  }
}
