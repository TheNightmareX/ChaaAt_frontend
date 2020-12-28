import { api, paginated } from ".";
import axios from "axios";

/**@typedef {{ id: number, text: string, sender: number, chatroom: number, creationTime: string }} Message */

export default new (class {
  /**
   *
   * @param {{ page: import(".").PageNum, forEach: (messages: Message[]) => any }}
   * @returns {Promise<import(".").PageOf<Message>>}
   */
  @paginated
  @api
  list({ page = undefined } = {}) {
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
  getUpdations({ cancel_token: cancelToken = undefined } = {}) {
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
