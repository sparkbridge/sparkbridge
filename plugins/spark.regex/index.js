const { read } = require("../../handles/file");
const { formatMsg } = require("../spark.mc");
const winston = require('winston');
const dayjs = require('dayjs');
let today = dayjs();

const logger = winston.createLogger({
	format: winston.format.printf((info) => {
		return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] spark.regex | ${info.message}`
	}),
	transports: [
		new winston.transports.Console()
	]
});
/**
 * 
 * @param {String} str 
 * @param {RegExpMatchArray} reg 
 * @returns 
 */
function buildString(str, reg) {
    var i = 0;
    reg.forEach(s => {
        str = str.replace(`\$${i}`, s);
        i++
    });
    return str;
}

const Cmds = new Map();

function regCmd(head,cb){
    Cmds.set(head,cb);
}

spark.regCmd = regCmd;

function runCmd(_first,_args,reg,e,adapter){
    if(Cmds.has(_first)){
        try{
            Cmds.get(_first)(_args,reg,e,adapter);
        }catch(err){console.log(err)}
    }
}

regCmd('reply',(_arg,reg,e,adapter)=>{
    let txt1 = buildString(_arg,reg);
    e.reply(txt1);
});
regCmd('f',(_arg,reg,e,adapter)=>{
    let t_and_a = _arg.split(':');
    if(t_and_a.length == 0){
        logger.warn(`执行正则表达式遇到错误：参数不足，请指定私聊联系人`);
    }
    let target = t_and_a[0];
    let arg = t_and_a[1];
    adapter.sendFriendMsg(Number(target),buildString(arg,reg))
});
regCmd('t',(arg,reg,e,adapter)=>{
    let t_and_m = arg.split(':');
    let tp = t_and_m[0];
    let ms = t_and_m[1];
    if(tp == 'all'){
        mc.broadcast(buildString(ms,reg));
    }else{
        let top = mc.getPlayer(tp);
        if(top){
            top.tell(buildString(ms,reg));
        }
    }
})
regCmd('t',(arg,reg,e,adapter)=>{
    let command = arg;
    mc.runcmd(buildString(command,reg));
})
/**
 * 
 * @param {String} cmd 
 */
function commandParse(cmd,reg,e,_adapter){
    let items = cmd.split("|");
    if(items.length == 1){
        logger.warn(`执行正则表达式：${cmd} 遇到错误：参数不足，请写入参数`);
    }
    let _first = items[0];
    let _arg = items[1];
    runCmd(_first,_arg,reg,e,_adapter);
}

function onStart(_adapter){
    let {group,admin} = JSON.parse(read('./plugins/sparkbridge/spark.mc/config.json'));
    let config = JSON.parse(read('./plugins/sparkbridge/'+info().name+'/config.json'));
    _adapter.on('bot.message.group',(e)=>{
        if(e.group !== group)return;
        let raw = formatMsg(e.message);
        for(let reg_it in config){
            let tmp = raw.match(reg_it);
            if (tmp == null) continue;
            if(config[reg_it].adm && !admin.includes(e.sender.user_id)){
                return;
            }
            try{
                config[reg_it].cmd.split(';').forEach(regtmp=>{
                    commandParse(regtmp,tmp,e,_adapter);
                })
            }catch(err){
                console.log(err);
            }
        }
    })
}


function info(){
    return {
        name:'spark.regex',
        author:'lition',
        desc:'适用于sparkbridge的正则表达式模块',
        version: [0,0,2]
    }
}

module.exports = {onStart,info}