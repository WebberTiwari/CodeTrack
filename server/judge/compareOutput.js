// // // normalize outputs (very important)
// // function normalize(text) {
// //   if (!text) return "";
  
// //   return text
// //     .toString()
// //     .replace(/\r/g, "")      // windows line endings
// //     .trim();                 // remove extra spaces & new lines
// // }

// // function compareOutput(userOutput, expectedOutput) {
// //   const user = normalize(userOutput);
// //   const expected = normalize(expectedOutput);

// //   return user === expected;
// // }

// // module.exports = compareOutput;


// function normalize(str) {
//   return (str ?? "")
//     .replace(/\r/g, "")
//     .trim()
//     .split("\n")
//     .map(line => line.trim())
//     .join("\n");
// }

// function compareOutput(user, expected) {
//   return normalize(user) === normalize(expected);
// }

// module.exports = compareOutput;


function normalize(str) {
  if (!str) return "";

  return str
    .toString()
    .replace(/\r/g, "")            // remove Windows CR
    .trim()
    .split("\n")
    .map(line =>
      line
        .trim()
        .split(/\s+/)              // collapse multiple spaces
        .join(" ")
    )
    .join("\n");
}

function compareOutput(user, expected) {
  return normalize(user) === normalize(expected);
}

module.exports = compareOutput;