import { api } from ".";
import axios from "axios";

/**@typedef {'friend_relation.create' | 'friend_relation.destroy' | 'message.create'} Label */
/**
 * @template T
 * @typedef {{
 * 'friend_relation.create': import("./friend-relations").Relation,
 * 'friend_relation.destroy': number,
 * 'message.create': import("./messages").Message
 * }[T]} UpdateOf
 */

export default new (class {
  /**
   * @param {{ cancelToken: import("axios").CancelToken }}
   * @returns {Promise<[Label, UpdateOf<Label>][]>}
   */
  @api
  list({ cancel_token: cancelToken = undefined } = {}) {
    return axios.get("updates/", { cancelToken });
  }
  /**
   * @returns {Promise<"">}
   */
  @api
  clear() {
    return axios.delete("updates/");
  }
})();
