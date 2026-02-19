



class AskAi {
    constructor()
        {this.startPrompt = "Hello, i have a list of articles that affect energy market in world. I want you to give me an outlook of what industries, companies might be affected, what might happen next given all the available data about current state of the world and article. Provide information in following format. - Outlook: some output Action: buy stocks, sell stocks how much and when."
        }


 askPerplexity(browser,question ){

    browser.go_to(["https://www.perplexity.ai/"],"perplexity")

}

}