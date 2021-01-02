import { api } from ".";
import axios from "axios";

/**@typedef {'friend_relation.create' | 'friend_relation.destroy' | 'message.create' | 'message.mark_as_read'} Label */
/**@typedef {import("./friend-relations").Relation} Update.FriendRelation.Create */
/**@typedef {number} Update.FriendRelation.Destroy */
/**@typedef {import("./messages").Message} Update.Message.Create*/

export default new (class {
  /**
   * @param {{ cancelToken?: import("axios").CancelToken, cancel_token?: import("../store").CancelToken }} param0
   * @returns {Promise<[Label, Update.FriendRelation.Create | Update.FriendRelation.Destroy | Update.Message.Create][]>}
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
