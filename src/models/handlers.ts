import axios, { AxiosRequestConfig, CancelTokenSource } from "axios";
import { ResourceStore } from "./store";
import { convertFieldsCase } from "./utils";

export class BaseHTTPHandler {
  static readonly http = axios.create({
    baseURL: "/api",
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
  });

  protected readonly http = BaseHTTPHandler.http;
  protected readonly cancelTokenSource: CancelTokenSource = axios.CancelToken.source();

  protected getRequestConfig(extra: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...extra,
      cancelToken: this.cancelTokenSource.token,
    };
  }

  cancel() {
    this.cancelTokenSource.cancel();
  }
}

export type PK = number | string;

export type CommonField = null | number | string | boolean | Date;
export type RelatedField = null | PK | PK[];
export type ExpandedField<M extends Model = Model> = null | M | M[];

export interface Model {
  pk: PK;
}

export type FieldNameMap<M extends Model> = {
  [F in Extract<keyof M, string>]: M[F] extends Model ? F | `${F}.${FieldNames<M[F]>}` : F
};

export type FieldNames<M extends Model> = FieldNameMap<M>[keyof FieldNameMap<
  M
>];

export type FlexFieldsOptions<M extends Model> = {
  include?: FieldNames<M>[];
  omit?: FieldNames<M>[];
  expand?: FieldNames<M>[] | "*";
};

export type PageSpec = number | "last";

export type PageOf<M extends Model = Model> = {
  count: number;
  previous: string;
  next: string;
  results: M[];
};

export type QueryParams = {
  [name: string]: number | boolean | string | (number | boolean | string)[];
};

export abstract class AbstractResourceHandler<
  // eslint-disable-next-line
  M extends Model = any,
  W extends Partial<M> = Partial<M>,
  Q extends QueryParams = {}
> extends BaseHTTPHandler {
  static readonly objects: ResourceStore;
  static readonly relatedLookupMap: RelatedLookupMap = {};

  protected abstract readonly baseURL: string;

  constructor(
    protected readonly flexFieldsOptions: FlexFieldsOptions<M> = {},
    protected readonly onEachInstance: (instance: M) => M = (i) => i
  ) {
    super();
  }

  protected get objects() {
    return (this.constructor as typeof AbstractResourceHandler)
      .objects as ResourceStore<M>;
  }

  protected getRequestConfig(extra: AxiosRequestConfig = {}) {
    return super.getRequestConfig({
      ...extra,
      params: { ...this.flexFieldsOptions, ...extra.params },
    });
  }

  /**
   * Process the raw response data into the internal model instance and save.
   *
   * - Convert the snake_case field names into the camelCase ones
   * - Store the expanded related fields to the proper handler and then handle them as same as common
   *  primary key related fields
   * - Define getters for the related fields to get the model instances from the proper handler instead
   *  of primary keys
   * - Parse date strings into `Date` instances
   * @param raw
   */
  // eslint-disable-next-line
  protected toInternal(raw: any): M {
    /**
     * Process all the fields of the object recursively.
     * @param obj
     * @param relatedLookupMap
     */
    function processFields<M extends Model>(
      obj: Record<keyof M, CommonField | RelatedField | ExpandedField>,
      relatedLookupMap: RelatedLookupMap<M>
    ) {
      for (const fieldName in obj) {
        const relatedHandlerClass = relatedLookupMap[fieldName];

        if (relatedHandlerClass) {
          const fieldValue = obj[fieldName] as RelatedField | ExpandedField;
          if (!fieldValue) continue;

          const target = fieldValue instanceof Array ? fieldValue : obj;
          const entries =
            fieldValue instanceof Array
              ? fieldValue.entries()
              : Object.entries({ [fieldName]: fieldValue });

          for (const [k, v] of entries) {
            let pk: PK;

            if (typeof v == "object") {
              processFields(v, relatedHandlerClass.relatedLookupMap);
              relatedHandlerClass.objects.commit(v.pk, v);
              pk = v.pk;
            } else {
              pk = v;
            }

            Object.defineProperty(target, k, {
              get: () => relatedHandlerClass.objects.indexed[pk],
            });
          }
        } else {
          const fieldValue = obj[fieldName] as CommonField;
          if (
            typeof fieldValue == "string" &&
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.*/.test(fieldValue)
          ) {
            Object.defineProperty(obj, fieldName, {
              value: new Date(fieldValue),
            });
          }
        }
      }
    }

    convertFieldsCase(raw, "camel");

    processFields(
      raw,
      (this.constructor as typeof AbstractResourceHandler).relatedLookupMap
    );

    const instance = this.onEachInstance(raw);
    this.objects.commit(instance.pk, instance);
    return instance;
  }

  /**
   * Convert any expanded fields into related fields.
   * @param data
   */
  // eslint-disable-next-line
  protected toExternal(data: Partial<W>): any {
    const ret: Partial<Record<keyof W, CommonField | RelatedField>> = {};

    for (const fieldName in data) {
      const fieldValue: CommonField | ExpandedField = data[
        fieldName
      ] as Exclude<typeof data[typeof fieldName], undefined>;

      if (fieldValue instanceof Array) {
        ret[fieldName] = fieldValue.map((instance) => instance.pk);
      } else if (
        fieldValue &&
        typeof fieldValue == "object" &&
        !(fieldValue instanceof Date)
      ) {
        ret[fieldName] = fieldValue.pk;
      } else {
        ret[fieldName] = fieldValue;
      }
    }

    return convertFieldsCase(ret, "snake");
  }

  getURL(pk?: PK, action = "") {
    const baseURL = this.baseURL;
    if (action) action += "/";
    return pk ? `${baseURL}${pk}/${action}` : baseURL;
  }

  async *listGen(start: PageSpec = 1, params: Partial<Q> = {}) {
    let page = start as number; // For if the "start" param is "last", the variable is not useful anymore.

    while (true) {
      const response = await this.http.get<PageOf<M>>(
        this.getURL(),
        this.getRequestConfig({
          params: { ...convertFieldsCase(params, "snake"), page },
        })
      );

      yield response.data.results.map((raw) => this.toInternal(raw));

      if (!response.data.next) return;

      page++;
    }
  }
  async list({ page, ...params }: { page?: PageSpec } & Partial<Q> = {}) {
    const ret = [];

    for await (const data of this.listGen(page, params as Partial<Q>)) {
      ret.push(...data);
      if (page) break;
    }

    return ret;
  }

  async create(data: W) {
    const response = await this.http.post<Record<string, M[keyof M]>>(
      this.getURL(),
      this.toExternal(data),
      this.getRequestConfig()
    );

    return this.toInternal(response.data);
  }

  async retrieve(pk: PK) {
    const response = await this.http.get<Record<string, M[keyof M]>>(
      this.getURL(pk),
      this.getRequestConfig()
    );

    return this.toInternal(response.data);
  }

  async update(pk: PK, data: W) {
    const response = await this.http.put<Record<string, M[keyof M]>>(
      this.getURL(pk),
      this.toExternal(data),
      this.getRequestConfig()
    );

    return this.toInternal(response.data);
  }

  async partialUpdate(pk: PK, data: Partial<W>) {
    const response = await this.http.patch<Record<string, M[keyof M]>>(
      this.getURL(pk),
      this.toExternal(data),
      this.getRequestConfig()
    );

    return this.toInternal(response.data);
  }

  async destroy(pk: PK) {
    await this.http.delete<void>(this.getURL(pk), {
      params: this.flexFieldsOptions,
    });

    this.objects.commit(pk);
  }
}

