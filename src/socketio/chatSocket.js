/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    01/09/2019
 Author:     Chris Brame

 **/
var _       = require('lodash');
var async   = require('async');
var winston = require('winston');
var utils   = require('../helpers/utils');

var sharedVars  = require('./index').shared;
var sharedUtils = require('./index').utils;

var events = {};

function register(socket) {
    events.updateOnlineBubbles(socket);
    events.updateConversationsNotifications(socket);
    events.spawnChatWindow(socket);
    events.getOpenChatWindows(socket);
    events.onChatMessage(socket);
    events.onChatTyping(socket);
    events.onChatStopTyping(socket);
    events.saveChatWindow(socket);

    if (socket.request.user.logged_in)
        joinChatServer(socket);

//     var socketInterval = setInterval(function() {
//         console.log('CALLED');
//         updateConversationsNotifications(socket);
//     }, 5000);
// var a = [];
//     a.push(socketInterval);
}

function registerInterval() {
    // Global to server start (1 instance)
    setInterval(function() {
        updateOnlineBubbles();
    }, 5000);
}

function updateOnlineBubbles() {
    var sortedUserList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.usersOnline), function(o) { return o[0]; }));
    var sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.idleUsers), function(o) { return o[0]; }));

    utils.sendToAllConnectedClients(io, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});

    // utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
}

events.updateOnlineBubbles = function(socket) {
    socket.on('$trudesk:chat:updateOnlineBubbles', function() {
        updateOnlineBubbles();
    });
};

function updateConversationsNotifications(socket) {
    async.each(io.sockets, function(sock) {
        console.log(sock);
    });

    var userId = socket.request.user._id;
    var messageSchema = require('../models/chat/message');
    var conversationSchema = require('../models/chat/conversation');
    conversationSchema.getConversationsWithLimit(userId, 10, function(err, conversations) {
        if (err) {
            winston.warn(err.message);
            return false;
        }

        var convos = [];

        async.eachSeries(conversations, function(convo, done) {
            var c = convo.toObject();

            var userMeta = convo.userMeta[_.findIndex(convo.userMeta, function(item) { return item.userId.toString() === userId.toString(); })];
            if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt)
                return done();


            messageSchema.getMostRecentMessage(c._id, function(err, rm) {
                if (err) return done(err);

                _.each(c.participants, function(p) {
                    if (p._id.toString() !== userId.toString())
                        c.partner = p;
                });

                rm = _.first(rm);

                if (!_.isUndefined(rm)) {
                    if (!c.partner || !rm.owner) return done();

                    if (String(c.partner._id) === String(rm.owner._id))
                        c.recentMessage = c.partner.fullname + ': ' + rm.body;
                    else
                        c.recentMessage = 'You: ' + rm.body;

                } else
                    c.recentMessage = 'New Conversation';


                convos.push(c);

                return done();
            });

        }, function(err) {
            if (err) return false;
            return utils.sendToSelf(socket, 'updateConversationsNotifications', {conversations: convos});
        });
    });
}

events.updateConversationsNotifications = function(socket) {
    socket.on('$trudesk:chat:updateConversationsNotifications', function() {
        updateConversationsNotifications(socket);
    });
};

function spawnOpenChatWindows(socket) {
    var loggedInAccountId = socket.request.user._id;
    var userSchema = require('../models/user');
    var conversationSchema = require('../models/chat/conversation');
    userSchema.getUser(loggedInAccountId, function(err, user) {
        if (err) return true;

        async.eachSeries(user.preferences.openChatWindows, function(convoId, done) {
            var partner = null;
            conversationSchema.getConversation(convoId, function(err, conversation) {
                if (err || !conversation) return done();
                _.each(conversation.participants, function(i) {
                    if (i._id.toString() !== loggedInAccountId.toString()) {
                        partner = i.toObject();
                        return partner;
                    }
                });

                if (partner === null) return done();

                delete partner.password;
                delete partner.resetPassHash;
                delete partner.resetPassExpire;
                delete partner.accessToken;
                delete partner.iOSDeviceTokens;
                delete partner.deleted;

                utils.sendToSelf(socket, 'spawnChatWindow', partner);

                return done();
            });
        });
    });
}

