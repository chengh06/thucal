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
  'app_name': 'THU Calendar 2 Google'
});

function print_result(a){
    console.log(a);
}
function authorized(){
    oauth.sendSignedRequest(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        print_result
    );
}
oauth.authorize(authorized);

function createCalendar(name){
    /*
    gapi.client.calendar.calendars.insert({
        summary: name,

    }).execute(function(){
    });
    */
}

