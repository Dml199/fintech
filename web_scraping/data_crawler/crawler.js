import puppeteer from "puppeteer";
import { Telegram } from "../telegram/telegram_bot.js";
import { DataTools, DomLogicHandler } from "./tools.js";
import { AskAi } from "./askAi.js"
import {
  specs,
  FRONT_PAGE_TAG,
  CONTENT_PAGE_TAG,
  WAIT_FOR_PAGE_TO,
} from "./variables.js";

import { DbAPIHandler } from "./database_api.js";

const bot = new Telegram();
bot.init();
const ai = new AskAi()
const browser_addr = "http://127.0.0.1:5200";

class Browser {
  constructor(local_url = "None") {
    this.pages = [];
    this.ai_pages = [];
    this.address = local_url;
    this.browser = async () => {
      return this.address === "None"
        ? await puppeteer.launch()
        : await puppeteer.connect({ browserURL: this.address });
    };
  }

  async init() {
    this.browser = await this.browser();
  }

  async go_to(data_list, address) {

    let index;
    console.log(data_list.length,this.pages.length)
    for (const addr of data_list) {
      if(address==="perplexity"){
         index = this.ai_pages.push({
        address: "perplexity",
        page: await this.browser.newPage(),
      });
      }
      else{
        index = this.pages.push({
        address: "reuters",
        page: await this.browser.newPage(),
      });
      }
      
    }    console.log(this.pages.length)
    let counter = 0
    for (let i = 0; i < this.pages.length; i++) {
      if (this.pages[i].address === address) {
        await this.pages[i].page.goto(data_list[counter], {
          waitUntil: WAIT_FOR_PAGE_TO,
          timeout: 0,
        });
        counter++
      }
    }
    if(address === "perplexity"){

       this.ai_pages[0].page.goto(data_list[0], {
          waitUntil: WAIT_FOR_PAGE_TO,
          timeout: 0,
        });
    }
   
    return this.pages[index - 1];
  }

  async gather_data() {
    let data = await this.pages[0].page.$$eval("a", (elems) => {
      return elems.map((elem) => ({
        header: elem.innerText,
        href: elem.href,
      }));
    });

    return data;
  }

  async releaseMemory(address) {

    for(let i = this.pages.length-1; i >= 0; --i){
      let page_obj = this.pages[i]
      if (page_obj.address == address) {
        await page_obj.page.close();
        this.pages.splice(i, 1);

      }
    };
    }

  async releaseElement(index) {
    this.pages[index].page.close();

    this.pages.splice(index, 1);
  }
  async getTextInfo() {
  
    let selectorRef = await Promise.all(
      this.pages.map(async (page) => {
        return await page.page.$(CONTENT_PAGE_TAG);
      }),
    );

    let text_data = await Promise.all(
      selectorRef.map(async (elem) => {
        return await DomLogicHandler.check_node(elem);
      }),
    );

    return text_data;
  }
}

async function main() {
  const br = new Browser(browser_addr);
  await br.init();

  await br.go_to(specs.reuters.BASE_URL,"reuters");

  let data_list = await br.gather_data();
  await br.releaseElement(0);

  const clean_data = DataTools.purifyData(data_list);

  const valid_list = await DbAPIHandler.findPost(clean_data);

  DataTools.pruneDuplicates(valid_list);

  let batch_size = 5;

  for (let j = 0; j < valid_list.length; j = j + batch_size) {
    if (valid_list.length - j < 5) {
      batch_size = valid_list.length - j;
    }
    const valid_list_ = valid_list.slice(j, j + batch_size);

    await br.go_to(
      valid_list_.map((data) => {
        return data.href;
      }),
      "reuters",
    );

    let text_info = await br.getTextInfo();

    text_info.forEach((elem, index) => {
      valid_list_[index].content = elem.join(" ");
    });
    DataTools.pruneHtmlTags(valid_list_);
    
    await bot.notifyByInterval(valid_list_, 5000);
    await ai.askPerplexity(br)
    await DbAPIHandler.pushPost(valid_list_);

    await br.releaseMemory("reuters");
  }
}

async function mainLoop() {
  await main();
  setTimeout(async () => {
    mainLoop();
  }, 1800000);
}

mainLoop();
