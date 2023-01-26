const winston = require('winston');
const dayjs = require('dayjs');
const { read, exists, writeTo } = require('../../handles/file');
let today = dayjs();

const logger = winston.createLogger({
	format: winston.format.printf((info) => {
		return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] spark.mc | ${info.message}`
	}),
	transports: [
		new winston.transports.Console()
	]
});

function formatMsg(msg){
	return msg.map(t=>{
		switch(t.type){
			case 'at':
				return '@'+t.qq;
			case 'text':
				return t.text;
			case 'img':
				return '[图片]';
			case 'face':
				return '[表情]';
		}
	}).join('');
}

function onStart(_adapter){
	//发送群聊信息
	// _adapter.sendGroupMsg(114514,'ok');

	// 发送私聊信息
	// _adapter.sendFriendMsg(114514,'ok');

	// 生成at方法
	// _adapter.at(114);

	// 生成图片方法,填网络url或本地path都可以
	// _adapter.img(path/url);

	// 监听群聊信息
	// _adapter.on('bot.message.group',(e)=>{
	//	consle.log(e);	
	// });

	// 监听私聊信息
	// _adapter.on('bot.message.private',(e)=>{
	//	consle.log(e);	
	// });

	// 组合消息发送
	// _adapter.sendGroupMsg(114514,['纯文本',_adapter.at(1919810),_adapter.img('https://p1.music.126.net/i_8o_LJRX7knZmwG1spb_w==/109951168160269431.jpg')])
	const _xuid = new xuiddb('./plugins/sparkbridge/'+info().name+'/data/xuid.json');
	let {cmd,group,admin,auto_wl,debug} = JSON.parse(read('./plugins/sparkbridge/'+info().name+"/config.json"));
	_adapter.on('bot.message.private',(e)=>{
		if(debug) logger.info(`${e.sender.nickname} >> ${e.raw_message}`);
	});
	mc.listen('onChat',(pl,msg)=>{
		_adapter.sendGroupMsg(group,`${pl.realName} >> ${msg}`);
	});
	mc.listen('onJoin',(pl)=>{
		_adapter.sendGroupMsg(group,`${pl.realName} 加入了服务器`);
	});
	mc.listen('onLeft',(pl)=>{
		_adapter.sendGroupMsg(group,`${pl.realName} 离开了服务器`);
	});
	_adapter.on('bot.message.group',(e)=>{
		if(debug) logger.info(`[${e.group}]${e.sender.nickname} >> ${e.raw_message}`);
		if(e.group !== group)return;
		let sp = e.raw_message.split(' ');
		const {raw_message,sender,message} = e;
		switch(sp[0]){
			case cmd.bind:
				let t = raw_message.substr(cmd.bind.length + 1);
				if(_xuid.has(sender.user_id)){
					_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'你已经绑定过了']);
				}else{
					_xuid.set(sender.user_id.toString(),t);
					_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'白名单绑定成功']);
					if(auto_wl){
						mc.runcmd(`allowlist add "${t}"`);
						_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'已将你的白名单添加到服务器']);
					}
				}
				break;
			case cmd.unbind:
				if(_xuid.has(sender.user_id.toString())){
					_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'白名单解绑成功']);
					mc.runcmd(`allowlist remove "${_xuid.get(sender.user_id.toString())}"`);
					_xuid.delete(sender.user_id.toString());
					_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'已将白名单从服务器移除']);
				}else{
					_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'你还没绑定白名单']);
				}
				break;
			case cmd.cmd:
				if(admin.includes(sender.user_id)){
					let t2 = raw_message.substr(cmd.cmd.length + 1);
					_adapter.sendGroupMsg(group,'正在执行：'+t2);
					try{
						let re = mc.runcmdEx(t2);
						if(re.success){
							_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),re.output]);
						}else{
							_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'执行失败']);
						}
					}catch{
						_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'执行失败']);
					}
				}else{
					_adapter.sendGroupMsg(group,[_adapter.at(sender.user_id),'不是管理员']);
				}
				break;
			case cmd.add_wl:
				if(admin.includes(sender.user_id)){
					message.forEach(ie=>{
						if(ie.type == 'at'){
							if(_xuid.has(ie.qq.toString())){
								_adapter.sendGroupMsg(group,'添加'+ie.qq+'的白名单'+_xuid.get(ie.qq.toString()));
								mc.runcmd(`allowlist add "${_xuid.get(ie.qq.toString())}"`);
							}else{
								_adapter.sendGroupMsg(group,ie.qq+'还未绑定白名单');
							}
						}
					})
				}
				break;
			case cmd.del_wl:
				if(admin.includes(sender.user_id)){
					message.forEach(ie=>{
						if(ie.type == 'at'){
							if(_xuid.has(ie.qq.toString())){
								_adapter.sendGroupMsg(group,'移除'+ie.qq+'的白名单'+_xuid.get(ie.qq.toString()));
								mc.runcmd(`allowlist remove "${_xuid.get(ie.qq.toString())}"`);
								_xuid.delete(ie.qq.toString());
							}else{
								_adapter.sendGroupMsg(group,ie.qq+'还未绑定白名单');
							}
						}
					})
				}
				break;
			case '查服':
				let re = mc.runcmdEx('list');
				_adapter.sendGroupMsg(group,re.output);
				break;
			default:
				mc.broadcast(`§l§b群聊 §r${e.sender.nickname}§r >> §e${formatMsg(message)}`);
				break;
		}
	});
}


class xuiddb{
	db;
	pt;
	constructor(pt){
		this.pt = pt;
		if(exists(pt)==false){
			writeTo(pt,"{}");
		}
		this.db = new Map(Object.entries(JSON.parse(read(pt))));
	}
	get(qq){
		return this.db.get(qq);	
	}
	set(qq,name){
		this.db.set(qq,name);;
		this.#save();
	}
	has(qq){
		return this.db.has(qq);
	}
	delete(qq){
		this.db.delete(qq);
	}
	#save(){
		writeTo(this.pt,JSON.stringify(Object.fromEntries(this.db.entries())));
	}
}

function info(){
	return {
		name: 'spark.mc',
		author: 'sbaoor',
		desc:'适用于sparkbridge实现mc服务器互通的基类',
		version: [0,0,1]
	}
}
module.exports = {onStart,info,formatMsg}