events.getOpenChatWindows = function(socket) {
    socket.on('getOpenChatWindows', function() {
        spawnOpenChatWindows(socket);
    });
};

events.spawnChatWindow = function(socket) {
    socket.on('spawnChatWindow', function(userId) {
        //Get user
        var userSchema = require('../models/user');
        userSchema.getUser(userId, function(err, user) {
            if (err) return true;
            if (user !== null) {
                var u = user.toObject();
                delete u.password;
                delete u.resetPassHash;
                delete u.resetPassExpire;
                delete u.accessToken;
                delete u.iOSDeviceTokens;
                delete u.deleted;

                utils.sendToSelf(socket,'spawnChatWindow', u);
            }
        });
    });
};

events.saveChatWindow = function(socket) {
    socket.on('saveChatWindow', function(data) {
        var userId = data.userId;
        var convoId = data.convoId;
        var remove = data.remove;

        var userSchema = require('../models/user');
        userSchema.getUser(userId, function(err, user) {
            if (err) return true;
            if (user !== null) {
                if (remove)
                    user.removeOpenChatWindow(convoId);
                else
                    user.addOpenChatWindow(convoId);


            }
        });
    });
};

events.onChatMessage = function(socket) {
    socket.on('chatMessage', function(data) {
        var to = data.to;
        var from = data.from;
        var od = data.type;
        if (data.type === 's')
            data.type = 'r';
        else
            data.type = 's';


        var userSchema = require('../models/user');

        async.parallel([
            function(next) {
                userSchema.getUser(to, function(err, toUser) {
                    if (err) return next(err);
                    if (!toUser) return next('User Not Found!');

                    data.toUser = toUser;

                    return next();
                });
            },
            function(next) {
                userSchema.getUser(from, function(err, fromUser) {
                    if (err) return next(err);
                    if (!fromUser) return next('User Not Found');

                    data.fromUser = fromUser;

                    return next();
                });
            }
        ], function(err) {
            if (err) return utils.sendToSelf(socket, 'chatMessage', {message: err});

            utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, data.toUser.username, 'chatMessage', data);
            data.type = od;
            utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, data.fromUser.username, 'chatMessage', data);
        });
    });
};

events.onChatTyping = function(socket) {
    socket.on('chatTyping', function(data) {
        var to = data.to;
        var from = data.from;

        var user = null;
        var fromUser = null;

        _.find(sharedVars.usersOnline, function(v) {
            if (String(v.user._id) === String(to))
                user = v.user;

            if (String(v.user._id) === String(from))
                fromUser = v.user;

        });

        if (_.isNull(user) || _.isNull(fromUser))
            return;


        data.toUser = user;
        data.fromUser = fromUser;

        utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, user.username, 'chatTyping', data);
    });
};

events.onChatStopTyping = function(socket) {
    socket.on('chatStopTyping', function(data) {
        var to = data.to;
        var user = null;

        _.find(sharedVars.usersOnline, function(v) {
            if (String(v.user._id) === String(to))
                user = v.user;

        });

        if (_.isNull(user))
            return;


        data.toUser = user;

        utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, user.username, 'chatStopTyping', data);
    });
};

function joinChatServer(socket) {
    var user = socket.request.user;
    var exists = false;
    if (sharedVars.usersOnline.hasOwnProperty(user.username.toLowerCase()))
        exists = true;

    var sortedUserList;

    if (!exists) {
        if (user.username.length !== 0) {
            sharedVars.usersOnline[user.username] = {sockets: [socket.id], user: user};
            sortedUserList = sharedUtils.sortByKeys(sharedVars.usersOnline);

            utils.sendToSelf(socket, 'joinSuccessfully');
            utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
            sharedVars.sockets.push(socket);

            spawnOpenChatWindows(socket, user._id);
        }
    } else {
        sharedVars.usersOnline[user.username].sockets.push(socket.id);
        utils.sendToSelf(socket, 'joinSuccessfully');

        sortedUserList = sharedUtils.sortByKeys(sharedVars.usersOnline);
        utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
        sharedVars.sockets.push(socket);

        spawnOpenChatWindows(socket, user._id);
    }
}

module.exports = {
    events: events,
    register: register,
    registerInterval: registerInterval
};