const winston = require('winston');
const dayjs = require('dayjs');
const { read, exists, writeTo } = require('../../handles/file');
const fs = require('fs');
const mkdir = (dir) => { try { fs.mkdirSync(dir) } catch { } };
const moveTo = fs.copyFileSync;
let today = dayjs();
require('events').EventEmitter.defaultMaxListeners = 20;

const logger = winston.createLogger({
	format: winston.format.printf((info) => {
		return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] spark.mc | ${info.message}`;
	}),
	transports: [
		new winston.transports.Console()
	]
});

function formatMsg(msg) {
	return msg.map(t => {
		switch (t.type) {
			case 'at':
				return '@' + t.qq;
			case 'text':
				return t.text;
			case 'img':
				return '[图片]';
			case 'face':
				return '[表情]';
		}
	}).join('');
}

/**
 * 
 * @param {} _adapter 
 */
function onStart(_adapter) {
	if (exists('./plugins/sparkbridge/spark.mc/config.json') == false) {
		moveTo(__dirname + '/config.json', './plugins/sparkbridge/spark.mc/config.json');
		mkdir('./plugins/sparkbridge/spark.mc/data/')
	}
	let _xuid = new xuiddb('./plugins/sparkbridge/' + info().name + '/data/xuid.json');
	spark.XUIDDB = _xuid;
	let { cmd, group, admin, auto_wl, debug, msg, prohibited } = spark.JSON5.parse(read('./plugins/sparkbridge/' + info().name + "/config.json"));
	logger.info('开始构建所需的表...')
	spark.GROUP = group;
	spark.ADMINS = admin;
	spark.DEBUG = debug;

	const outputLimit = msg.outputLimit;
	const inputLimit = msg.inputLimit;
	const wordData = prohibited;

	function SendMsg(msg) {
		_adapter.sendGroupMsg(group, msg);
	}
	ll.export(SendMsg, "SparkAPI", "sendGroupMessage");

	_adapter.on('bot.message.private', (e) => {
		if (debug) logger.info(`${e.sender.nickname} >> ${e.raw_message}`);
	});
	if (msg.join) {
		mc.listen('onJoin', (pl) => {
			if (pl.isSimulatedPlayer()) {
			} else {
				_adapter.sendGroupMsg(group, `${pl.realName} 加入了服务器`);
			}
		});
	}
	if (msg.left) {
		mc.listen('onLeft', (pl) => {
			if (pl.isSimulatedPlayer()) {
			} else {
				_adapter.sendGroupMsg(group, `${pl.realName} 离开了服务器`);
			}
		});
	}
	if (msg.chat) {
		mc.listen('onChat', (pl, msg) => {
			let msgOut = msg;
			for (let index = 0; index < wordData.length; index++) {
				const element = wordData[index];
				if (msgOut.indexOf(element) !== -1) {
					msgOut = '转发失败因为内容包含违禁词';
					break;
				}
			}
			if (msg.length >= outputLimit) {
				msgOut = '转发失败因为内容字数过多';
			}
			_adapter.sendGroupMsg(group, `${pl.realName} >> ${msgOut}`);
		})
	}

	_adapter.on('bot.notice.group.decrease', (e) => {
		if (e.group !== group) return;
		if (_xuid.has(e.user.toString())) {
			_adapter.sendGroupMsg(group, `${e.user} 退出了群聊，撤销其白名单：${_xuid.get(e.user.toString())}`);
			let id = _xuid.get(e.user.toString());
			mc.runcmd(`whitelist remove "${id}"`);
			_xuid.delete(e.user.toString());
		}
	})
	_adapter.on('bot.message.group', (e) => {
		if (debug) logger.info(`[${e.group}]${e.sender.nickname} >> ${e.raw_message}`);
		if (e.group !== group) return;
		let sp = e.raw_message.split(' ');
		const { raw_message, sender, message } = e;
		//console.log(sp);
		switch (sp[0]) {
			case cmd.bind:
				let t = raw_message.substr(cmd.bind.length + 1);
				if (_xuid.hasXbox(t)) {
					e.reply('这个xboxid已经被绑定过了！');
					return;
				}
				if (_xuid.has(sender.user_id.toString())) {
					_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '你已经绑定过了']);
				} else {
					_xuid.set(sender.user_id.toString(), t);
					_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '白名单绑定成功']);
					if (auto_wl) {
						mc.runcmd(`allowlist add "${t}"`);
						_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '已将你的白名单添加到服务器']);
					}
				}
				break;
			case cmd.unbind:
				if (_xuid.has(sender.user_id.toString())) {
					_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '白名单解绑成功']);
					mc.runcmd(`allowlist remove "${_xuid.get(sender.user_id.toString())}"`);
					_xuid.delete(sender.user_id.toString());
					_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '已将白名单从服务器移除']);
				} else {
					_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '你还没绑定白名单']);
				}
				break;
			case cmd.cmd:
				if (admin.includes(sender.user_id)) {
					let t2 = raw_message.substr(cmd.cmd.length + 1);
					_adapter.sendGroupMsg(group, '正在执行：' + t2);
					try {
						let re = mc.runcmdEx(t2);
						if (re.success) {
							_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), re.output]);
						} else {
							_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '执行失败']);
						}
					} catch {
						_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '执行失败']);
					}
				} else {
					_adapter.sendGroupMsg(group, [_adapter.at(sender.user_id), '不是管理员']);
				}
				break;
			case cmd.add_wl:
				if (admin.includes(sender.user_id)) {
					message.forEach(ie => {
						if (ie.type == 'at') {
							if (_xuid.has(ie.qq.toString())) {
								_adapter.sendGroupMsg(group, '添加' + ie.qq + '的白名单' + _xuid.get(ie.qq.toString()));
								mc.runcmd(`allowlist add "${_xuid.get(ie.qq.toString())}"`);
							} else {
								_adapter.sendGroupMsg(group, ie.qq + '还未绑定白名单');
							}
						}
					})
				}
				break;
			case cmd.del_wl:
				if (admin.includes(sender.user_id)) {
					message.forEach(ie => {
						if (ie.type == 'at') {
							if (_xuid.has(ie.qq.toString())) {
								_adapter.sendGroupMsg(group, '移除' + ie.qq + '的白名单' + _xuid.get(ie.qq.toString()));
								mc.runcmd(`allowlist remove "${_xuid.get(ie.qq.toString())}"`);
								_xuid.delete(ie.qq.toString());
							} else {
								_adapter.sendGroupMsg(group, ie.qq + '还未绑定白名单');
							}
						}
					})
				}
				break;
			case cmd.query:
				let re = mc.runcmdEx('list');
				//_adapter.sendGroupMsg(group,re.output);
				e.reply(re.output);
				break;
			default:
				if (msg.chat == false) return;
				let nick = e.sender.nickname;
				if (_xuid.has(e.sender.user_id.toString())) {
					nick = _xuid.get(e.sender.user_id.toString());
				}
				let msgOut = formatMsg(message);
				for (let index = 0; index < wordData.length; index++) {
					const element = wordData[index];
					if (msgOut.indexOf(element) !== -1) {
						msgOut = '转发失败因为内容包含违禁词';
						_adapter.sendGroupMsg(group, `${msgOut}`);
						break;
					}
				}
				if (formatMsg(message).length >= inputLimit) {
					msgOut = '转发失败因为内容字数过多';
					_adapter.sendGroupMsg(group, `${msgOut}`);
				}
				mc.broadcast(`§l§b群聊 §r${nick} §r >> §e${msgOut}`);
				break;

		}
	});
}


class xuiddb {
	db;
	pt;
	constructor(pt) {
		this.pt = pt;
		if (exists(pt) == false) {
			writeTo(pt, "{}");
		}
		this.db = new Map(Object.entries(JSON.parse(read(pt))));
	}
	get(qq) {
		return this.db.get(qq);
	}
	set(qq, name) {
		this.db.set(qq, name);;
		this.#save();
	}
	has(qq) {
		return this.db.has(qq);
	}
	delete(qq) {
		this.db.delete(qq);
	}
	#save() {
		writeTo(this.pt, JSON.stringify(Object.fromEntries(this.db.entries())));
	}
	hasXbox(xboxid) {
		for (let item of this.db.values()) {
			if (item == xboxid) {
				return true;
			}
		}
		return false;
	}
}

function info() {
	return {
		name: 'spark.mc',
		author: 'sbaoor',
		desc: '适用于sparkbridge实现mc服务器互通的基类',
		version: [0, 0, 1]
	}
}


module.exports = { onStart, info, formatMsg }
