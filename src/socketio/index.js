/*
      .                             .o8                     oooo
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

var _   = require('lodash');


function sortByKeys(obj) {
    var keys = Object.keys(obj);
    var sortedKeys = _.sortBy(keys);
    return _.fromPairs(
        _.map(sortedKeys, function(key) { return [key, obj[key]]; })
    );
}

module.exports = {
    utils: {
        sortByKeys: sortByKeys
    },
    shared: {
        sockets: [],
        usersOnline: {},
        idleUsers: {},
        intervals: []
    }
};