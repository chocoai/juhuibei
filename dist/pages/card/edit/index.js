import { $wuxToptips } from '../../../packages/@wux/components/wux';
import WxValidate from '../../../common/assets/plugins/WxValidate';
import api from '../../../api/api_v1.js'
import { Cache } from '../../../utils/cache.js';
var cache = new Cache();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    swiper: {
      indicatorDots: true,  // 是否显示面板指示点
      autoplay: false,      // 是否自动切换
      interval: 5000,       // 自动切换时间间隔
      duration: 500,        // 滑动动画时长
      vertical: false,      // 滑动方向是否为纵向
    },
    form: {
      bride_name: '',         // 新娘姓名
      bride_phone: '',        // 新娘手机
      bridegroom_name: '',    // 新郎姓名
      bridegroom_phone: '',   // 新郎手机
      date: "2018-5-20",      // 婚礼日期
      time: "12:00",          // 婚礼时间
      latitude: '',           // 纬度
      longitude: '',          // 经度
      wedding_address: '选择',// 婚礼地址
      cover: '',              // cover页小图
      has_video: 0,           // 是否有视频
      wedding_video: '',      // 视频地址
      wedding_video_cover: '',// 视频截图
      music_id: 0,            // 背景音乐
    },
    music_list: [],
    tag: [],
    tag_change: 0, // 是否更新tag数据
  },
  music_id: 0,
  card_id: 0,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initValidate();  // 先初始化验证器
    let uid = cache.get('uid');
    this.card_id = +options.card_id;
    if (uid && this.card_id) {
      this.editCardInfo(this.card_id);
    }
  },

  /**
   * 获取卡信息 | api
   */
  editCardInfo: function (card_id) {
    let that = this;
    api.editCardInfo({
      query: {
        card_id: card_id
      },
      success: (res) => {
        console.log('editCardInfo', res.data.data);
        if (res.data.res === 0) {         
          that.setData({
            form: res.data.data.form,
            music_list: res.data.data.music_list,
            tag: res.data.data.tag
          });
        }
      }
    })
  },

  /**
   * 初始化验证器
   */
  initValidate: function() {
    this.WxValidate = new WxValidate({
      bride_name: { required: true },
      bride_phone: { tel: true },
      bridegroom_name: { required: true },
      bridegroom_phone: { tel: true },
      wedding_video: { url: true }
    }, {
        bride_name: {
          required: '需输入新娘姓名',
        },
        bride_phone: {
          tel: '请输入正确的手机号',
        },
        bridegroom_name: {
          required: '需输入新娘姓名',
        },
        bridegroom_phone: {
          tel: '请输入正确的手机号',
        },
        wedding_video: {
          url: '请输入正确的视频链接',
        }
      })
  },

  /**
   * 表单提交
   */
  submitForm: function (e) {
    console.log('submitForm', e);
    console.log(this.music_id, e);
    let that = this;
    const params = e.detail.value;
    if (!this.WxValidate.checkForm(e)) {
      const error = this.WxValidate.errorList[0]
      this.showToptips(error)
      return false
    }
    if (this.data.form.wedding_address == '选择') {
      this.showToptips({ msg: '请选择婚礼地址' })
      return false
    }
    
    let wedding_video_cover = '';
    if (this.data.form.has_video === 1) {
      wedding_video_cover = this.data.form.wedding_video_cover.url
    }

    let data = {
      form_id: e.detail.formId,
      bride_name: params.bride_name,
      bride_phone: params.bride_phone,
      bridegroom_name: params.bridegroom_name,
      bridegroom_phone: params.bridegroom_phone,
      date: params.date,
      time: params.time,
      wedding_video: params.wedding_video,
      latitude: this.data.form.latitude,
      longitude: this.data.form.longitude,
      wedding_address: this.data.form.wedding_address,
      cover: this.data.form.cover.url,
      wedding_video_cover: wedding_video_cover,
      tag: this.data.tag,
      tag_change: this.data.tag_change, // 是否更新tag数据
      music_id: this.music_id,  // 如果music_id = 0 说明没有切换音乐
      card_id: this.card_id
    }
    console.log(data);

    api.saveCard({
      method: 'post',
      data: data,
      success: (res) => {
        console.log('saveCard', res);
        if (res.data.res === 0) {
          $wuxToptips.success({
            hidden: !0,
            text: '提交成功'
          });
          wx.redirectTo({ url: '/pages/card/my/index' });
        }
      }
    })

    
  },

  /**
   * 错误提示
   */
  showToptips(error) {
    const hideToptips = $wuxToptips.show({
      timer: 3000,
      text: error.msg || '请填写正确的字段',
      success: () => console.log('toptips', error)
    })
  },

  /**
   * 预览图片
   */
  previewImage: function(e) {
    wx.previewImage({
      current: e.target.dataset.url, // 当前显示图片的http链接
      urls: [e.target.dataset.url] // 需要预览的图片http链接列表
    })
  },

  /**
   * 切换 音乐
   */
  radioChange: function (e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value);
    this.music_id = e.detail.value;
    let music_list = this.data.music_list;
    for (let i = 0, len = music_list.length; i < len; ++i) {
      music_list[i].checked = music_list[i].id == e.detail.value;
    }
    this.setData({ music_list: music_list });
  },

  playMusic: function(e) {
    wx.playBackgroundAudio({
      dataUrl: e.target.dataset.url,
      title: '背景音乐',
      coverImgUrl: ''
    })
  },

  /**
   * 更换地址
   */
  chooseLocation: function () {
    let form = this.data.form;
    let that = this;
    wx.chooseLocation({
      success: function (ret) {
        console.log('chooseLocation', ret)
        form.latitude        = +ret.latitude;
        form.longitude       = +ret.longitude;
        form.wedding_address = ret.name;
        that.setData({ form: form });
      },
      cancel: function () {
        console.log('chooseLocation', '取消了选择');
      }
    })
  },

  /**
   * 上传图片
   */
  chooseImage: function (e) {
    let width = e.target.dataset.img.width;
    let height = e.target.dataset.img.height;
    let name = e.target.dataset.name;
    if (width && height && name) {
      wx.navigateTo({
        url: '../cut/index?width=' + width + '&height=' + height + '&name=' + name 
      })
    }
  },

  bindDateChange: function (e) {
    let form = this.data.form;
    form.date = e.detail.value
    this.setData({ form: form })
  },

  bindTimeChange: function (e) {
    let form = this.data.form;
    form.time = e.detail.value
    this.setData({ form: form })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  }
})