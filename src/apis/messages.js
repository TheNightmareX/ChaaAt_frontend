import { api } from "./index";
import axios from "axios";

/**@typedef {{ id: number, text: string, sender: number, chatroom: number, creationTime: string }} Message */

export default new (class {
  /**
   *
   * @param {number} page
   * @returns {Promise<{ count: number, next: string, previous: string, results: Message[] }>}
   */
  @api
  list(page) {
    return axios.get("messages/", { params: { page } });
  }
  /**
   *
   * @param {Message} message
   */
  @api
  create(message) {
    return axios.post("messages/", message);
  }
  /**
   *
   * @param {import("axios").CancelToken} cancelToken
   * @returns {Promise<Message[]>}
   */
  @api
  getUpdations(cancelToken) {
    return axios.get("messages/updates/", { cancelToken });
  }
  /**
   * @returns {Promise<"">}
   */
  @api
  clearUpdations() {
    return axios.delete("messages/updates/");
  }
})();
