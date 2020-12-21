import { api } from "./index";
import axios from "axios";

/**@typedef {{ id: number, text: string, sender: number, chatroom: number, creationTime: string }} Message */

export default new (class {
  /**
   *
   * @param {{ page: number }}
   * @returns {Promise<{ count: number, next: string, previous: string, results: Message[] }>}
   */
  @api
  list({ page } = {}) {
    return axios.get("messages/", { params: { page } });
  }
  /**
   *
   * @param {{ message: Message }}
   */
  @api
  create({ message }) {
    return axios.post("messages/", message);
  }
  /**
   *
   * @param {{ cancelToken: import("axios").CancelToken }}
   * @returns {Promise<Message[]>}
   */
  @api
  getUpdations({ cancelToken = undefined } = {}) {
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
