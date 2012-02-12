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
    // create toolbarbutton
    var tbb = require("toolbarbutton").ToolbarButton({
        id: "flowfox",
        label: "Flowfox: send page to flow",
        image: data.url('widget/flowfox.png'),
        onCommand: function () {
            // tabs.activeTab.attach();
            // use tabs.activeTab.attach() to execute scripts in the context of the browser tab
            var subject = encodeURIComponent(tabs.activeTab.title);
            var content = encodeURIComponent("<a href=\"" + tabs.activeTab.url + "\">" +
                                             tabs.activeTab.title + "</a>");
            var api_key = store.storage.prefs['apikey'];
            var from_address = store.storage.prefs['from_address'];
            var url = "https://api.flowdock.com/v1/messages/influx/" + api_key;
            console.log(url);
            Request({
                url: url,
                content: {
                    from_address: from_address,
                    source: "Flowfox",
                    subject: subject,
                    content: content,
                    link: encodeURIComponent(tabs.activeTab.url)
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
            }).post()
        }
    });

    if (options.loadReason == "install") {
        tbb.moveTo({
            toolbarID: "nav-bar",
            forceMove: false // only move from palette
        });
    }
    if (store.storage.prefs === undefined) 
        store.storage.prefs = prefSet.prefs;
};

var onPrefChange = function (prefName) {
    store.storage.prefs[prefName] = prefSet.prefs.apikey;
}

prefSet.on("apikey", onPrefChange);
prefSet.on("fromAddress", onPrefChange);

function addToolbarButton() {
    var document = mediator.getMostRecentWindow("navigator:browser").document;      
    var navBar = document.getElementById("nav-bar");
    if (!navBar) {
        return;
    }
    var btn = document.createElement("toolbarbutton");  

    btn.setAttribute('type', 'button');
    btn.setAttribute('class', 'toolbarbutton-1');
    btn.setAttribute('image', data.url('widget/flowfox.png')); // path is relative to data folder
    btn.setAttribute('orient', 'horizontal');
    btn.setAttribute('label', 'My App');

    navBar.appendChild(btn);
}

console.log("The add-on is running.");
