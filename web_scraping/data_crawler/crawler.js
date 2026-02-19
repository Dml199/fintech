import puppeteer from "puppeteer";
import { Telegram } from "../telegram/telegram_bot.js";
import { DataTools, DomLogicHandler } from "./tools.js";
import {
  specs,
  FRONT_PAGE_TAG,
  CONTENT_PAGE_TAG,
  WAIT_FOR_PAGE_TO,
} from "./variables.js";

import { DbAPIHandler } from "./database_api.js";

const bot = new Telegram();
bot.init();

const browser_addr = "http://127.0.0.1:5200";

class Browser {
  constructor(local_url = "None") {
    this.pages = [];
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
    const browserInst = this.browser;
    for (const addr of data_list) {
      this.pages.push({
        address: address,
        page: await browserInst.newPage(),
      });
    }

    for (let i = 0; i < data_list.length; ++i) {
      if(this.pages[i].address===address){
              await this.pages[i].page.goto(data_list[i], {
        waitUntil: WAIT_FOR_PAGE_TO,
        timeout: 0,
      });
      }

    }
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
    this.pages.forEach(async (elem,index) => {
      if (elem.address === address) {
        await elem.close();
        this.pages.splice(index,1);
      }
    });

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
        console.log(this.pages)
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

  await br.go_to(specs.reuters.BASE_URL);

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
