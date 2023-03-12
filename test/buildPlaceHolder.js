function buildPlaceHolder(raw) {
    let out_raw = [];
    // 是否正在匹配
    let matching = false;
    // 正在匹配的字符串
    let matching_now = '';
    // 是否跳过当前转义
    let skip_next = false;
    for (let i in raw) {
        let now_i = raw[i];
        console.log('匹配：'+now_i);
        if(skip_next == false){ // 需要进行变量判断
            if(now_i == '\\'){  // 需要直接写入下一位
               skip_next = true;
               console.log('跳过判断下一位');
            }else if(now_i == '%'){
                // 开始或者结束匹配变量
                if(matching){
                    matching = false;
                    out_raw.push({type:'holder',raw:matching_now});
                    matching_now = '';
                }else{
                    matching = true;
                }
            }else{
                if(matching){
                    matching_now += now_i;
                }else{
                    out_raw.push({type:'plan',raw:now_i})
                }
            }
        }else{ //需要直接写入当前字符串
            out_raw.push({type:'plan',raw:now_i})
            skip_next = false;
        }
    }
    return out_raw;
}


//console.log(buildPlaceHolder('我是%CPU%\\%是吗'));