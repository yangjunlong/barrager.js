# 网页弹幕
给指定网页容器添加弹幕


## Usage

```
// 实例化一个弹幕对象
var barrager = new Barrager({
  el: '#el'
});

// 发送一条弹幕
barrager.shoot('这是一条弹幕', {
  
});
```


## 哔哩哔哩直播弹幕WebSocket协议编码解析
> 主要根据哔哩哔哩官网player-loader.js内的具体实现进行解析说明

WebSocket Request URL: `wss://hw-bj-live-comet-02.chat.bilibili.com/sub`
直播房间初始化URL: `https://api.live.bilibili.com/room/v1/Room/room_init?id=roomId`

### 封包格式
| key | bytes | offset | value | name |
|--|--|--|--|--|
|headerLen|2|4|16|Header Length|
|ver|2|6|1|Protocol Version|
|op|4|8|1|Operation|
|seq|4|12|1|Sequence Id|

代码示例：
```
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
```

### 操作码
|值|说明|
|-|-|
|2|客户端发送的心跳包|
|3|心跳包回复|
|5|消息|
|7|认证加入房间|
|8|服务端发送的心跳包，客户端接收到此信息时需要返回一个心跳包|

### 加入房间认证参数
```
var auth_params = {
  'uid': 1, // 0为未登录用户
  'roomid': 5050,
  'protover': 1,
  'platform': 'web',
  'clientver': '1.4.0'
};
```

### 完整代码实现
```
var WSS_URL = 'wss://hw-bj-live-comet-02.chat.bilibili.com/sub';

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

var HEART_BEAT_TIMER = null;

var ws = new WebSocket(WSS_URL);
ws.binaryType = 'arraybuffer';

ws.onopen = function() {
  var dataString = JSON.stringify(auth_params);
  // 封包认证并加入房间
  var arrayBuffer = convertToArrayBuffer(dataString, 7);
  ws.send(arrayBuffer);
};

ws.onmessage = function(res) {
  // 解包
  var result = convertToObject(res.data);
  result.body.forEach && result.body.forEach(function(item) {
    if(item.cmd == 'DANMU_MSG') {
      // todo 发送弹幕
    }
  });
  
  // 如果消息类型为服务端心跳包
  if (result.op == 8) {
    clientHeartBeat();
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

// 封包
function convertToArrayBuffer(data, op) {
  var encoder = getEncoder();
  var buffer = new ArrayBuffer(16);
  var dataview = new DataView(buffer, 0);
  var encode = encoder.encode(data);

  dataview.setInt32(0, 16 + encode.byteLength);
  wsBinaryHeaderList[2].value = op;
  wsBinaryHeaderList.forEach(function(e) {
    4 === e.bytes ? dataview.setInt32(e.offset, e.value) : 2 === e.bytes && dataview.setInt16(e.offset, e.value)
   }),
  return mergeArrayBuffer(buffer, encode)
}

// 解包
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

function mergeArrayBuffer(e, t) {
  var n = new Uint8Array(e);
  var i = new Uint8Array(t);
  var r = new Uint8Array(n.byteLength + i.byteLength);
  r.set(n, 0);
  r.set(i, n.byteLength);
  
  return r.buffer
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
      return n;
    }
  }
}

function clientHeartBeat() {
  clearTimeout(HEART_BEAT_TIMER);
  // 发送客户端心跳包
  var t = convertToArrayBuffer({}, 2);
  ws.send(t);
  HEART_BEAT_TIMER = setTimeout(function() {
    heartBeat()
  }, 30000);
}
```

## 参考
[bilibili/player-loader.js](https://s1.hdslb.com/bfs/static/player/live/loader/player-loader-1.8.1.min.js)
