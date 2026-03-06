function tokenize(code){
    return code
        .replace(/[{}();,+\-*/<>=\[\]]/g,' $& ')
        .split(/\s+/)
        .filter(Boolean);
}

module.exports = tokenize;
