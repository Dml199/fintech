import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./constants.js";

export class Telegram {
  constructor() {
    this.bot = new Telegraf(BOT_TOKEN);
  }

  init() {

    this.bot.launch();

  }
  async notifySubscribers( data) {

    await this.bot.telegram.sendMessage(-1003862090694,
     

        "<i><b>Article: </b></i>" +
        data.header +
        "\n \n" +
        "<i><b>Content: </b></i>" +
        data.content.slice(0,1000)+ "..." +
        "\n \n" +
        "<i><b>Source: </b></i>" +
        data.href , { parse_mode: 'HTML' }
    );
  }
}


