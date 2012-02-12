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

function escapeHTML(str) str.replace(/[&"<>]/g, function (m) escapeHTML.replacements[m]);  
escapeHTML.replacements = { "&": "&amp;", '"': "&quot", "<": "&lt;", ">": "&gt;" };

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
    var link = encodeURI(tabs.activeTab.url);
    var subject = tabs.activeTab.title;
    var api_key = store.storage.prefs['apikey'];
    var from_address = store.storage.prefs['from_address'];
    var url = "https://api.flowdock.com/v1/messages/influx/" + escapeHTML(api_key);
    var content = "<a href=\"" + escapeHTML(tabs.activeTab.url) + "\">" +
        escapeHTML(subject) + "</a>";
    Request({
        url: url,
        content: {
            from_address: from_address,
            source: "Flowfox",
            subject: subject,
            content: content,
            link: link
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
