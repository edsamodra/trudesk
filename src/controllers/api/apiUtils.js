/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    2/14/19 2:09 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

const _ = require('lodash')

const apiUtils = {}

apiUtils.sendApiSuccess = function (res, object) {
  const sendObject = { success: true }
  const resObject = _.merge(sendObject, object)

  return res.json(resObject)
}

apiUtils.sendApiError = function (res, errorNum, error) {
  return res.status(errorNum).json({ success: false, error })
}
apiUtils.sendApiError_InvalidPostData = function (res) {
  return apiUtils.sendApiError(res, 400, 'Invalid Post Data')
}

apiUtils.generateJWTToken = function (dbUser) {
  return new Promise((resolve, reject) => {
    const nconf = require('nconf')
    const jwt = require('jsonwebtoken')

    const resUser = _.clone(dbUser._doc)
    const refreshToken = resUser.accessToken
    delete resUser.resetPassExpire
    delete resUser.resetPassHash
    delete resUser.password
    delete resUser.iOSDeviceTokens
    delete resUser.tOTPKey
    delete resUser.__v
    delete resUser.preferences
    delete resUser.accessToken
    delete resUser.deleted
    delete resUser.hasL2Auth

    const secret = nconf.get('tokens') ? nconf.get('tokens').secret : false
    const expires = nconf.get('tokens') ? nconf.get('tokens').expires : 3600
    
    if (!secret || !expires) {
      return reject(new Error('Invalid Server Configuration'))
    }

    require('../../models/group').getAllGroupsOfUserNoPopulate(dbUser._id, (err, grps) => {
      if (err) return reject(err)
      
      resUser.groups = grps.map(function (g) {
        return g._id
      })

      const token = jwt.sign({ user: resUser }, secret, { expiresIn: expires })
      resolve({ token: token, refreshToken: refreshToken })
    })
  })
}

apiUtils.stripUserFields = function (user) {
  user.password = undefined
  user.accessToken = undefined
  user.__v = undefined
  user.tOTPKey = undefined
  user.iOSDeviceTokens = undefined

  return user
}

module.exports = apiUtils
