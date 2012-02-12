var {Cc, Ci} = require("chrome");
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var data = require("self").data;
var notifications = require("notifications");
var prefSet = require("simple-prefs");
var Request = require("request").Request;
var store = require("simple-storage");
var widgets = require("widget");
var tabs = require("tabs");
 
exports.main = function(options, callbacks) {
    setupWidget();
    if (store.storage.prefs === undefined) 
        store.storage.prefs = prefSet.prefs;
};

var setupWidget = function() {
    widgets.Widget({
        id: "flowfox-widget",
        label: "Flowfox: send page to flow",
        contentURL: data.url('widget/flowfox.png'),
        onClick: function () {
            sendToFlow();
        }
    });

};

var sendToFlow = function () {
    var encoded_url = encodeURIComponent(tabs.activeTab.url);
    var subject = encodeURIComponent(tabs.activeTab.title);
    var api_key = store.storage.prefs['apikey'];
    var from_address = store.storage.prefs['from_address'];
    var url = "https://api.flowdock.com/v1/messages/influx/" + api_key;
    var content =  "<a href=\"" + encoded_url + "\">" +
        subject + "</a>";

    Request({
        url: url,
        content: {
            from_address: from_address,
            source: "Flowfox",
            subject: subject,
            content: content,
            link: encoded_url
        },
        onComplete: function(response) {
            console.log(response.text)
            console.log("Request Complete")
            if (response.status == '200')
                notifications.notify({
                    iconURL: data.url('widget/flowfox.png'),
                    title: "Flowfox",
                    text: "Your link is shared!"
                });
            else
                notifications.notify({
                    iconURL: data.url('widget/flowfox.png'),
                    title: "Flowfox",
                    text: "Could not share link :("
                });
        }
    }).post();
};

var onPrefChange = function (prefName) {
    store.storage.prefs[prefName] = prefSet.prefs.apikey;
};

prefSet.on("apikey", onPrefChange);
prefSet.on("fromAddress", onPrefChange);
