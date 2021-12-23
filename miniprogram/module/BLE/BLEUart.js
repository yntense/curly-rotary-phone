import {
  Queue
} from './Queue'

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

const WRITE_STATE = {
  WRITING: 0,
  WRITE_DONE: 1,
}

class BLEUart {
  deviceId = ''
  serviceId = ''
  charaterRxId = ''
  charaterTxId = ''
  BLEController
  BLEUartState = BLE_UART_STATE.DISCONNECTED
  // 数据发送状态
  writeState = WRITE_STATE.WRITE_DONE
  // 用于计数发送失败次数
  sendFailCount = 0
  // 消息数组
  messageQueue = new Queue()
  // BLE 发送一次数据，微信建议不要一次发送大于 20 Bytes
  sendSize = 20
  //记录当前已经发送完成的数量
  sendCount = 0

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

  /**
   * array 需要 16 进制数组，可用 bleUtils.encodeUtf8() 进行转化
   * @param {*} array 
   */
  sendMessage(array) {
    // 如果数组为空，返回
    if ((array == null) || (array.length == 0)) {
      return false
    }
    if (this.writeState == WRITE_STATE.WRITE_DONE) {
      this.messageQueue.enqueue(array)
      this.sendMessageNow()
    } else {
      console.log('正在发送中，入队', this.messageQueue.size())
      this.messageQueue.enqueue(array)
    }
  }

  /**
   * 发送数据
   * @param {} array 
   */
  sendMessageNow() {
    // let myMap = new Map()
    // myMap.set("keyString", "和键'a string'关联的值");
    // console.log(myMap)
    // bleUtils.encodeUtf8()
    // 还未发送数据
    this.writeState = WRITE_STATE.WRITING
    let array = []
    let dataArray = []
    if (this.sendCount == 0) {
      if ((array = this.messageQueue.first()) != null) {
        if(array.length > this.sendSize)
        {
          dataArray = array.slice(0, this.sendSize)
        }else
        {
          dataArray = array.slice(0, array.length)
        }
        
      } else {
          //发送完毕
          return
      }

    } else {
      array = this.messageQueue.first()
      let length = array.length - this.sendCount
      if( length > this.sendSize)
      {
        dataArray = array.slice(this.sendCount, this.sendCount + this.sendSize)
      }else
      {
        dataArray = array.slice(this.sendCount, array.length)
      }
    }
   
    console.log('发送长度', dataArray.length)
    let data = {
      data: dataArray,
      length: dataArray.length,
      deviceId: this.deviceId,
      serviceId: this.serviceId,
      charaterTxId: this.charaterTxId
    }
    this.BLEController.writeData(data, this.onWriteDataCallBack, this)
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
  onBLECharacteristicValueChange(res) {
    console.log(res)
  }

  /**
   * 监听 写数据成功回调
   */
  onWriteDataCallBack(res, length, sourceObject) {
    
    console.log(res)
    if (!res.errCode) {
      sourceObject.sendCount += length
      let array = sourceObject.messageQueue.first()
      if(sourceObject.sendCount == array.length)
      {
        console.log(sourceObject.sendCount, array.length)
        sourceObject.messageQueue.dequeue()

        if(sourceObject.messageQueue.empty())
        {
          console.log('队列为空，发送完成')
          sourceObject.sendCount = 0
        }else{
          console.log('队列不为空，继续发送')
          sourceObject.sendCount = 0
          sourceObject.writeState = WRITE_STATE.WRITE_DONE
          sourceObject.sendMessageNow() 
          return
        }
      }else{
        console.log('消息未发完，继续发送')
        sourceObject.writeState = WRITE_STATE.WRITE_DONE
        sourceObject.sendMessageNow() 
        return
      }
    } else {
          console.log(res, '发送错误')
    }
    sourceObject.writeState = WRITE_STATE.WRITE_DONE
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