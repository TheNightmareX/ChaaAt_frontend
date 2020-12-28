import { api, paginated } from ".";
import axios from "axios";

/**@typedef {{ id: number, username: string }} User */

export default new (class {
  /**
   * @returns {Promise<User>}
   */
  @api
  current() {
    return axios.get("auth/");
  }
  /**
   *
   * @param {{ username: string }}
   * @returns {User}
   */
  @api
  retrieve({ username }) {
    return axios.get(`users/${username}/`);
  }
  /**
   *
   * @param {{ username: string, password: string }}
   * @returns {Promise<User>}
   */
  @api
  login({ username, password }) {
    return axios.post("auth/", { username, password });
  }
  /**
   * @returns {Promise<''>}
   */
  @api
  logout() {
    return axios.delete("auth/");
  }
  /**
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<User>}
   */
  @api
  signup({ username, password }) {
    return axios.post("users/", { username, password });
  }
  /**
   *
   * @param {{ search: string, page: import(".").PageNum }}
   * @returns {Promise<import(".").PageOf<User>>}
   */
  @paginated
  @api
  list({ search = undefined, page = undefined } = {}) {
    return axios.get("users/", { params: { search, page } });
  }
})();
