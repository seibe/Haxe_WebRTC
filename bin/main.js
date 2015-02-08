(function () { "use strict";
var Main = function() {
	window.onload = $bind(this,this.init);
};
Main.__name__ = true;
Main.main = function() {
	new Main();
};
Main.prototype = {
	init: function(evt) {
		this._wsUrl = "ws://localhost:8080";
		this._pcOption = { iceServers : [{ url : "stun:stun.l.google.com:19302"}]};
		this._dcLabel = "dataChannelLabel";
		this._dcOption = { ordered : false, maxRetransmits : 0};
		this._pc = new RTCPeerConnection(this._pcOption);
		this._pc.onicecandidate = $bind(this,this.onIceCandidate);
		this._pc.ondatachannel = $bind(this,this.onDataChannel);
		this._ws = new WebSocket(this._wsUrl);
		this._ws.onmessage = $bind(this,this.onMessageWs);
	}
	,initDataChannel: function(dc) {
		dc.binaryType = "arraybuffer";
		dc.onopen = function(evt) {
			haxe.Log.trace("open",{ fileName : "Main.hx", lineNumber : 61, className : "Main", methodName : "initDataChannel"});
		};
		dc.onclose = function(evt1) {
			haxe.Log.trace("close",{ fileName : "Main.hx", lineNumber : 64, className : "Main", methodName : "initDataChannel"});
		};
		dc.onmessage = function(evt2) {
			haxe.Log.trace("message",{ fileName : "Main.hx", lineNumber : 67, className : "Main", methodName : "initDataChannel", customParams : [evt2.data]});
		};
	}
	,onMessageWs: function(evt) {
		var _g1 = this;
		var msg = JSON.parse(evt.data);
		var _g = msg.type;
		switch(_g) {
		case "match":
			var isSender = msg.data;
			if(isSender) {
				this._dc = this._pc.createDataChannel(this._dcLabel,this._dcOption);
				this.initDataChannel(this._dc);
				this._pc.createOffer($bind(this,this.onCreateSdp),$bind(this,this.onFailure));
			}
			break;
		case "sdp":
			var sd = new RTCSessionDescription(msg.data);
			this._pc.setRemoteDescription(sd,function() {
				if(sd.type == "offer") _g1._pc.createAnswer($bind(_g1,_g1.onCreateSdp),$bind(_g1,_g1.onFailure));
				return true;
			},$bind(this,this.onFailure));
			break;
		case "candidate":
			var candidate = new RTCIceCandidate(msg.data);
			this._pc.addIceCandidate(candidate);
			break;
		default:
			this.onFailure("予期しないメッセージの受信");
		}
	}
	,onCreateSdp: function(sd) {
		var _g = this;
		this._pc.setLocalDescription(sd,function() {
			return _g._ws.send(JSON.stringify({ type : "sdp", data : sd}));
		},$bind(this,this.onFailure));
		return true;
	}
	,onFailure: function(error) {
		haxe.Log.trace(error,{ fileName : "Main.hx", lineNumber : 119, className : "Main", methodName : "onFailure"});
		return false;
	}
	,onIceCandidate: function(evt) {
		if(evt && evt.candidate) this._ws.send(JSON.stringify({ type : "candidate", data : evt.candidate}));
	}
	,onDataChannel: function(evt) {
		if(evt && evt.channel) {
			this._dc = evt.channel;
			this.initDataChannel(this._dc);
		}
	}
};
var haxe = {};
haxe.Log = function() { };
haxe.Log.__name__ = true;
haxe.Log.trace = function(v,infos) {
	js.Boot.__trace(v,infos);
};
var js = {};
js.Boot = function() { };
js.Boot.__name__ = true;
js.Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
};
js.Boot.__trace = function(v,i) {
	var msg;
	if(i != null) msg = i.fileName + ":" + i.lineNumber + ": "; else msg = "";
	msg += js.Boot.__string_rec(v,"");
	if(i != null && i.customParams != null) {
		var _g = 0;
		var _g1 = i.customParams;
		while(_g < _g1.length) {
			var v1 = _g1[_g];
			++_g;
			msg += "," + js.Boot.__string_rec(v1,"");
		}
	}
	var d;
	if(typeof(document) != "undefined" && (d = document.getElementById("haxe:trace")) != null) d.innerHTML += js.Boot.__unhtml(msg) + "<br/>"; else if(typeof console != "undefined" && console.log != null) console.log(msg);
};
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) str2 += ", \n";
		str2 += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
String.__name__ = true;
Array.__name__ = true;
Main.main();
})();
