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
 * @type {MethodDecorator}
 */
export function api(target, key, descriptor) {
  /**@type {(...) => Promise<import("axios").AxiosResponse>} */
  const fn = descriptor.value;
  descriptor.value = async function(...camelArgs) {
    const snakeArgs = camelArgs.map((arg) => convertFieldCase(arg, "snake"));
    const snakeReturns = (await fn(...snakeArgs)).data;
    const camelReturns = convertFieldCase(snakeReturns, "camel");
    return camelReturns;
  };
  return descriptor;
}

/**
 * Make an api method which returns paginated data easier to use.
 *
 * Converting the `next` and `previous` fields into functions, which
 * can be called without any params to get another page.
 *
 * Add an extra optional param: `forEach`, which should be passed as
 * a function with each page's data as its first param.
 *
 * Note that the api method should be passed params through a object.
 * @type {MethodDecorator}
 */
export function paginated(target, key, descriptor) {
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

  const getPage = wrap(descriptor.value);

  descriptor.value =
    /**
     *
     * @param {{ forEach?: (results: any[]) => any }} args
     */
    async function(args = {}) {
      const forEach = args.forEach;
      args = { ...args, forEach: undefined };

      if (forEach) {
        let nextPage = () => getPage(args);
        while (nextPage) {
          const { next, results } = await nextPage();
          forEach(results);
          nextPage = next;
        }
      } else {
        return await getPage();
      }
    };
  return descriptor;
}
