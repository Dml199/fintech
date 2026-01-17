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
  static pruneOnEmptyContent(list ){
console.dir(list)
 for (let i = list.length - 1; i >= 0; --i) {
      if (list[i].content === undefined) {
        list.splice(i, 1);
      }
    }
  }

    
  

  static pruneOnFewWords(list) {


    for (let i = list.length - 1; i >= 0; --i) {
      if (list[i].header.split(" ").length < 3) {
        list.splice(i, 1);
      }
    }
  }
  static async purifyData(list) {
    const list_ = list
    this.Validate(list);
    this.pruneOnEmptyData(list);
    this.pruneOnFewWords(list);
    return list_
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
        for( let i = 0; i < children.length; ++i){
           let index = clsNm_obj.findIndex((elem)=>elem.class == children[i].className)
           if(index == -1){
            clsNm_obj.push({class:children[i].className,count:1})
           }
           else{
            clsNm_obj[index].count++
           }
        }
        let biggest = clsNm_obj[0];
        for (let j = 0; j< clsNm_obj.length; ++j)
        {
          if(clsNm_obj[j].count > biggest.count){
            biggest = clsNm_obj[j]
          }
        }
        children.map((elem)=>{if(elem.className == biggest.class){
          data_arr.push(elem.textContent)
        }})
          
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
