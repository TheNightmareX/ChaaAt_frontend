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
})();
