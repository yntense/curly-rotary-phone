// miniprogram/pages/index.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    items: ['BLE', 'WIFI', 'NFC',
      'BLE', 'WIFI', 'NFC',
      'BLE', 'WIFI', 'NFC'
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    /** 打开以下注释可以测试 scrollView */
    for (let index = 0; index < 100; index++) {
      this.data.items.push(index);
    }
    //补齐项目
    if (this.data.items.length % 3 == 2) {
      this.data.items.push('');
    }
    this.setData({
      items: this.data.items
    })
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
   * 监听页面点击
   * @param {} params 
   */
  onListenSelectView: function (params) {
    /**此处可以查看，点击页面传自定义的参数 */
    //console.log(params)
    let viewId = params.currentTarget.dataset.viewId
    switch (viewId) {
      case 'BLE':
        let items = []


        for (let i = 0; i < 10000000; i++) {
          items.push(i)
        }
        console.log(items.length)
        // Using Date objects
        let start = Date.now()

        // The event to time goes here:
        console.log(items.shift(), items.length)
        let end = Date.now()
        let elapsed = end - start // elapsed time in milliseconds

        console.log(elapsed)
        // 根据 viewId 页面切换
        wx.navigateTo({
          url: '../BLE/BLEDeviceShow/BLEDeviceShow'
        })
        break;

      default:
        break;
    }
  },
})