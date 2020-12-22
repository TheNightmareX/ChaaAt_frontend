import axios from "axios";

axios.defaults.baseURL = "/api/";
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

export { default as auth } from "./auth";
export { default as friendRelations } from "./friend-relations";
export { default as messages } from "./messages";

/**@template T @typedef {{ count: number, previous: () => Promise<PageOf<T>> , next: () => Promise<PageOf<T>>, results: T[]}} PageOf */
/**@typedef {number | 'last'} PageNum */

/**
 *
 * @param {Object} obj
 * @param {'snake' | 'camel'} to
 */
function convertFieldCase(obj, to) {
  if (![Object, Array].includes(obj?.constructor)) return obj;
  const newObj = obj.constructor();
  const re = { camel: /_(\w)/g, snake: /([a-z])([A-Z])/g }[to];
  const replacer = {
    camel: (all, letter) => letter.toUpperCase(),
    snake: (all, front, letter) => `${front}_${letter.toLowerCase()}`,
  }[to];
  for (const key in obj) {
    const value = obj[key];
    const newKey = re.test(key) ? key.replace(re, replacer) : key;
    newObj[newKey] = convertFieldCase(value, to);
  }
  return newObj;
}

/**
 * A decorator which makes a ordinary method an async method,
 * provides auto case conversions and extract `data` field from
 * an `AxiosResponse` the method returns.
 * @param {Object} target
 * @param {string} name
 * @param {PropertyDescriptor} descriptor
 */
export function api(target, name, descriptor) {
  /**@type {(...) => Promise<import("axios").AxiosResponse>} */
  const fn = target[name];
  descriptor.value = async function(...camelArgs) {
    const snakeArgs = camelArgs.map((arg) => convertFieldCase(arg, "snake"));
    const snakeReturns = (await fn(...snakeArgs)).data;
    const camelReturns = convertFieldCase(snakeReturns, "camel");
    return camelReturns;
  };
  return descriptor;
}

/**
 * Make an api method which returns paginated data easier to use by
 * converting the `next` and `previous` fields into functions.
 * Call these two methods without any params to get another page.
 * @param {Object} target
 * @param {string} name
 * @param {PropertyDescriptor} descriptor
 * @example
 */
export function paginated(target, name, descriptor) {
  /**
   *
   * @param {(...) => Promise<PageOf<any>>} fn
   */
  function wrap(fn) {
    return async function(args) {
      const pageNum = args?.page ?? 1;
      const pageData = await fn(args);
      if (pageData.next)
        pageData.next = () => wrap(fn)({ ...args, page: pageNum + 1 });
      if (pageData.previous)
        pageData.previous = () => wrap(fn)({ ...args, page: pageNum - 1 });
      return pageData;
    };
  }
  descriptor.value = wrap(descriptor.value);
  return descriptor;
}
