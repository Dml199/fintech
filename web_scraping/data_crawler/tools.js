import * as fs from "node:fs";

export class DataTools {
  static Validate(list) {
    if (list.length == 0) {
      console.log("Empty list given!");
      throw new Error("Empty list on data pipeline!");
    }
  }

  static pruneOnEmptyData(list) {
    for (let i = list.length - 1; i >= 0; --i) {
      if (list[i].href == "" || list[i].header == "") {
        list.splice(i, 1);
      }
    }
  }
  static pruneDuplicates(list) {
    for (let i = 0; i < list.length; ++i) {
      for (let j = list.length - 1; j > i; --j) {

        if (list[i].header == list[j].header) {

          list.splice(i, 1);
        } else {

        }
      }
    }
  }

  static pruneOnEmptyContent(list) {
    for (let i = list.length - 1; i >= 0; --i) {
      if (list[i].content === undefined) {
        list.splice(i, 1);
      }
    }
  }

  static sortByTopic(valid_list_) {
    const url = valid_list_.filter((item) => {
      const url = new URL(item.href);
      const path = url.pathname.split("/");
      if (path[1] == "business" && path[2] == "energy") {
        return true;
      } else {
        return false;
      }
    });

    return url;
  }
  static pruneHtmlTags(list) {
    for ( const item of list ){
      
      item.header = item.header.replaceAll(/<.*?>/g, "")
     item.content =  item.content.replaceAll(/<.*?>/g, "")
        item.header = item.header.replaceAll(/opens new tab/g, "")
      item.content = item.content.replaceAll(/opens new tab/g, "")


    }

  }
  static pruneOnFewWords(list) {
    for (let i = list.length - 1; i >= 0; --i) {
      if (list[i].header.split(" ").length < 3) {
        list.splice(i, 1);
      }
    }
  }

  static purifyData(list) {
    this.Validate(list);

    this.pruneOnEmptyData(list);

    this.pruneOnFewWords(list);
    this.pruneDuplicates(list);

    return this.sortByTopic(list);
  }
}

export class DomLogicHandler {
  constructor() {}

  static async check_node(node) {
    const text_info = await node.evaluate(async (el) => {
      let data_arr = [];
      let clsNm_obj = [];

      function wordCount(item) {
        if (item.split(" ").length >= 20) return true;
        else {
          return false;
        }
      }

      async function checkCurrentNode(elem) {
        const children = Array.from(elem.children);

        if (children.length >= 8) {
          for (let i = 0; i < children.length; ++i) {
            let index = clsNm_obj.findIndex(
              (elem) => elem.class == children[i].className,
            );
            if (index == -1) {
              clsNm_obj.push({ class: children[i].className, count: 1 });
            } else {
              clsNm_obj[index].count++;
            }
          }
          let biggest = clsNm_obj[0];
          for (let j = 0; j < clsNm_obj.length; ++j) {
            if (clsNm_obj[j].count > biggest.count) {
              biggest = clsNm_obj[j];
            }
          }
          children.map((elem) => {
            if (elem.className == biggest.class) {
              data_arr.push(elem.textContent);
            }
          });
        } else {
          for (child of elem.children) {
            await checkCurrentNode(child);
          }
        }
      }

      checkCurrentNode(el);

      return data_arr;
    });

    return text_info;
  }
}
