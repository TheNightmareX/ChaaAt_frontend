import { api } from "./index";
import axios from "axios";

/**@typedef {{ id: number, text: string, sender: number, chatroom: number, creationTime: string }} Message */

export default new (class {
  /**
   *
   * @param {number} page
   * @param {number} from
   * @returns {Promise<{ count: number, next: string, previous: string, results: Message[] }>}
   */
  @api
  list(from, page) {
    return axios.get("messages/", { params: { from, page } });
  }
  /**
   *
   * @param {Message} message
   */
  @api
  create(message) {
    return axios.post("messages/", message);
  }
})();
