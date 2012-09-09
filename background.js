function urlToTermId(url){
    var re=/zhjw\.cic\.tsinghua\.edu\.cn\/syxk\.vsyxkKcapb\.do\?m=ztkbSearch&p_xnxq=([0-9\-]+)/;
    var x=re.exec(url);
    if(x===null){
        return null;
    }else{
        return x[1];
    }
}

////Setup the icon
function updateIcon(tab) {
    if(urlToTermId(tab.url)!==null){
        chrome.pageAction.show(tab.id);
    }else{
        chrome.pageAction.hide(tab.id);
    }
};
chrome.tabs.onActivated.addListener(function(activated){
    chrome.tabs.get(activated.tabId, updateIcon);
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    updateIcon(tab);
});
chrome.pageAction.onClicked.addListener(main);

////Main function
function main(tab){
    console.log(tab);
    var termId=urlToTermId(tab.url);
    console.log(termId);

    chrome.extension.onRequest.addListener(afterParse);
    chrome.tabs.executeScript(null, {
        file: 'parse.js',
        allFrames: true,
    });
}
function afterParse(data){
    console.log(data);//TODO: process and export to google calendar
    chrome.extension.onRequest.removeListener(afterParse);
}
