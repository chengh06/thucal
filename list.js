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
    //load it into DOM
    var re=/<form name="frm"[^]*\/form>/m;
    var contentHtml=re.exec(r)[0];
    contentHtml=contentHtml.replace(/<\/?div>/g, '');
    var el=document.body.appendChild(document.createElement('div'));
    el.id='thucal';
    el.style.display='none';
    el.innerHTML=contentHtml;

    //extract data
    ;
}

alert('list');
getList();
