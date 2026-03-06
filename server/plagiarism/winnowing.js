const crypto = require('crypto');

function hash(str){
    return parseInt(
        crypto.createHash('md5').update(str).digest('hex').slice(0,8),
        16
    );
}

function winnowing(tokens){
    const k = 5;
    const windowSize = 4;

    let hashes = [];

    for(let i=0;i<=tokens.length-k;i++){
        const shingle = tokens.slice(i,i+k).join(' ');
        hashes.push(hash(shingle));
    }

    let fingerprints = new Set();

    for(let i=0;i<=hashes.length-windowSize;i++){
        let min = Infinity;
        let minHash = null;

        for(let j=i;j<i+windowSize;j++){
            if(hashes[j] < min){
                min = hashes[j];
                minHash = hashes[j];
            }
        }

        fingerprints.add(minHash);
    }

    return [...fingerprints];
}

module.exports = winnowing;
