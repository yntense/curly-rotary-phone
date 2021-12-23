const BLEControllerState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
}
const BLEControllerScanState = {
  SCANING: "scaning",
  SCANED: "scaned",
}
class BLEController {
  BLEControllerState = BLEControllerState.DISCONNECTED
  BLEControllerScanState = BLEControllerScanState.SCANED
  scanTimer = null
  handleList = []
  constructor() {
    let that = this
    // 监听扫描到新设备事件
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach((device) => {
        // 这里可以做一些过滤
        console.log('Device Found', device)
        that.handleList.forEach(element => {
          if (element.handle.onListenFoundBLEDevices) {
            console.log(element.name)
            element.handle.onListenFoundBLEDevices(device)
          }
        });

      })
    })
    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((result) => {
      // 使用完成后在合适的时机断开连接和关闭蓝牙适配器
      that.handleList.forEach(element => {
        if (element.handle.onBLECharacteristicValueChange) {
          if (element.handle.deviceId == result.deviceId) {
            if (element.handle.onBLECharacteristicValueChange(result)) {
              console.log('停止上报数据')
              return
            }
          }
        }
      });
    })

    wx.onBLEConnectionStateChange(function (params) {
      that.handleList.forEach(element => {
        if (element.handle.onListenBLEControllerState) {
          if (element.handle.deviceId == params.deviceId) {
            if (element.handle.onListenBLEControllerState(params)) {
              console.log('停止上报状态')
              return
            }
          }
        }
      });
    })

    // 初始化蓝牙模块
    wx.openBluetoothAdapter({
      mode: 'central',
      success: (res) => {
        console.log('open')
        this.startBluetoothDevicesDiscovery(5000)
      },
      fail: (res) => {
        console.log(res)
        if (res.errCode !== 10001) return
        wx.onBluetoothAdapterStateChange((res) => {
          if (!res.available) return
          // 开始搜寻附近的蓝牙外围设备
          // wx.startBluetoothDevicesDiscovery({
          //   allowDuplicatesKey: false,
          // })
        })
      }
    })

  }

  /**
   *  注册监听对象
   * 
   * @param {*} handle 
   * @param { string } name 
   */
  register(handle, name) {
    for (let index = 0; index < this.handleList.length; index++) {
      const element = this.handleList[index];
      if (element.name == name) {
        return
      }
    }
    this.handleList.push({
      name: name,
      handle: handle
    })
    console.log('add', this.handleList)
  }

  /**
   * 注销监听对象
   * 
   * @param {*} name 
   */
  unRegister(name) {
    let that = this
    this.handleList.forEach(function (element, index) {
      if (element.name == name) {
        console.log(that.handleList.splice(index, 1))
      }
    });
    console.log(that.handleList)
  }

  /**
   * 开启蓝牙扫描
   * @param {int} time 
   */
  startBluetoothDevicesDiscovery(time) {
    let that = this
    if (this.BLEControllerScanState == BLEControllerScanState.SCANING) {
      this.stopBluetoothDevicesDiscovery()
    }

    // 开始搜索附近的蓝牙外围设备
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: false,
    })

    this.scanTimer = setTimeout(function () {
      that.stopBluetoothDevicesDiscovery()
      that.BLEControllerScanState = BLEControllerScanState.SCANED
    }, time)

    // wx.startBluetoothDevicesDiscovery({
    //   services: ['FEE7'],
    //   success (res) {
    //     console.log(res)
    //   }
    // })
  }

  /**
   * 停止蓝牙扫描
   */
  stopBluetoothDevicesDiscovery() {
    console.log('stop')
    wx.stopBluetoothDevicesDiscovery()
  }

  /**
   * 连接设备
   */
  connect(deviceId) {
    wx.createBLEConnection({
      deviceId, // 搜索到设备的 deviceId
      success: () => {
        // 连接成功，获取服务
        this.getBLEDeviceServices(deviceId)
      },
      fail: () => {
        console.log("fail")
      }
    })
  }

  /**
   * 
   */
  disconnect(deviceId) {
    wx.closeBLEConnection({
      deviceId,
      success(res) {
        console.log(res)
      }
    })
  }

  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId, // 搜索到设备的 deviceId
      success: (res) => {
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            // 可根据具体业务需要，选择一个主服务进行通信
            this.handleList.forEach(element => {
              if (element.handle.onListenServicesFound) {
                element.handle.onListenServicesFound(res.services[i], deviceId)
              }
            });
          }
        }
      }
    })
  }

  getBLEDeviceCharacteristics(deviceId, serviceId) {
    let that = this
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 wx.createBLEConnection 与对应设备建立链接
      deviceId,
      // 这里的 serviceId 需要在 wx.getBLEDeviceServices 接口中获取
      serviceId,
      success(res) {
        that.handleList.forEach(element => {
          if (element.handle.deviceId == deviceId) {
            if (element.handle.onBLEDeviceCharacteristicsFound) {
              element.handle.onBLEDeviceCharacteristicsFound(res.characteristics)
            }
            return
          }
        });
      }
    })
  }

  /**
   * 写数据到蓝牙
   * @param {*}  data = {
      data: dataArray,           该数据应该是字节数组
      length: dataArray.length,  字节数组的长度
      deviceId: this.deviceId,
      serviceId: this.serviceId,
      charaterTxId: this.charaterTxId
    }
   */
  writeData(data, writeCB, sourceobject) {
    let that = this
    // 向蓝牙设备发送一个0x00的16进制数据
    let buffer = new ArrayBuffer(data.length)
    let dataView = new DataView(buffer)
    let array = data.data
    array.forEach(function (element, index) {
      dataView.setUint8(index, element)
    });

    let deviceId = data.deviceId
    let serviceId = data.serviceId
    let characteristicId = data.charaterTxId
    console.log(characteristicId, buffer)

    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId,
      // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
      serviceId,
      // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
      characteristicId,
      // 这里的value是ArrayBuffer类型
      value: buffer,
      success(res) {
        if (writeCB) {
          writeCB(res, data.length, sourceobject)
        }
      },
      fail(res) {
        if (writeCB) {
          writeCB(res, data.length, sourceobject)
        }
      }
    })
  }
}



export {
  BLEController
}