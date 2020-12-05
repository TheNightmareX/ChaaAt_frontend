import { api } from "./index";
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
   * @param {string} username
   * @returns {User}
   */
  @api
  retrieve(username) {
    return axios.get(`users/${username}/`);
  }
  /**
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<User>}
   */
  @api
  login(username, password) {
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
  signup(username, password) {
    return axios.post("users/", { username, password });
  }
})();
