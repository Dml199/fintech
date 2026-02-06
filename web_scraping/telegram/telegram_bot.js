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
     

        
        `<b><i>Article: </i></b>${data.header}` +
        "\n \n" +
        
        `<b><i>Content: </i></b>${data.content.slice(0,1000)}`+ "..." +
        "\n \n" +
        `<b><i>Source: </i></b>${data.href}` ,{parse_mode:'HTML'}
    );
  }


  async notifyByInterval(data, interval ) {

    for (const elem of data){

      await new Promise((resolve, reject )=>{setTimeout(async ()=>{await this.notifySubscribers(elem);resolve()},interval)})
    } 
    

       

  }
}


