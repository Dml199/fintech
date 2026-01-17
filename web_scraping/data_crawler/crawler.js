import puppeteer from "puppeteer";

import { DataTools, DomLogicHandler } from "./tools.js";
import {
  specs,
  FRONT_PAGE_TAG,
  CONTENT_PAGE_TAG,
  WAIT_FOR_PAGE_TO,
} from "./variables.js";

import { DbAPIHandler } from "./database_api.js";

const browser_addr = "http://127.0.0.1:5200";

class Browser {
  constructor(local_url = "None") {
    this.derived_pages = [];
    this.address = local_url;
    this.browser = async () => {
      return this.address === "None"
        ? await puppeteer.launch()
        : await puppeteer.connect({ browserURL: this.address });
    };

    this.data = [];
  }

  async init() {
    this.browser = await this.browser();
  }

  async go_to(address) {
    const browserInst = await this.browser;
    let page_content = await browserInst.newPage();
    await page_content.goto(address, {
      waitUntil: WAIT_FOR_PAGE_TO,
      timeout: 0,
    });
    return page_content;
  }

  async gather_data(page) {
    let data = await page.$$eval("main a", (elems) => {
      return elems.map((elem) => ({
        header: elem.innerText,
        href: elem.href,
      }));
    });
    return data;
  }

  async getTextInfo(page_instance) {
    let text_data = await DomLogicHandler.check_node(
      await page_instance.$(CONTENT_PAGE_TAG)
    );

    return text_data;
  }
}

async function main() {
  const br = new Browser(browser_addr);
  await br.init();
  const page = await br.go_to(specs.reuters.BASE_URL);
  let data_list = await br.gather_data(page);

  const clean_data = await DataTools.purifyData(data_list);

  const valid_list = await DbAPIHandler.findPost(clean_data);

  let batch_size_options = [1, 2, 3, 4, 5, 6];
  let batch_size;
  for (let i = batch_size_options.length - 1; i >= 0; --i) {
    console.log(valid_list.length, batch_size_options[i]);
    console.log(valid_list.length % batch_size_options[i]);
    if (valid_list.length % batch_size_options[i] === 0) {
      batch_size = batch_size_options[i];
    }
  }
  
  for (let j = 0; j < valid_list.length; j = j + batch_size) {
    const valid_list_ = valid_list.slice(j, j + batch_size);
    console.log(valid_list_, j, batch_size);
    const page_instances = await Promise.all(
      valid_list_.map((page_desc) => br.go_to(page_desc.href))
    );

    let text_info = await Promise.all(
      page_instances.map(async (page, index) => {
        return await br.getTextInfo(page);
      })
    );
    text_info.forEach((elem, index) => {
      valid_list[index].content = elem.join(" ");
    });

    await DbAPIHandler.pushPost(valid_list_);
    page_instances.map(async (page) => {
      await page.close();
    });
  }
}

main();
