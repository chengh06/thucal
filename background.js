function urlToTermId(url){
    var re=/zhjw\.cic\.tsinghua\.edu\.cn\/syxk\.vsyxkKcapb\.do\?m=ztkbSearch&p_xnxq=([0-9\-]+)/;
    var x=re.exec(url);
    if(x===null){
        return null;
    }else{
        return x[1];
    }
}

function correctDay(googDay){
    return (googDay===0)?7:googDay;
}

//takes: ["M", "D", ...]
//returns: goog.date.Date
function decodeDateFromParts(dateParts){
    var d=new goog.date.Date();
    var month=parseInt(dateParts[0], 10);
    var date=parseInt(dateParts[1], 10);
    d.setMonth(month-1); //caveat: setMonth takes [0, 11]
    d.setDate(date);

    //guesstimate year
    var t=window['termId'];
    if(t.charAt(t.length-1)==='1' && month<6){
        d.setYear(d.getFullYear()+1);
    }
    return d;
}

function decodeDateTime(d, str){
    var match=/(\d+):(\d+)/.exec(str);
    if(match===null) throw Error('这不科学！decodeDateTime');
    var hour=parseInt(match[1], 10);
    var minute=parseInt(match[2], 10);

    //date time hacks, assuming Beijing(Tsinghua can't teleport lah)
    var dt=goog.date.fromIsoString(d.toIsoString()+'T'+'000000+0800');
    var i=new goog.date.Interval();
    i.hours=hour;
    i.minutes=minute;
    dt.add(i);
    return dt;
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

/**
 * Main logic
 * <ul>
 * <li> parse the course grid </li>
 * <li> match it to course time listing </li>
 * <li> generate events and upload to google calendar </li>
 * </ul>
 */
function main(tab){
    //console.log(tab);
    window['termId']=urlToTermId(tab.url);
    //console.log(window['termId']);

    chrome.extension.onRequest.addListener(afterParse);
    chrome.tabs.executeScript(null, {
        file: 'parse.js',
        allFrames: true
    });
}
function afterParse(data){
    window['G']=data;
    //console.log(data);
    chrome.extension.onRequest.removeListener(afterParse);

    chrome.extension.onRequest.addListener(afterList);
    chrome.tabs.executeScript(null, {
        file: 'list.js',
        allFrames: true
    });
}
function afterList(data){
    window['L']=data;
   // console.log(data);
    chrome.extension.onRequest.removeListener(afterList);

    fusion();
}
function fusion(){
    var G=window['G'].courseTable;
    var L=window['L'];
    window['W1MON']=null;
    //console.log(G);
    //console.log(L);
    
    //A[w][d][p][seq]=week-expanded G[d][p][seq]
    var A=new Array(16+1);
    for(var w=1;w<=16;w++){
        A[w]=new Array(7+1);
        for(var d=1;d<=7;d++){
            A[w][d]=new Array(6+1);
            for(var p=1;p<=6;p++){
                A[w][d][p]=[/*{name, lab}*/];
            }
        }
    }

    var n=0;
    for(var d=1;d<=7;d++){
        for(var p=1;p<=6;p++){
            var cell=G[d][p]; //pun intended
            for(var i=0, ie=cell.length;i<ie;i++){
                var a=cell[i];
                for(var j=0, je=a.week.length;j<je;j++){
                    var w=a.week[j];
                    A[w][d][p].push({name: a.name, lab: a.lab, seq: i});
                    ++n;
                }
            }
        }
    }

    //B[]=flattened & sorted A
    var B=new Array(n);
    var Bn=0;
    for(var w=1;w<=16;w++){
        for(var d=1;d<=7;d++){
            for(var p=1;p<=6;p++){
                var cell=A[w][d][p];
                for(var i=0, ie=cell.length;i<ie;i++){
                    B[Bn++]={w:w, d:d, p:p, name: cell[i].name, lab: cell[i].lab, seq: cell[i].seq};
                }
            }
        }
    }

    //console.log(A);
    //console.log(B);
    
    //Now B should match L in order(i.e. flattened L is subsequence of B)
    //Go through B in reverse order and match B as much as possible

    //Result should be written to Window['F']
    //F[d][p][name]={d, p, seq, name, loc, info, startTime, endTime, week}
    //duplicates are checked for redundancy
    var F=new Array(7+1);
    for(var d=1;d<=7;d++){
        F[d]=new Array(6+1);
        for(var p=1;p<=6;p++){
            F[d][p]={};
        }
    }
    window['F']=F;

    for(var i=L.length;i-->0;){
        var Lday=L[i];
        if(!(Lday instanceof Object)) continue;
        var d=decodeDateFromParts(Lday.dateParts);
        var lectures=Lday.lectures;
        for(var j=lectures.length;j-->0;){
            var lec=lectures[j];
            while(Bn>=0 && match(d, lec, B[--Bn]));
        }
    }

    upload();
}
//match Lside with Gside: if they match, merge and push result to Window['F']
//return true on match, false otherwise, throws error if offset gets quirky
function match(Ldate, Lside, Gside){
    if(Lside.name!=Gside.name) return false;
    var offset_day=(Gside.w-1)*7+(Gside.d-1);
    var offset=new goog.date.Interval();
    offset.days=-offset_day; //caveat: add negative

    var W1MON=window['W1MON'];
    var W1MON_test=new goog.date.Date(Ldate);
    W1MON_test.add(offset);
    if(W1MON instanceof goog.date.Date){
        if(!W1MON.equals(W1MON_test)){
            throw Error('这不科学！日期对不上了！');
        }
    }else{
        window['W1MON']=W1MON_test;
    }

    var GsideOrig=window['G'].courseTable[Gside.d][Gside.p][Gside.seq];
    var ret={
        d: Gside.d,
        p: Gside.p,
        seq: Gside.seq,
        name: Gside.name,
        loc: Lside.loc,
        info: GsideOrig.info,
        week: GsideOrig.week,
    };

    //modify according to Gside lab info
    var startTimeStr=Lside.startTimeStr;
    var endTimeStr=Lside.endTimeStr;
    if(Gside.lab!==null){
        ret.name=ret.name+' Lab['+Gside.lab.name+']';
        if(Gside.lab.time && Gside.lab.time.length>0){
            var match=/([\d:]+)-([\d:]+)/.exec(Gside.lab.time);
            if(match!==null){
                startTimeStr=match[1];
                endTimeStr=match[2];
            }
        }
    }
    ret.startTime=decodeDateTime(Ldate, startTimeStr);
    ret.endTime=decodeDateTime(Ldate, endTimeStr);

    //redundancy check
    var ret_cmp=window['F'][ret.d][ret.p][ret.name];
    if(ret_cmp instanceof Object){
        if(ret.seq!=ret_cmp.seq){
            throw Error('这不科学！WTF?! in match(Ldate, Lside, Gside)');
        }
    }else{
        window['F'][ret.d][ret.p][ret.name]=ret;
    }
}

//Create calendar based on window['W1MON'] and window['F'][d][p][name]
//Fills into window['FC'] for upload
function upload(){
    var W1MON=window['W1MON'];
    var F=window['F'];
    var FC=[];
    for(var d=1;d<=7;d++){
        for(var p=1;p<=6;p++){
            for(var name in F[d][p]){
                var f=F[d][p][name];

                var offset=new goog.date.Interval();
                offset.days=d-1;
                var dt=new goog.date.DateTime(W1MON);
                dt.add(offset);
                var startDateTime=new goog.date.DateTime(dt);
                startDateTime.setHours(f.startTime.getHours());
                startDateTime.setMinutes(f.startTime.getMinutes());
                var endDateTime=new goog.date.DateTime(dt);
                endDateTime.setHours(f.endTime.getHours());
                endDateTime.setMinutes(f.endTime.getMinutes());

                var nWeek=new Array(16+1);
                for(var w=1;w<=16;w++){
                    nWeek[w]=true;
                }
                for(var i=0, ie=f.week.length;i<ie;i++){
                    nWeek[f.week[i]]=false;
                }

                //pending to create
                FC.push([f, startDateTime, endDateTime, nWeek]);
            }
        }
    }
    window['FC']=FC;
    authorize(afterAuthorize);
}
function afterAuthorize(){
    var match=/^(\d+)-(\d+)-(\d+)/.exec(window['termId']);
    var termName='THU:'+match[1]+'-'+match[2];
    switch(parseInt(match[3], 10)){
        case 1: termName+='\u79CB'; break;
        case 2: termName+='\u6625'; break;
        case 3: termName+='\u590F'; break;
    }
    createCalendar(
        termName+'['+(new goog.date.DateTime()).toIsoString()+']',
        afterCalendarReady
    );
}
function afterCalendarReady(o){
    window['calendarId']=o.id;
    uploadFC();
}
function uploadFC(){
    if(window['FC'] && window['FC'].length){
        console.log(window['FC'].length);
        var fc=window['FC'].pop();
        uploadFC1(fc);
    }
}
function uploadFC1(fc){
    createEvent(window['calendarId'], fc[0], fc[1], fc[2], function(o){
        uploadFC2(fc, o.id);
    });
}
function uploadFC2(fc, id){
    listEventInstance(window['calendarId'], id, function(o){
        uploadFC3(fc, id, o.items);
    });
}
function uploadFC3(fc, id, items){
    var nWeek=fc[3];
    for(var i=1;i<=16;i++){
        if(nWeek[i]){
            uploadFC3_1(i, items[i-1].id);
        }
    }
    setTimeout(uploadFC, 600);
}
function uploadFC3_1(i, id){
    setTimeout(function(){
        cancelEventInstance(window['calendarId'], id);
    }, 800/16*(i-1));
}
