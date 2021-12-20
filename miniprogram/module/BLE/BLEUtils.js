/**
 * 将数据进行 utf-8 编码
 * @param {*} data 
 */
function encodeUtf8(data) {
  const code = encodeURIComponent(data);
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

/**
 * 将数据进行 utf-8 解码
 * @param {*} data 
 */
function decodeUtf8(data) {
  arrayBuffer = encodeUtf8(data)
  let content = decodeURIComponent(arrayBuffer.map(function (value, index) {
    return '%' + value.toString(16)
  }).join(''));
  return content
}

module.exports = {
  encodeUtf8,
  decodeUtf8
}