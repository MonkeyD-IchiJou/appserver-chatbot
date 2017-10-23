var cdotlog = (v)=>{
    // do nothing if is in Production mode
};

if(process.env.NODE_ENV === 'development'){
    cdotlog = (v) => {
        console.log(v);
    };
}

module.exports = cdotlog;