package ;

import haxe.Json;
import js.Browser;
import js.html.rtc.DataChannel;
import js.html.rtc.IceCandidate;
import js.html.rtc.PeerConnection;
import js.html.rtc.SessionDescription;
import js.html.WebSocket;
import js.Lib;

class Main 
{
	private var _ws:WebSocket;
	private var _wsUrl:String;
	
	private var _pc:PeerConnection;
	private var _pcOption:Dynamic;
	
	private var _dc:DataChannel;
	private var _dcLabel:String;
	private var _dcOption:Dynamic;
	
	static function main() 
	{
		new Main();
	}
	
	public function new()
	{
		Browser.window.onload = init;
	}
	
	private function init(evt:Dynamic):Void
	{
		// 0. オプション設定
		_wsUrl = "ws://localhost:8080";
		_pcOption = {
			"iceServers": [ { "url": "stun:stun.l.google.com:19302" } ]
		};
		_dcLabel = "dataChannelLabel";
		_dcOption = {
			ordered: false,
			maxRetransmits: 0
		};
		
		// 1. RTCPeerConnectionを作成する
		_pc = new PeerConnection(_pcOption);
		_pc.onicecandidate = onIceCandidate;
		_pc.ondatachannel = onDataChannel;
		
		// 2. シグナリングサーバーに接続する
		_ws = new WebSocket(_wsUrl);
		_ws.onmessage = onMessageWs;
	}
	
	private function initDataChannel(dc:DataChannel):Void
	{
		dc.binaryType = "arraybuffer";
		dc.onopen = function(evt:Dynamic):Void {
			trace("open");
		};
		dc.onclose = function(evt:Dynamic):Void {
			trace("close");
		};
		dc.onmessage = function(evt:Dynamic):Void {
			trace("message", evt.data);
		};
	}
	
	private function onMessageWs(evt:Dynamic):Void
	{
		var msg:Dynamic = Json.parse(evt.data);
		
		switch (msg.type) {
			case "match":
				// 役（先攻or後攻）を受け取る
				var isSender:Bool = msg.data;
				if (isSender) {
					// 先攻ならば、DataChannelを初期化する
					_dc = _pc.createDataChannel(_dcLabel, _dcOption);
					initDataChannel(_dc);
					
					// 先攻ならば、Offerを作成する
					_pc.createOffer(onCreateSdp, onFailure);
				}
				
			case "sdp":
				// セッション情報を受け取る
				var sd:SessionDescription = new SessionDescription(msg.data);
				_pc.setRemoteDescription(sd, function():Bool {
					// 後攻ならば、Answerを作成する
					if (sd.type == "offer") _pc.createAnswer(onCreateSdp, onFailure);
					return true;
				}, onFailure);
				
			case "candidate":
				// 経路情報を受け取る
				var candidate:IceCandidate = new IceCandidate(msg.data);
				_pc.addIceCandidate(candidate);
				
			default:
				onFailure("予期しないメッセージの受信");
		}
	}
	
	private function onCreateSdp(sd:SessionDescription):Bool
	{
		// 生成されたセッション情報を登録する
		_pc.setLocalDescription(sd, function():Bool {
			// 生成されたセッション情報を シグナリングサーバーを通して転送する
			return _ws.send( Json.stringify( { type: "sdp", data: sd } ) );
		}, onFailure);
		return true;
	}
	
	private function onFailure(error:String):Bool
	{
		trace(error);
		return false;
	}
	
	private function onIceCandidate(evt:Dynamic):Void
	{
		if (evt && evt.candidate) {
			// 生成された経路情報を シグナリングサーバーを通して転送する
			_ws.send( Json.stringify( { type: "candidate", data: evt.candidate } ) );
		}
	}
	
	private function onDataChannel(evt:Dynamic):Void
	{
		if (evt && evt.channel) {
			// DataChannelを初期化する
			_dc = evt.channel;
			initDataChannel(_dc);
		}
	}
	
	private static function __init__() : Void untyped {
		window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
		window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
		window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
	}
}