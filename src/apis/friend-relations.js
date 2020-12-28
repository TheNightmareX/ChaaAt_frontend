import { api, paginated } from ".";
import axios from "axios";

/**@typedef {import('./auth').User} User  */
/**@typedef {{ id: number, sourceUser: User, targetUser: User, accepted: boolean, chatroom: number }} Relation */

export default new (class {
  /**
   *
   * @param {{ targetUser: number }}
   * @returns {Promise<Relation>}
   */
  @api
  create({ target_user }) {
    return axios.post("friend-relations/", { target_user });
  }
  /**
   * @param {{ page: import(".").PageNum, forEach: (relations: Relation[]) => any }}
   * @returns {Promise<import(".").PageOf<Relation>>}
   */
  @paginated
  @api
  list({ page = undefined } = {}) {
    return axios.get("friend-relations/", { params: { page } });
  }
  /**
   *
   * @param {{ id: number }}
   * @returns {Promise<Relation>}
   */
  @api
  destroy({ id }) {
    return axios.delete(`friend-relations/${id}/`);
  }
  /**
   * @param {{ cancelToken: import("axios").CancelToken }}
   * @returns {Promise<['save' | 'delete', Relation | number][]>}
   */
  @api
  getUpdations({ cancel_token: cancelToken = undefined } = {}) {
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
