var URL='http://zhjw.cic.tsinghua.edu.cn/jxmh.do';

function stringify(parameters) {
  var params = [];
  for(var p in parameters) {
    params.push(encodeURIComponent(p) + '=' +
                encodeURIComponent(parameters[p]));
  }
  return params.join('&');
};

function date2yyyymmdd(d){
    return /(\d\d\d\d)-(\d\d)-(\d\d)/.exec(d.toISOString()).slice(1).join('')
}

function getList(){
    var xhr=new XMLHttpRequest;
    xhr.open('GET', URL+'?m=bks_jxrl_all', true);
    xhr.onreadystatechange=function(){
        if(xhr.readyState===4){
            afterInitialList(xhr.responseText);
            xhr.onreadystatechange=null;
        }
    }
    xhr.send();
}
function afterInitialList(r){
    var params={
        'm': 'bks_jxrl_all',
        'role': 'bks',
        'grrlID': '',
        'displayType': '',
    };
    var match;
    match=/name="token" value="([\da-f]+)"/.exec(r);
    if(match===null) throw Error('这不科学！afterInitialList找不到token');
    params.token=match[1];

    var d1=new Date();
    var d2=new Date(d1);
    d2.setFullYear(d1.getFullYear()+2);
    params['p_start_date']=date2yyyymmdd(d1);
    params['p_end_date']=date2yyyymmdd(d2);

    var xhr=new XMLHttpRequest;
    xhr.open('POST', URL/*+'?m=bks_jxrl_all'*/, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange=function(){
        if(xhr.readyState===4){
            afterListAll(xhr.responseText);
            xhr.onreadystatechange=null;
        }
    }

    console.log(stringify(params));
    xhr.send(stringify(params));
}
function afterListAll(r){
    //load data section into DOM
    var re=/<form name="frm"[^]*\/form>/m;
    var contentHtml=re.exec(r)[0];
    contentHtml=contentHtml.replace(/<\/?div>/g, '');
    var el=document.getElementById('thucal');
    if(el===null){
        el=document.body.appendChild(document.createElement('div'));
        el.id='thucal';
        el.style.display='none';
    }
    el.innerHTML=contentHtml;

    //extract data
    var DLT=el.getElementsByClassName('data_list_table');
    //console.log(DLT);
    var ret=new Array(DLT.length+1);
    for(var i=0, ie=DLT.length-1;i<ie;i++){
        var dd=DLT[i+1];

        var t1=dd.previousElementSibling;
        if(!(t1 instanceof HTMLTableElement)) throw Error('这不科学！t1 not table');
        var dateStr=t1.firstElementChild/*tbody*/.firstElementChild/*tr*/.firstElementChild/*td*/.firstChild/*text*/.data;
        var match=/★(\d+)月(\d+)日（(.*)）/.exec(dateStr);
        if(match===null) throw Error('这不科学！日期错乱');
        ret[i]={
            dateParts: match.slice(1),
            lectures: []
        };

        var t2=dd.firstElementChild/*tbody*/.firstElementChild/*header tr*/.nextElementSibling/*first data tr*/;
        if(!(t2 instanceof HTMLTableRowElement)) throw Error('这不科学！t2 not tr');
        for(;t2!==null;t2=t2.nextElementSibling){
            ret[i].lectures.push({
                startTimeStr: t2.children[0].innerHTML,
                endTimeStr: t2.children[1].innerHTML,
                lab: (t2.children[2].innerHTML==="实验"?true:false),
                name: t2.children[3].innerHTML,
                loc: t2.children[4].innerHTML
            });
        }
    }
    //console.log(ret);
    
    chrome.extension.sendRequest(ret);
}

getList();
