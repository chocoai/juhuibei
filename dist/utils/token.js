import { Config } from 'config.js';

class Token {
  constructor() {
    this.verifyUrl = Config.restUrl + 'token/verify';
    this.tokenUrl = Config.restUrl + 'token/user';
    this.userInfoUrl = Config.restUrl + 'token/info';
  }

  verify() {
    var that = this;
    var token = wx.getStorageSync('token');
    // console.log(token);
    if (!token) {
      // 获取用户ID
      this.getTokenFromServer((cb)=>{
        wx.setStorageSync('token', cb.token);
        wx.setStorageSync('uid', cb.uid);
        // 获取用户信息
        that.getUserInfo((data) => {
          data.user_id = cb.uid;
          // 存储用户信息
          wx.request({
            url: that.userInfoUrl,
            method: 'POST',
            data: {
              data: data
            },
            success: function (res) {
              console.log(res);
            }
          })
        });
      });    
    }
    else {
      this._veirfyFromServer(token);
    }
  }

  _veirfyFromServer(token) {
    var that = this;
    wx.request({
      url: that.verifyUrl,
      method: 'POST',
      data: {
        token: token
      },
      success: function (res) {
        var valid = res.data.isValid;
        if (!valid) {
          that.getTokenFromServer();
        }
      }
    })
  }

  getTokenFromServer(callBack) {
    var that = this;
    wx.login({
      success: function (res) {
        wx.request({
          url: that.tokenUrl,
          method: 'POST',
          data: {
            code: res.code
          },
          success: function (res) {
            callBack && callBack(res.data);
          }
        })
      }
    })
  }

  //得到用户微信信息
  getUserInfo(cb) {
    var that = this;
    wx.login({
      success: function () {
        wx.getUserInfo({
          success: function (res) {
            typeof cb == "function" && cb(res.userInfo);
          }
        });
      },
    })
  }
}

export { Token };