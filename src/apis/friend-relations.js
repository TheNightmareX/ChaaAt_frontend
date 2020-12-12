import { api } from "./index";
import axios from "axios";

/**@typedef {import('./auth').User} User  */
/**@typedef {{ id: number, sourceUser: User, targetUser: User, accepted: boolean, chatroom: number }} Relation */

export default new (class {
  /**
   *
   * @param {number} targetUserID
   * @returns {Promise<Relation>}
   */
  @api
  create(targetUserID) {
    return axios.post("friend-relations/", { target_user: targetUserID });
  }
  /**
   *
   * @param {number} page
   * @returns {Promise<{ count: number, next: string, previous: string, results: Relation[] }>}
   */
  @api
  list(page = 1) {
    return axios.get("friend-relations/", { params: { page } });
  }
  /**
   *
   * @param {number} id
   * @returns {Promise<Relation>}
   */
  @api
  destroy(id) {
    return axios.delete(`friend-relations/${id}/`);
  }
  /**
   * @param {import("axios").CancelToken}
   * @returns {Promise<['save' | 'delete', Relation | number][]>}
   */
  @api
  getUpdations(cancelToken = undefined) {
    return axios.get("friend-relations/updates/", { cancelToken });
  }
  /**
   * @returns {Promise<"">}
   */
  @api
  clearUpdations() {
    return axios.delete("friend-relations/updates/");
  }
})();
