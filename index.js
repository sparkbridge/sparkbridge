//LiteLoaderScript Dev Helper
/// <reference path="c:\Users\86158\Documents/dts/llaids/src/index.d.ts"/> 

const ME = require('./package.json');
const JSON5 = require('json5');
const winston = require('winston');
const dayjs = require('dayjs');
const { Adapter } = require('sparkbridge-core');
const fs = require('fs');
const mkdir =(dir)=>{try {fs.mkdirSync(dir)}catch{}};

const path = require('path');
let today = dayjs();


ll.registerPlugin(
    /* name */ ME.name,
    /* introduction */ ME.description,
    /* version */ ME.version.split('.'),
    /* otherInformation */ {}
);

const logger = winston.createLogger({
    format: winston.format.printf((info) => {
        return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] SparkBridge | ${info.message}`
    }),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `./plugins/sparkbridge/logs/${today.format("YYYY-MM-DD")}.log` })
    ]
});

const file = require('./handles/file');
const install = require('./handles/plhelper');
const JSON_PATH = './plugins/sparkbridge/config.json';

if (file.exists(JSON_PATH) == false) {
    mkdir('./plugins/sparkbridge/');
    file.copy('./plugins/nodejs/sparkbridge/config.json', JSON_PATH);
}
if(file.exists('./plugins/sparkbridge/plugins/')==false){
    mkdir('./plugins/sparkbridge/plugins/');
}

(async ()=>{
    if (file.listdir('./plugins/sparkbridge/plugins').length > 0) {
        let in_pl_list = file.listdir('./plugins/sparkbridge/plugins');
        logger.info('发现待安装的插件：' + in_pl_list.join(','));
        for (let p in in_pl_list) {
            logger.info('安装：'+in_pl_list[p]);
            await install(in_pl_list[p]);
        }
    }
})()


mc.listen('onServerStarted', () => {
    // 服务器开启，开始执行
    
    let config = JSON5.parse(file.read('./plugins/sparkbridge/config.json'));
    let { adapter, qq } = config;
    logger.info('SparkBridge载入中...VERSION:'+ME.version);

    // 全局方法
    global.spark = {};
    spark.VERSION = ME.VERSION;
    spark.JSON5 = require('json5');

    logger.info(`准备使用适配器：${adapter.type} 登录账号：${qq.qid}`);
    let _adapter = new Adapter(adapter.type, qq.qid, qq.platform, qq.log_level,adapter.target,null);
    _adapter.createClient();

    const cmd = mc.newCommand("spark","sparkbridge command",PermType.GameMasters);
    cmd.setEnum("LoginAction", ["slider"]);
    cmd.setEnum("CodeAction", ["mscode"]);
    cmd.setEnum("ListAction", ["login"]);
    cmd.mandatory("action", ParamType.Enum, "LoginAction", 1);
    cmd.mandatory("action", ParamType.Enum, "ListAction", 1);
    cmd.mandatory("action", ParamType.Enum, "CodeAction", 1);
    cmd.mandatory("tickit", ParamType.RawText);
    cmd.mandatory("mscode", ParamType.RawText);
    cmd.overload(["LoginAction", "tickit"]);
    cmd.overload(["CodeAction", "mscode"]);
    cmd.overload(["ListAction"]);
    cmd.setCallback((_cmd, _ori, out, res) => {
        switch (res.action) {
            case "slider":
                if(adapter.type  == 'oicq'){
                    console.log(res.tickit.trim());
                    _adapter.client.client.submitSlider(res.tickit.trim());
                }else{
                    return out.error("此方法在gocq环境下不可用");
                }
            case "login":
                if(adapter.type  == 'oicq'){
                    _adapter.client.client.login();
                }else{
                    return out.error("此方法在gocq环境下不可用");
                }
            case 'mscode':
                if(_adapter.type  == 'oicq'){
                    _adapter.client.client.submitSmsCode(res.mscode);
                }else{
                    return out.error("此方法在gocq环境下不可用");
                }

                break;

        }
    });
    cmd.setup();
    logger.info('若需要提交ticket请使用spark slider <ticket> 进行提交，扫码后输入spark login进行登录');
    _adapter.login(qq.pwd);
    const PLUGINS_PATH = path.join(__dirname, 'plugins\\');
    const plugins_list = file.listdir(PLUGINS_PATH);
    const laodPlugin = (_name) =>{
        try {
            if(file.exists(PLUGINS_PATH+_name+'\\config.json')){
                if(file.exists('./plugins/sparkbridge/'+_name+'/config.json') == false){
                    mkdir('./plugins/sparkbridge/'+_name);
                    mkdir('./plugins/sparkbridge/'+_name+'/data/');
                    file.copy(PLUGINS_PATH+_name+'\\config.json','./plugins/sparkbridge/'+_name+'/config.json');
                }
            }
            let pl_obj = require('./plugins/'+_name);
            const {name,author} = pl_obj.info();
            logger.info(`加载 ${name}`);
            pl_obj.onStart(_adapter);
            logger.info(`${name} 加载完成，作者：${author}`);
        } catch (err) {
            console.log(err);
            logger.error(`插件 ${_name} 加载失败`);
        }
    }
    _adapter.once('bot.online', () => {

        //console.log(spark.regCmd); 

        logger.info('上线成功，开始加载插件');
        // 创建底层信息
        laodPlugin('spark.mc');
        laodPlugin('spark.regex');

        for (let pl in plugins_list) {
            let _name = plugins_list[pl];
            if(_name == 'spark.mc')continue;
            if(_name == 'spark.regex')continue;
            laodPlugin(_name)
        }
    })
})