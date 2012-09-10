function parseWeek(weekStr){
    var r=/(第([\d,-]+)|全|前八|后八|单|双)周/.exec(weekStr);
    if(r===null) return null;

    var ret=[];

    switch(r[1].charAt(0)){
        case '全':
            for(var i=1;i<=16;i++){
                ret.push(i);
            }
            break;
        case '前':
            for(var i=1;i<=8;i++){
                ret.push(i);
            }
            break;
        case '后':
            for(var i=9;i<=16;i++){
                ret.push(i);
            }
            break;
        case '单':
            for(var i=1;i<=15;i+=2){
                ret.push(i);
            }
            break;
        case '双':
            for(var i=2;i<=16;i+=2){
                ret.push(i);
            }
            break;
        case '第':
            //complicated case: "1-4,6,8-9,11" => [1, 2, 3, 4, 6, 8, 9, 11]
            var rangeStrList=r[2].split(',');
            for(var i=0, ie=rangeStrList.length;i<ie;i++){
                var rangeStr=rangeStrList[i];
                var match;
                match=/^\d+$/.exec(rangeStr);
                if(match!==null){
                    //isolated week#
                    ret.push(parseInt(match[0]));
                }
                match=/^(\d+)-(\d+)$/.exec(rangeStr);
                if(match!==null){
                    //week# range
                    var wBegin=parseInt(match[1]);
                    var wEnd=parseInt(match[2]);
                    for(var w=wBegin;w<=wEnd;w++){
                        ret.push(w);
                    }
                }
            }
            break;
        default:
            throw Error('这不科学！from parseWeek()');
    }
    return ret;
}

function parseCourse(titleElem){
    if(!(titleElem instanceof HTMLAnchorElement)){
        return null;
    }
    var infoElem=titleElem.nextSibling;
    var infoStr;
    var match;

    var ret={
        name: titleElem.firstChild.innerHTML
    };
    switch(titleElem.className){
        case 'mainHref':
            infoStr=infoElem.data;
            match=/\((.*周)；(.*)\)/.exec(infoStr);
            ret.lab=null;
            //ret.loc=match[2] || "";
            break;
        case 'blue_red_none':
            infoStr=infoElem.innerHTML;
            match=/(.*)\((.*)；(.*)周(.*?)(|时间(.*))\)/.exec(infoStr);
            ret.lab={
                name: match[1] || "",
                time: match[6] || "", //TODO: parse time and hash/merge same lab entries if available
            };
            //ret.loc=match[2] || "";
            break;
    }
    ret.week=parseWeek(infoStr);
    ret.info=infoStr;
    return ret;
}

function parseAllCoursesInGrid(day, period){
    var gridElem=document.getElementById('a'+period.toString()+'_'+day.toString());
    if(!(gridElem instanceof HTMLTableCellElement)){
        return [];
    }
    var ret=[];
    for(var el=gridElem.firstChild;el!==null;el=el.nextSibling){
        var course=parseCourse(el);
        if(course!==null){
            ret.push(course);
        }
    }
    return ret;
}

function parseAllCourses(){
    var ret=[];
    for(var day=1;day<=7;day++){
        ret[day]=[];
        for(var period=1;period<=6;period++){
            ret[day][period]=parseAllCoursesInGrid(day, period);
        }
    }
    return ret;
}

function getTermId(){
    var el=document.getElementsByName('p_xnxq')[0];
    if(!(el instanceof HTMLInputElement)){
        throw Error('这不科学！没有学期？');
    }
    return el.value;
}

try{
    chrome.extension.sendRequest({
        termId: getTermId(),
    courseTable: parseAllCourses()
    });
}catch(e){
    chrome.extension.sendRequest("error");
}
