function similarity(arr1,arr2){
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    let intersection = 0;

    for(let x of set1){
        if(set2.has(x)) intersection++;
    }

    const union = new Set([...set1,...set2]).size;

    return union === 0 ? 0 : intersection/union;
}

module.exports = similarity;