export type RelatedLookupMap<M extends Model = Model> = {
  [F in keyof M]?: Pick<
    typeof AbstractResourceHandler,
    "objects" | "relatedLookupMap"
  >;
};

export abstract class RootResourceHandler<
  M extends Model,
  W extends Partial<M> = Partial<M>,
  Q extends QueryParams = {}
> extends AbstractResourceHandler<M, W, Q> {
  static readonly basename: string;

  protected readonly baseURL: string;

  constructor(
    flexFieldsOptions?: FlexFieldsOptions<M>,
    onEachInstance?: (instance: M) => M
  ) {
    super(flexFieldsOptions, onEachInstance);

    this.baseURL = `/${
      (this.constructor as typeof RootResourceHandler).basename
    }/`;
  }
}

export abstract class NestedResourceHandler<
  P extends AbstractResourceHandler,
  M extends Model,
  W extends Partial<M> = Partial<M>,
  Q extends QueryParams = {}
> extends AbstractResourceHandler<M, W, Q> {
  static readonly basename: string | { [parentHandlerName: string]: string };

  protected readonly baseURL: string;

  constructor(
    parent: P,
    parentPK: PK,
    flexFieldsOptions?: FlexFieldsOptions<M>,
    onEachInstance?: (instance: M) => M
  ) {
    super(flexFieldsOptions, onEachInstance);

    const basenameSetting = (this.constructor as typeof NestedResourceHandler)
      .basename;

    const basename =
      typeof basenameSetting == "string"
        ? basenameSetting
        : basenameSetting[parent.constructor.name];

    this.baseURL = `${parent.getURL(parentPK)}${basename}/`;
  }
}

export class VirtualResourceHandler<
  M extends Model
> extends AbstractResourceHandler<M, Partial<M>> {
  static objects: ResourceStore;
  static pageSize = 20;

  protected readonly baseURL = "";

  protected pkGen = (function*() {
    for (let i = 1; ; ) {
      yield i;
    }
  })();

  constructor(onEachInstance?: (instance: M) => M) {
    super({}, onEachInstance);
  }

  protected get pageSize() {
    return (this.constructor as typeof VirtualResourceHandler).pageSize;
  }

  checkExistense(pk: PK) {
    if (!(pk in this.objects.indexed)) throw Error("Not Found");
  }

  async *listGen(start: PageSpec = 1) {
    const items = this.objects.all.slice(
      start == "last" ? -this.pageSize : start * this.pageSize
    );

    for (let i = 0; i <= items.length; i += this.pageSize) {
      yield items.slice(i, i + this.pageSize);
    }
  }

  async create(data: Partial<M>) {
    const pk = this.pkGen.next().value;
    const instance = { ...data, pk } as M;
    this.objects.commit(pk, instance);
    return instance;
  }

  async retrieve(pk: PK) {
    this.checkExistense(pk);
    return this.objects.indexed[pk];
  }

  async update(pk: PK, data: Partial<M>) {
    this.checkExistense(pk);
    const instance = { ...data, pk: pk } as M;
    this.objects.commit(pk, instance);
    return instance;
  }

  async partialUpdate(pk: PK, data: Partial<M>) {
    this.checkExistense(pk);
    this.objects.commit(pk, data, true);
    return this.objects.indexed[pk];
  }

  async destroy(pk: PK) {
    this.objects.commit(pk);
  }
}
