var bleUtils = require('./BLEUtils')
const BLE_UART_STATE = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
}

const UUID = {
  SERVICE_ID: 'FFF0',
  CHARACTER_RX_ID: 'FFF1',
  CHARATER_TX_ID: 'FFF2'
}

class BLEUart {
  deviceId = ''
  serviceId = ''
  charaterRxId = ''
  charaterTxId = ''
  BLEController
  BLEUartState = BLE_UART_STATE.DISCONNECTED
  constructor() {

  }

  setBLEController(BLEController) {
    this.BLEController = BLEController
    this.BLEController.register(this, 'BLEUart')
  }

  /**
   * 设置设备id
   * @param {} deviceId 
   */
  setDeviceId(deviceId) {
    this.deviceId = deviceId
  }

  /**
   * 获得设备id
   */
  getDeviceId() {
    return this.device_id
  }

  /**
   * 设置 uuid
   * @param {*} uuid 
   * @param {*} value 
   */
  setUuid(uuid, value) {
    switch (uuid) {
      case UUID.SERVICE_ID:
        this.serviceId = value
        return true;
      case UUID.CHARACTER_RX_ID:
        this.charaterRxId = value
        return true;
      case UUID.CHARATER_TX_ID:
        this.charaterTxId = value
        return true;
      default:
        return false;
    }
  }

  /**
   *  获得 uuid
   * @param {*} uuid 对应的 uuid 
   */
  getUuid(uuid) {
    switch (uuid) {
      case uuid.SERVICE_ID:
        return this.serviceId
      case uuid.CHARACTER_RX_ID:
        return this.charaterRxId
      case uuid.CHARATER_TX_ID:
        return this.charaterTxId
      default:
        break;
    }
  }

  /**
   * 重新连接
   */
  connect() {
    if (this.BLEController && (this.BLEController != '')) {
      this.BLEController.connect(this.deviceId)
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.BLEController && (this.BLEController != '')) {
      this.BLEController.disconnect(this.deviceId)
    }
  }


  onSendMessgeComplete(len) {
    console.log(len)
  }

  onListenReceived(data, len) {
    console.log(data)
  }

  onListenServicesFound(service, deviceId) {
    let serviceUuid = service.uuid.substring(4, 8)
    if (this.setUuid(serviceUuid, service.uuid)) {
      if (this.deviceId == '') {
        console.log(deviceId)
        this.setDeviceId(deviceId)
      }
      this.BLEController.getBLEDeviceCharacteristics(deviceId, service.uuid)
      // 首次连接，服务被找到，说明设备已经连接，更新连接状态
      this.BLEUartState = BLE_UART_STATE.CONNECTED
      console.log("serviceUuid", serviceUuid)
    }

  }

  onBLEDeviceCharacteristicsFound(characteristic) {
    characteristic.forEach(element => {
      let characteristicUuid = element.uuid.substring(4, 8)
      if (this.setUuid(characteristicUuid, element.uuid)) {
        //记录该服务下的 character
        console.log(this, characteristicUuid)
        if (characteristicUuid == UUID.CHARACTER_RX_ID) {
          let deviceId = this.deviceId
          let serviceId = this.serviceId
          if (element.properties.read) { // 改特征值可读
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: element.uuid,
            })
          }

          if (element.properties.notify || element.properties.indicate) {
            // 必须先启用 wx.notifyBLECharacteristicValueChange 才能监听到设备 onBLECharacteristicValueChange 事件
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: element.uuid,
              state: true,
            })
          }
        }
      }
    });
  }

  sendMessage(array) {
    // let myMap = new Map()
    // myMap.set("keyString", "和键'a string'关联的值");
    // console.log(myMap)
    let dataArray = bleUtils.encodeUtf8(array)
    let data = {
      data: dataArray,
      length: dataArray.length,
      deviceId: this.deviceId,
      serviceId: this.serviceId,
      charaterTxId: this.charaterTxId
    }
    this.BLEController.writeData(data)
  }

  /** 不监听设备 */
  // onListenFoundBLEDevices(device) {
  //   console.log("uart",device)
  // }

  /**
   * 监听ble设备连接状态
   */
  onListenBLEControllerState(res) {
    console.log(res)
    if (res.deviceId == this.deviceId) {
      if (res.connected) {
        this.BLEUartState = BLE_UART_STATE.CONNECTED
      } else {
        this.BLEUartState = BLE_UART_STATE.DISCONNECTED
        //此处可上报错误原因
        console.log(res.errorCode, res.errorMsg)
      }
      //防止继续往下遍历
      return true
    }
  }

 /**
   * 监听ble设备连接状态
   */
  onBLECharacteristicValueChange(res)
  {
      console.log(res)
  }

   /**
   * 监听 写数据成功回调
   */
  onWriteDataSuccess(res)
  {
    console.log(res)
  }


}

// function encodeUtf8(text) {
//   const code = encodeURIComponent(text);
//   const bytes = [];
//   for (var i = 0; i < code.length; i++) {
//       const c = code.charAt(i);
//       if (c === '%') {
//           const hex = code.charAt(i + 1) + code.charAt(i + 2);
//           const hexVal = parseInt(hex, 16);
//           bytes.push(hexVal);
//           i += 2;
//       } else bytes.push(c.charCodeAt(0));
//   }
//   return bytes;
// }

export {
  BLEUart
}
/*  编解码例子
function encodeUtf8(text) {
  const code = encodeURIComponent(text);
  const bytes = [];
  for (var i = 0; i < code.length; i++) {
      const c = code.charAt(i);
      if (c === '%') {
          const hex = code.charAt(i + 1) + code.charAt(i + 2);
          const hexVal = parseInt(hex, 16);
          bytes.push(hexVal);
          i += 2;
      } else bytes.push(c.charCodeAt(0));
  }
  return bytes;
}


arrayBuffer = encodeUtf8('中abfds热')
let s = decodeURIComponent(arrayBuffer.map(function (value, index) { return '%' + value.toString(16) }).join(''));
console.log(s)
*/