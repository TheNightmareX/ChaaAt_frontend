import {
  ChoicesValidator,
  IsInstanceValidator,
  LengthValidator,
  TypeValidator,
  ValidationError,
  Validator,
  ValueRangeValidator,
} from "./validators";

export type Meta<Extra extends Record<string, unknown> = {}> = {
  nullable?: boolean;
  optional?: boolean;
  rules?: ((v: unknown) => true | string)[];
} & Extra;

export type Values<F extends Field> = F extends Field<
  infer M,
  infer VR,
  infer VI,
  infer VS,
  infer VE
>
  ? {
      toReceive: M["nullable"] extends true ? VR | null : VR;
      internal: M["nullable"] extends true ? VI | null : VI;
      toSend: M["optional"] extends true ? VS | undefined : VS;
      external: M["optional"] extends true ? VE | undefined : VE;
    }
  : never;

export type Lazy<T> = {
  [P in keyof T]: () => T[P];
};

export abstract class Field<
  M extends Meta = Meta,
  VR = unknown,
  VI = VR,
  VS = VI,
  VE = VS
> {
  validators: Validator[] = [];

  constructor(readonly meta: M) {
    this.setup();
  }

  setup() {
    return;
  }

  abstract toInternalValue(value: VR): () => VI;
  abstract toExternalValue(value: VS): VE;

  toInternal(value: VR | null) {
    type V = Values<Field<M, VR, VI, VS, VE>>["internal"];
    if (this.validateNull(value)) return () => value as V;
    return this.toInternalValue(value) as () => V;
  }
  toExternal(value: VS | undefined) {
    type V = Values<Field<M, VR, VI, VS, VE>>["external"];
    if (!this.meta.optional) return value as V;
    this.runAllValidations(value);
    return this.toExternalValue(value as VS) as V;
  }

  runAllValidations(value: unknown) {
    if (this.validateNull(value)) return;
    this.runValidators(value);
    this.validateRules(value);
    this.validate(value);
  }
  validateNull(value: unknown): value is null {
    if (value == null)
      if (this.meta.nullable) return true;
      else throw new ValidationError(value, "Not nullable");
    else return false;
  }
  runValidators(value: unknown) {
    this.validators.forEach((v) => v.validate(value, this));
  }
  validateRules(value: unknown) {
    this.meta.rules?.forEach((rule) => {
      const ret = rule(value);
      if (typeof ret == "string") throw new ValidationError(value, ret);
    });
  }
  validate(value: unknown) {
    return;
  }
}

export abstract class SimpleField<M extends Meta, V = unknown> extends Field<
  M,
  V
> {
  toInternalValue(value: V) {
    return () => value;
  }
  toExternalValue(value: V) {
    return value;
  }
}

export class StringField<Choices extends string> extends SimpleField<
  Meta<{ minLength?: number; maxLength?: number; choices?: Choices[] }>,
  Choices
> {
  setup() {
    this.validators.push(new TypeValidator("string"));
    if (this.meta.choices)
      this.validators.push(new ChoicesValidator(...this.meta.choices));
    if (this.meta.minLength || this.meta.maxLength)
      this.validators.push(
        new LengthValidator({
          max: this.meta.maxLength,
          min: this.meta.minLength,
        })
      );
  }
}

export class NumberField<Choices extends number> extends SimpleField<
  Meta<{ maxValue?: number; minValue?: number; choices?: Choices[] }>,
  Choices
> {
  setup() {
    this.validators.push(new TypeValidator("number"));
    if (this.meta.choices)
      this.validators.push(new ChoicesValidator(...this.meta.choices));
    if (this.meta.minValue || this.meta.maxValue)
      this.validators.push(
        new ValueRangeValidator({
          max: this.meta.maxValue,
          min: this.meta.minValue,
        })
      );
  }
}

export class BooleanField extends SimpleField<Meta, boolean> {
  setup() {
    this.validators.push(new TypeValidator("boolean"));
  }
}

export class DateField extends Field<
  Meta<{ minValue?: Date; maxValue?: Date }>,
  string,
  Date,
  Date,
  string
> {
  setup() {
    this.validators.push(new IsInstanceValidator(Date));
    if (this.meta.maxValue || this.meta.minValue)
      this.validators.push(
        new ValueRangeValidator({
          max: this.meta.maxValue?.getTime(),
          min: this.meta.minValue?.getTime(),
        })
      );
  }

  toInternalValue(value: string) {
    const ret = new Date(value);
    return () => ret;
  }
  toExternalValue(value: Date) {
    return value.toISOString();
  }
}

export class ListField<F extends Field> extends Field<
  Meta<{ field: F }>,
  Values<F>["toReceive"][],
  Values<F>["internal"][],
  Values<F>["toSend"][],
  Values<F>["external"][]
> {
  setup() {
    this.validators.push(new IsInstanceValidator(Array));
  }

  toInternalValue(value: Values<F>["toReceive"][]) {
    const ret = value.map((v) => this.meta.field.toInternal(v));
    return () => ret as Values<F>["internal"][];
  }
  toExternalValue(value: Values<F>["toSend"][]) {
    return value.map((v) =>
      this.meta.field.toExternal(v)
    ) as Values<F>["external"][];
  }
  validate(value: unknown[]) {
    value.forEach((v) => this.meta.field.runAllValidations(v));
  }
}
