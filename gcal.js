//Google API authorization handling
var GAPI_REQUEST_URL='https://www.google.com/accounts/OAuthGetRequestToken';
var GAPI_AUTHORIZE_URL='https://www.google.com/accounts/OAuthAuthorizeToken';
var GAPI_ACCESS_URL='https://www.google.com/accounts/OAuthGetAccessToken';
var GAPI_REDIRECT_URI='urn:ietf:wg:oauth:2.0:oob';
var GAPI_SCOPE='https://www.googleapis.com/auth/calendar';

var oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': GAPI_REQUEST_URL,
  'authorize_url': GAPI_AUTHORIZE_URL,
  'access_url': GAPI_ACCESS_URL,
  'consumer_key': 'anonymous',
  'consumer_secret': 'anonymous',
  'scope': GAPI_SCOPE,
  'app_name': 'THU Calendar 2 Google'
});

oauth.authorize(function(){
    alert('yes');
});

function createCalendar(name){
    /*
    gapi.client.calendar.calendars.insert({
        summary: name,

    }).execute(function(){
    });
    */
}

