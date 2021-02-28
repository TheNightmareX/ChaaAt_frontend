// eslint-disable-next-line
export function convertFieldsCase(obj: any, to: "camel" | "snake") {
  if ([Object, Array].includes(obj?.constructor)) {
    const re = { camel: /_(\w)/g, snake: /([a-z])([A-Z])/g }[to];

    const replacer = {
      camel: (all: string, letter: string) => letter.toUpperCase(),
      snake: (all: string, previous: string, letter: string) =>
        `${previous}_${letter.toLowerCase()}`,
    }[to];

    for (const key in obj) {
      const value = obj[key];
      delete obj[key];
      const newKey = re.test(key) ? key.replace(re, replacer) : key;
      obj[newKey] = convertFieldsCase(value, to);
    }
  }

  return obj;
}
