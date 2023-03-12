function wait(){
    return new Promise((res,rej)=>{
        setTimeout(()=>{
            res()
        },5e3)
    })
}

(async ()=>{
    await wait();
    console.log('hello');
})()
