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
     

        "<b style = 'font-size:16px'>Article: </b>" +
        data.header +
        "\n" +
        "<b>Content: </b>" +
        data.content.slice(0,1000)+ "..." +
        "\n" +
        "<b>Source: </b>" +
        data.href , { parse_mode: 'HTML' }
    );
  }
}


