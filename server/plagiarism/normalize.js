const keywords = new Set([
"int","long","float","double","char","if","else","for","while","do",
"return","void","vector","string","bool","true","false","include",
"using","namespace","std","cout","cin","printf","scanf","main"
]);

function normalize(code){
    return code.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,(word)=>{
        if(keywords.has(word)) return word;
        return "VAR";
    });
}

module.exports = normalize;
