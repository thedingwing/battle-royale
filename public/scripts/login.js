var action = "";
var groupName = "";
var groupPass = "";
var playerName = "";

function storeGroup() {
    // Check browser support

    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("groupName", groupName);
        localStorage.setItem("groupPass", groupPass);
        localStorage.setItem("playerName", playerName);
        localStorage.setItem("action", action);
    } else {
        alert("No storage detected!")
    }
}

function startGame() {
window.location = "play.html";
}

function retrieveGroup() {
    if (localStorage.getItem("playerName") != null) {
        groupName = localStorage.getItem("groupName");
        groupPass = localStorage.getItem("groupPass");
        playerName = localStorage.getItem("playerName");
        action = localStorage.getItem("action");
        $("#actionEntry").fadeOut(1);
        $("#playerList").fadeIn(0);
        fb.once("value", function (snapshot) {
            if (snapshot.child(groupName).child("playing").val() == false) {
                fb.child(groupName).child("players").on("child_added", function (snapshot, prevChildKey) {
                    loadMessages(snapshot);
                    if (action == "create") {
                        $("#createStart").show();
                    } else if (action == "join") {
                        $("#joinStart").show();
                    }
                });
                fb.child(groupName).child("players").on("child_removed", function (oldSnapshot) {
                    $("#playerList > ul > #PLAYER_" + oldSnapshot.child("name").val()).remove();
                });
            }
        });

    }
}

function throwError(message) {
    alert(message);
}

function openLoginEntry() {
    $("#actionEntry").fadeOut(400);
    $("#loginEntry").delay(410).fadeIn(400);
}

function submitGroup() {

    fb.once("value", function (snapshot) {

        if (action == "create") {

            if (snapshot.child(groupName).exists()) {
                throwError("That room already exists.");
            } else {
                var now = new Date().getTime() / 1000;
                fb.child(groupName).set({
                    name: groupName,
                    password: groupPass,
                    playing: "notPlaying",
                    startTime: now
                });
                storeGroup();
                fb.child(groupName).child("players").on("child_added", function (snapshot, prevChildKey) {
                    loadMessages(snapshot);
                });
                fb.child(groupName).child("players").on("child_removed", function (oldSnapshot) {
                    $("#playerList > ul > #PLAYER_" + oldSnapshot.child("name").val()).remove();
                });
                $("#loginEntry").fadeOut(400);
                $("#playerEntry").delay(410).fadeIn(400);
            }

        } else if (action == "join") {

            if (snapshot.child(groupName).exists()) {
                if (snapshot.child(groupName).child("password").val() == groupPass) {
                    $("#loginEntry").fadeOut(400);
                    $("#playerEntry").delay(410).fadeIn(400);
                    storeGroup();
                    fb.child(groupName).child("players").on("child_added", function (snapshot, prevChildKey) {
                        loadMessages(snapshot);
                    	});
                    fb.child(groupName).child("players").on("child_removed", function (oldSnapshot) {
                        $("#playerList > ul > #PLAYER_" + oldSnapshot.child("name").val()).remove();
                    	});
                    fb.child(groupName).on("child_modified", function(snapshot) {
                    	if(snapshot.val() == "isPlaying") {
                    		startGame();
                    		}
                    	});
                } else {
                    throwError("Incorrect password.");
                }
            } else {
                throwError("That room doesn't exist.");
            }

        }

    });

}

function submitPlayer() {

    fb.once("value", function (snapshot) {
        if (snapshot.child(groupName).child("players").child(playerName).exists()) {
            throwError("That name is already in use.");
        } else {
            storeGroup();
            try {
            fb.child(groupName).child("players").child(playerName).set({
                name: playerName,
                alive: true,
                lat: latitude,
                log: longitude,
                powerups: {
                    stalkerVision: false
                }
            });
        }
        catch(error) {
            fb.child(groupName).child("players").child(playerName).set({
                name: playerName,
                alive: true,
                powerups: {
                    stalkerVision: false
                }
            });

        }
            $("#playerEntry").fadeOut(400);
            if (action == "create") {
                $("#createStart").show();
            } else if (action == "join") {
                $("#joinStart").show();
            }
            $("#playerList").delay(410).fadeIn(400);
        }
    });

}

function loadMessages(snapshot) {

    var url = "http://whattoeatuw.com/identicon/index.php?name=" + snapshot.child("name").val();
    $.ajax({
        method: "GET",
        url: url,
        success: function (imgData) {
            $("#playerList > ul").append('<li id="PLAYER_' + snapshot.child("name").val() + '"><img src="' + imgData + '" class="playerThumbnail" /><h3>' + snapshot.child("name").val() + '</h3></li>');
        },
        error: function () {
            $("#playerList > ul").append('<li id="PLAYER_' + snapshot.child("name").val() + '"><h3>' + snapshot.child("name").val() + '</h3></li>');
        },
    });

}

$(document).ready(function () {

    $("#loginEntry").fadeOut(0);
    $("#playerEntry").fadeOut(0);
    $("#createStart").hide();
    $("#joinStart").hide();
    $("#playerList").fadeOut(0);

    $("#create").click(function () {
        action = "create";
        $("#submit").html("Create");
        openLoginEntry();
    });

    $("#join").click(function () {
        action = "join";
        $("#submit").html("Join");
        openLoginEntry();
    });

    $("#submit").click(function () {
        groupName = $("#gName").val();
        groupPass = $("#gPassword").val();
        submitGroup();
    });

    $("#enter").click(function () {
        playerName = $("#name").val();
        submitPlayer();
    });

    $("#loginBack").click(function () {
        $("#loginEntry").fadeOut(400);
        $("#actionEntry").delay(410).fadeIn(400);
    });

    $("#playerBack").click(function () {
        $("#playerEntry").fadeOut(400);
        $("#loginEntry").delay(410).fadeIn(400);
    });

    $("#createStart").click(function () {
        fb.child(groupName).child("players").once("value", function (snapshot) {
            var randomOrder = [];
            snapshot.forEach(function(childSnapshot) {
                if(Math.random() > 0.5) {
                    randomOrder.unshift(childSnapshot.child("name").val());
                } else {
                    randomOrder.push(childSnapshot.child("name").val());
                }
            });
            console.log(randomOrder);
            for(var i = 0; i < randomOrder.length - 1; i++) {
                fb.child(groupName).child("players").child(randomOrder[i]).child("target").set(randomOrder[i+1]);
            }
            fb.child(groupName).child("players").child(randomOrder[randomOrder.length-1]).child("target").set(randomOrder[0]);
        });
        
        fb.child(groupName).child("playing").set("isPlaying");
        startGame();
        
    });
    
    $("#quit").click(function () {

        localStorage.removeItem("groupName");
        localStorage.removeItem("groupPass");
        localStorage.removeItem("playerName");
        localStorage.removeItem("action");

        fb.child(groupName).child("players").child(playerName).remove();
        fb.child(groupName).child("players").off("child_added");

        fb.once("value", function (snapshot) {
            if (!snapshot.child(groupName).child("players").exists()) {
                fb.child(groupName).remove();
            }
        });

        $("#playerList > ul").empty();
        $("#playerList").fadeOut(400);
        $("#actionEntry").delay(410).fadeIn(400);

    });

    retrieveGroup();
    
});