import { api, paginated } from ".";
import axios from "axios";

/**@typedef {{id: number, text: string, sender: number, chatroom: number, creationTime: string }} Message */

export default new (class {
  /**
   *
   * @param {{ page?: import(".").PageNum, forEach?: (messages: Message[]) => any }} param0
   * @returns {Promise<import(".").PageOf<Message>>}
   */
  @paginated
  @api
  list({ page = undefined } = {}) {
    return axios.get("messages/", { params: { page } });
  }
  /**
   *
   * @param {{ message: Message }} param0
   * @returns {Promise<Message>}
   */
  @api
  create({ message }) {
    return axios.post("messages/", message);
  }
})();
