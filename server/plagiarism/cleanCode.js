function cleanCode(code){
    code = code.replace(/\/\/.*$/gm,'');
    code = code.replace(/\/\*[\s\S]*?\*\//g,'');
    return code;
}

module.exports = cleanCode;
