/**
 * 哔哩哔哩直播弹幕
 * 
 * @author  Yang,junlong at 2019-08-10 15:49:20 build.
 * @version $Id$
 */

var ws = new WebSocket('wss://broadcastlv.chat.bilibili.com:2245/sub');
ws.binaryType = 'arraybuffer';

var auth_params = {
  'uid': 1,
  'roomid': roomId,
  'protover': 1,
  'platform': 'web',
  'clientver': '1.4.0'
};

var wsBinaryHeaderList = [{
  name: "Header Length",
  key: "headerLen",
  bytes: 2,
  offset: 4,
  value: 16
}, {
  name: "Protocol Version",
  key: "ver",
  bytes: 2,
  offset: 6,
  value: 1
}, {
  name: "Operation",
  key: "op",
  bytes: 4,
  offset: 8,
  value: 1
}, {
  name: "Sequence Id",
  key: "seq",
  bytes: 4,
  offset: 12,
  value: 1
}];

ws.onopen = function() {
  // Web Socket 已连接上，使用 send() 方法发送数据
  var data = JSON.stringify(auth_params);
  var byte = convertToArrayBuffer(data, 7);
  ws.send(byte);
  console.log('ws.sending...', byte);
};

ws.onmessage = function(evt) {
  var result = convertToObject(evt.data);

  console.log('data received:', result);

  if (result.op == 8) {
    heartBeat();
  }
};

ws.onclose = function() {
  // 关闭 websocket
  console.log('ws closed.');
};

ws.onerror = function(err) {
  // 关闭 websocket
  console.log('ws error:', err);
};

function stringToByte(str) {
  var bytes = new Array();
  var len, c;
  len = str.length;
  for (var i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if (c >= 0x010000 && c <= 0x10FFFF) {
      bytes.push(((c >> 18) & 0x07) | 0xF0);
      bytes.push(((c >> 12) & 0x3F) | 0x80);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000800 && c <= 0x00FFFF) {
      bytes.push(((c >> 12) & 0x0F) | 0xE0);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000080 && c <= 0x0007FF) {
      bytes.push(((c >> 6) & 0x1F) | 0xC0);
      bytes.push((c & 0x3F) | 0x80);
    } else {
      bytes.push(c & 0xFF);
    }
  }
  return bytes;
}

function convertToObject(arraybuffer) {
  var dataview = new DataView(arraybuffer);
  var output = {
    body: []
  };
  output.packetLen = dataview.getInt32(0);

  wsBinaryHeaderList.forEach(function(item) {
    4 === item.bytes ? output[item.key] = dataview.getInt32(item.offset) : 2 === item.bytes && (output[item.key] = dataview.getInt16(item.offset))
  });

  output.packetLen < arraybuffer.byteLength && convertToObject(arraybuffer.slice(0, output.packetLen));

  var decoder = getDecoder();

  if (output.op && 5 === output.op) {
    for (var i = 0, o = output.packetLen, u = "", c = ""; i < arraybuffer.byteLength; i += o) {
      o = dataview.getInt32(i), u = dataview.getInt16(i + 4);
      try {
        if (output.ver === 2) {
          var l = arraybuffer.slice(i + u, i + o),
            f = new Uint8Array(l);
          c = convertToObject(f.buffer).body
        } else {
          c = JSON.parse(decoder.decode(arraybuffer.slice(i + u, i + o)));
        }
        c && output.body.push(c)
      } catch (t) {
        console.error("decode body error:", new Uint8Array(arraybuffer), output, t)
      }
    }
  } else {
    output.op && 3 === output.op && (output.body = {
      count: dataview.getInt32(16)
    });
  }
  return output;
}


function convertToArrayBuffer(data, t) {
  var encoder = getEncoder();
  var buffer = new ArrayBuffer(16);
  var dataview = new DataView(buffer, 0);
  var encode = encoder.encode(data);

  return dataview.setInt32(0, 16 + encode.byteLength),
    wsBinaryHeaderList[2].value = t,
    wsBinaryHeaderList.forEach(function(e) {
      4 === e.bytes ? dataview.setInt32(e.offset, e.value) : 2 === e.bytes && dataview.setInt16(e.offset, e.value)
    }),
    mergeArrayBuffer(buffer, encode)
}

function mergeArrayBuffer(e, t) {
  var n = new Uint8Array(e),
    i = new Uint8Array(t),
    r = new Uint8Array(n.byteLength + i.byteLength);
  return r.set(n, 0), r.set(i, n.byteLength), r.buffer
}

function getDecoder() {
  return window.TextDecoder ? new window.TextDecoder : {
    decode: function(e) {
      return decodeURIComponent(window.escape(String.fromCharCode.apply(String, new Uint8Array(e))))
    }
  }
}

function getEncoder() {
  return window.TextEncoder ? new window.TextEncoder : {
    encode: function(e) {
      for (var t = new ArrayBuffer(e.length), n = new Uint8Array(t), i = 0, r = e.length; i < r; i++) {
        n[i] = e.charCodeAt(i);
      }
      return t
    }
  }
}

var HEART_BEAT_TIMER = null;

function heartBeat() {
  clearTimeout(HEART_BEAT_TIMER);
  var t = convertToArrayBuffer({}, 2);

  console.log(HEART_BEAT_TIMER);
  ws.send(t);
  HEART_BEAT_TIMER = setTimeout(function() {
    heartBeat()
  }, 30000);
}