// miniprogram/pages/BLE/BLEDeviceShow/BLEDeviceShow.js
//BLE 用真机调试
import {
  BLEController
} from "../../../module/BLE/BLEContreller"
import {
  BLEUart,
  uuid
} from "../../../module/BLE/BLEUart"

var bleUtils = require('../../../module/BLE/BLEUtils')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    BLEDeviceList: [{
      deviceName: 'hello  6',
      deviceId: "067BB2A6-5D97-0656-0606-848BF2D1B5E7",
      rssi: -51
    },
    {
      deviceName: 'hello  6',
      deviceId: "067BB2A6-5D97-0656-0606-848BF2D1B5E7",
      rssi: -51
    }],
  },
  bleUart: null,
  ble: null,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.bleUart = new BLEUart()
    this.ble = new BLEController()
    this.bleUart.setBLEController(this.ble)
    this.ble.register(this, 'BLEDeviceShow')
    // // 监听扫描到新设备事件
    // wx.onBluetoothDeviceFound((res) => {
    //   res.devices.forEach((device) => {
    //     // 这里可以做一些过滤
    //     console.log('Device Found', device)
    //   })
    //   // 找到要搜索的设备后，及时停止扫描
    //   // wx.stopBluetoothDevicesDiscovery()


    // })
    // wx.onBLECharacteristicValueChange((result) => {
    //   // 使用完成后在合适的时机断开连接和关闭蓝牙适配器
    //   console.log(result)
    //   return
    //   wx.closeBLEConnection({
    //     deviceId,
    //   })
    //   wx.closeBluetoothAdapter({})
    // })


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
  /**** 测试 BLEController 的 回调函数 */
  onListenFoundBLEDevices: function (device) {
    let deviceName = "Unnamed"
    if (device.name) {
      deviceName = device.name
    }
    this.data.BLEDeviceList.push({
      deviceName: deviceName,
      deviceId: device.deviceId,
      rssi: device.RSSI
    })
    this.setData({
      BLEDeviceList: this.data.BLEDeviceList
    })
  },
  /**
   * 
   */
  onListenDeviceKicked: function (params) {
    console.log(params)
    let deviceId = params.currentTarget.dataset.deviceId
    if (deviceId == 2) {
      let array = bleUtils.encodeUtf8('嗨，你好！')
      array.forEach(element => {
        console.log(element.toString(16))
      });
      
      this.bleUart.sendMessage(array)
      return
    }
    this.ble.connect(deviceId)
    return
    wx.createBLEConnection({
      deviceId, // 搜索到设备的 deviceId
      success: () => {
        // 连接成功，获取服务
        wx.getBLEDeviceServices({
          deviceId, // 搜索到设备的 deviceId
          success: (res) => {
            console.log(res.services[0].uuid.substring(4, 8))
            for (let i = 0; i < res.services.length; i++) {
              if (res.services[i].isPrimary) {
                // 可根据具体业务需要，选择一个主服务进行通信
                console.log(res.services[i].uuid)
                this.data.serverId = res.services[i].uuid
                let serviceId = res.services[i].uuid
                wx.getBLEDeviceCharacteristics({
                  deviceId, // 搜索到设备的 deviceId
                  serviceId, // 上一步中找到的某个服务
                  success: (res) => {
                    for (let i = 0; i < res.characteristics.length; i++) {
                      let item = res.characteristics[i]
                      console.log(item)
                      // if()
                      // {
                      //   uart
                      // }

                      if (item.properties.write) { // 该特征值可写
                        // 本示例是向蓝牙设备发送一个 0x00 的 16 进制数据
                        // 实际使用时，应根据具体设备协议发送数据
                        let buffer = new ArrayBuffer(1)
                        let dataView = new DataView(buffer)
                        dataView.setUint8(0, 0)
                        wx.writeBLECharacteristicValue({
                          deviceId,
                          serviceId,
                          characteristicId: item.uuid,
                          value: buffer,
                        })
                      }
                      if (item.properties.read) { // 改特征值可读
                        wx.readBLECharacteristicValue({
                          deviceId,
                          serviceId,
                          characteristicId: item.uuid,
                        })
                      }
                      if (item.properties.notify || item.properties.indicate) {
                        // 必须先启用 wx.notifyBLECharacteristicValueChange 才能监听到设备 onBLECharacteristicValueChange 事件
                        wx.notifyBLECharacteristicValueChange({
                          deviceId,
                          serviceId,
                          characteristicId: item.uuid,
                          state: true,
                        })
                      }
                    }
                  }
                })
              }
            }
          },
          fail: (res) => {
            console.log(res)
          }
        })
      }
    })
  }
})