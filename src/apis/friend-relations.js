import { api, paginated } from ".";
import axios from "axios";

/**@typedef {import('./auth').User} User  */
/**@typedef {{ id: number, sourceUser: User, targetUser: User, accepted: boolean, chatroom: number }} Relation */

export default new (class {
  /**
   *
   * @param {{ targetUser: number, target_user: number }} param0
   * @returns {Promise<Relation>}
   */
  @api
  create({ target_user }) {
    return axios.post("friend-relations/", { target_user });
  }
  /**
   * @param {{ page?: import(".").PageNum, forEach?: (relations: Relation[]) => any }} param0
   * @returns {Promise<import(".").PageOf<Relation>>}
   */
  @paginated
  @api
  list({ page = undefined } = {}) {
    return axios.get("friend-relations/", { params: { page } });
  }
  /**
   *
   * @param {{ id: number }} param0
   * @returns {Promise<Relation>}
   */
  @api
  destroy({ id }) {
    return axios.delete(`friend-relations/${id}/`);
  }
})();
