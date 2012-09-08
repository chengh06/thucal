var URL_XK_ROOT='zhjw.cic.tsinghua.edu.cn/xkBks.vxkBksXkbBs.do?m=main';

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

////
function main(tab){
    console.log(tab);
    var termId=urlToTermId(tab.url);
    console.log(termId);
    chrome.tabs.executeScript(tab.id, {
        allFrames: false,
        file: "parse.js"
    });
}
