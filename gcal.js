function stringify(parameters) {
  var params = [];
  for(var p in parameters) {
    params.push(encodeURIComponent(p) + '=' +
                encodeURIComponent(parameters[p]));
  }
  return params.join('&');
};
function esc(s){
    return encodeURIComponent(s);
}
function correctDateTime(dateTime){
    return dateTime.toXmlDateTime()+'+08:00';
}

//Google API authorization handling
var GAPI_KEY="AIzaSyAKhKf_NyHlqxw6BdT67J_3gbGa9oSfb4A";
var GAPI_CLIENT_ID="584858632131.apps.googleusercontent.com";
var GAPI_CLIENT_SECRET="_Ra9CVJCbrTxg8Sy1BaDFkNV";

var GAPI_REQUEST_URL='https://www.google.com/accounts/OAuthGetRequestToken';
var GAPI_AUTHORIZE_URL='https://www.google.com/accounts/OAuthAuthorizeToken';
var GAPI_ACCESS_URL='https://www.google.com/accounts/OAuthGetAccessToken';
var GAPI_REDIRECT_URI='urn:ietf:wg:oauth:2.0:oob';
var GAPI_SCOPE='https://www.googleapis.com/auth/calendar';

var oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': GAPI_REQUEST_URL,
  'authorize_url': GAPI_AUTHORIZE_URL,
  'access_url': GAPI_ACCESS_URL,
  'consumer_key': GAPI_CLIENT_ID,
  'consumer_secret': GAPI_CLIENT_SECRET,
  'scope': GAPI_SCOPE,
  'app_name': 'THU Calendar 2 Google by smilekzs @ github'
});


function authorize(callback){
    oauth.authorize(callback);
}


function authXhr(method, url, g, p, callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(data) {
        if(xhr.readyState==4){
            callback(xhr.responseText);
            xhr.onreadystatechange=null;
        }
    };
    xhr.open(method, url + '?' + stringify(g), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', oauth.getAuthorizationHeader(url, method, g));
    xhr.send(p);
}

function createCalendar(name, callback){
    //authorize(function(){
        authXhr('POST', 'https://www.googleapis.com/calendar/v3/calendars',
            {
                'fields': 'id'
            },
            JSON.stringify({
                'summary': name,
                'timeZone': 'Asia/Shanghai',
                'location': 'Beijing'
            }),
            function(r){
                var o=JSON.parse(r);
                if(callback) callback(o);
            }
        );
    //});
}

function createEvent(calendarId, data, startDateTime, endDateTime, /*recur,*/ callback){
    //authorize(function(){
        var data=
        {
                'start':{
                    'dateTime': correctDateTime(startDateTime),
                    'timeZone': 'Asia/Shanghai'
                },
                'end':{
                    'dateTime': correctDateTime(endDateTime),
                    'timeZone': 'Asia/Shanghai'
                },
                'summary': data.name,
                'location': data.loc,
                'description': data.info
        };
        //if(recur && recur!=='') data.recurrence=recur;
        authXhr('POST', 'https://www.googleapis.com/calendar/v3/calendars/'+esc(calendarId)+'/events',
            {
                'fields': 'id'
            },
            JSON.stringify(data),
            function(r){
                var o=JSON.parse(r);
                if(callback) callback(o);
            }
        );
    //});
}

function patchEventRecurrence(calendarId, eventId, recurrence, callback){
    //authorize(function(){
        authXhr('PATCH', 'https://www.googleapis.com/calendar/v3/calendars/'+esc(calendarId)+ '/events/'+esc(eventId),
            {
                //'fields': 'id'
            },
            JSON.stringify({
                recurrence: recurrence
            }),
            function(r){
                var o=JSON.parse(r);
                if(o){
                    callback(o);
                }
            }
        );
    //});
}
