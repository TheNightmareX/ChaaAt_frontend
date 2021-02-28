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
} & Extra;

export type Value<M extends Meta, T> = M["nullable"] extends true
  ? T | null
  : T;

export type Values<F extends Field> = F extends Field<
  infer M,
  infer VR,
  infer VI,
  infer VS,
  infer VE
>
  ? {
      toReceive: Value<M, VR>;
      internal: Value<M, VI>;
      toSend: Value<M, VS>;
      external: Value<M, VE>;
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
    if (this.validateNull(value)) return () => value as Value<M, VI>;
    return this.toInternalValue(value) as () => Value<M, VI>;
  }
  toExternal(value: VS | null) {
    if (this.validateNull(value)) return value as Value<M, VE>;
    this.runAllValidations(value);
    return this.toExternalValue(value) as Value<M, VE>;
  }

  runAllValidations(value: unknown) {
    if (this.validateNull(value)) return;
    this.runValidators(value);
    this.validate(value);
  }
  runValidators(value: unknown) {
    this.validators.forEach((v) => v.validate(value, this));
  }
  validateNull(value: unknown): value is null {
    if (value == null)
      if (this.meta.nullable) return true;
      else throw new ValidationError(value, "Not nullable");
    else return false;
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
