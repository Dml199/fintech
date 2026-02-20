



export class AskAi {
    constructor()
        {this.startPrompt = "Hello, i have a list of articles that affect energy market in world. I want you to give me an outlook of what industries, companies might be affected, what might happen next given all the available data about current state of the world and article. Provide information in following format. - Outlook: some output Action: buy stocks, sell stocks how much and when."
        }



 async askPerplexity(browser,question = "Hello!"){
  let page;
   if(browser.ai_pages.find((elem)=>{return elem.address==="perplexity"})){
     console.log("condition is true")
       page = browser.ai_pages.find((elem)=>{elem.address==="perplexity"})
   
   }
   else{ 
        console.log("condition is false")
    page =  await browser.go_to(["https://www.perplexity.ai/"],"perplexity")}

   
}

}