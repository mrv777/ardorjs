var crypto = require('crypto');
var BigInteger = require('jsbn');

var charToNibble = {};
var nibbleToChar = [];
var EPOCH_BEGINNING = 1514764800000;

var i;
for (i = 0; i <= 9; ++i) {
  var character = i.toString();
  charToNibble[character] = i;
  nibbleToChar.push(character);
}

for (i = 10; i <= 15; ++i) {
  var lowerChar = String.fromCharCode('a'.charCodeAt(0) + i - 10);
  var upperChar = String.fromCharCode('A'.charCodeAt(0) + i - 10);

  charToNibble[lowerChar] = i;
  charToNibble[upperChar] = i;
  nibbleToChar.push(lowerChar);
}

function simpleHash(message, encoding) {
  if (message instanceof Array) {
    message = Buffer.from(message);
  }
  return crypto.createHash('sha256').update(message).digest(encoding);
};


// function byteArrayToBigInteger(byteArray, startIndex) {
//   var value = new BigInteger('0', 10);
//   var temp1, temp2;
//   for (var i = byteArray.length - 1; i >= 0; i--) {
//     temp1 = value.multiply(new BigInteger('256', 10));
//     temp2 = temp1.add(new BigInteger(byteArray[i].toString(10), 10));
//     value = temp2;
//   }
//   return value;
// };
function byteArrayToBigInteger(bytes, opt_startIndex) {
  var index = this.checkBytesToIntInput(bytes, 8, opt_startIndex);
  var value = new BigInteger("0", 10);
  var temp1, temp2;

  if (!opt_startIndex) {
    opt_startIndex = 0;
  }

  for (var i = 7; i >= 0; i--) {
    temp1 = value.multiply(new BigInteger("256", 10));
    temp2 = temp1.add(new BigInteger(bytes[opt_startIndex + i].toString(10), 10));
    value = temp2;
  }

  return value;
};

function intValToByteArray(number) {
  // We want to represent the input as a 8-bytes array
  var byteArray = [0, 0, 0, 0];
  for (var index = 0; index < byteArray.length; index ++) {
    var byte = number & 0xff;
    byteArray [ index ] = byte;
    long = (number - byte) / 256 ;
  }
  return byteArray;
};


function byteArrayToIntVal(byteArray) {
  // We want to represent the input as a 8-bytes array
  var intval = 0;
  for (var index = 0; index < byteArray.length; index ++) {
    var byt = byteArray[index] & 0xFF;
    var value = byt * Math.pow(256, index);
    intval += value;
  }
  return intval;
};


function hexStringToByteArray(str) {
  var bytes = [];
  var i = 0;
  if (0 !== str.length % 2) {
    bytes.push(charToNibble[str[0]]);
    ++i;
  }

  for (; i < str.length - 1; i += 2) {
    bytes.push(
      (charToNibble[str[i]] << 4) + charToNibble[str[i + 1]]
    );
  }

  return bytes;
};


function byteArrayToHexString(bytes) {
  // var str = '';
  // for (var i = 0; i < bytes.length; ++i) {
  //   if (bytes[i] < 0) {
  //     bytes[i] += 256;
  //   }
  //   str += nibbleToChar[bytes[i] >> 4] + nibbleToChar[bytes[i] & 0x0F];
  // }

  return Array.from(bytes, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')

  //return str;
};


function stringToByteArray(str) {
  str = unescape(encodeURIComponent(str));
  var bytes = new Array(str.length);
  for (var i = 0; i < str.length; ++i) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
};


function stringToHexString(str) {
  return byteArrayToHexString(stringToByteArray(str));
};

function checkBytesToIntInput(bytes, numBytes, opt_startIndex) {
  var startIndex = opt_startIndex || 0;
  if (startIndex < 0) {
    throw new Error('Start index should not be negative');
  }

  if (bytes.length < startIndex + numBytes) {
    throw new Error('Need at least ' + (numBytes) + ' bytes to convert to an integer');
  }
  return startIndex;
};

function byteArrayToSignedShort(bytes, opt_startIndex) {
  var index = this.checkBytesToIntInput(bytes, 2, opt_startIndex);
  var value = bytes[index];
  value += bytes[index + 1] << 8;
  return value;
};

function byteArrayToSignedInt32(bytes, opt_startIndex) {
  var index = this.checkBytesToIntInput(bytes, 4, opt_startIndex);
  var value = bytes[index];
  value += bytes[index + 1] << 8;
  value += bytes[index + 2] << 16;
  value += bytes[index + 3] << 24;
  return value;
};


function byteArrayToWordArray(byteArray) {
  var i = 0;
  var offset = 0;
  var word = 0;
  var len = byteArray.length;
  var words = new Uint32Array(((len / 4) | 0) + (len % 4 == 0 ? 0 : 1));

  while (i < (len - (len % 4))) {
    words[offset++] = (
      byteArray[i++] << 24) |
      (byteArray[i++] << 16) |
      (byteArray[i++] << 8) |
      (byteArray[i++]
    );
  }
  if (len % 4 != 0) {
    word = byteArray[i++] << 24;
    if (len % 4 > 1) {
      word = word | byteArray[i++] << 16;
    }
    if (len % 4 > 2) {
      word = word | byteArray[i++] << 8;
    }
    words[offset] = word;
  }
  var wordArray = new Object();
  wordArray.sigBytes = len;
  wordArray.words = words;
  return wordArray;
};


function wordArrayToByteArray(wordArray, isFirstByteHasSign = true) {
  var len = wordArray.words.length;
  if (len == 0) {
    return new Array(0);
  }
  var byteArray = new Array(wordArray.sigBytes);
  var offset = 0;
  var word;
  var i;
  for (i = 0; i < len - 1; i++) {
    word = wordArray.words[i];
    byteArray[offset++] = isFirstByteHasSign ? word >> 24 : (word >> 24) & 0xff;
    byteArray[offset++] = (word >> 16) & 0xff;
    byteArray[offset++] = (word >> 8) & 0xff;
    byteArray[offset++] = word & 0xff;
  }
  word = wordArray.words[len - 1];
  byteArray[offset++] = isFirstByteHasSign ? word >> 24 : (word >> 24) & 0xff;
  if (wordArray.sigBytes % 4 == 0) {
    byteArray[offset++] = (word >> 16) & 0xff;
    byteArray[offset++] = (word >> 8) & 0xff;
    byteArray[offset++] = word & 0xff;
  }
  if (wordArray.sigBytes % 4 > 1) {
    byteArray[offset++] = (word >> 16) & 0xff;
  }
  if (wordArray.sigBytes % 4 > 2) {
    byteArray[offset++] = (word >> 8) & 0xff;
  }
  return byteArray;
};


function byteArrayToShortArray(byteArray) {
  var shortArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var i;
  for (i = 0; i < 16; i++) {
    shortArray[i] = byteArray[i * 2] | byteArray[i * 2 + 1] << 8;
  }
  return shortArray;
};


function shortArrayToByteArray(shortArray) {
  var byteArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var i;
  for (i = 0; i < 16; i++) {
    byteArray[2 * i] = shortArray[i] & 0xff;
    byteArray[2 * i + 1] = shortArray[i] >> 8;
  }
  return byteArray;
};


function shortArrayToHexString(ary) {
  var res = '';
  for (var i = 0; i < ary.length; i++) {
    res += nibbleToChar[(ary[i] >> 4) & 0x0f] +
           nibbleToChar[ary[i] & 0x0f] +
           nibbleToChar[(ary[i] >> 12) & 0x0f] +
           nibbleToChar[(ary[i] >> 8) & 0x0f];
  }
  return res;
};


function byteArrayToString(bytes, startIndex, length) {
  if (length == 0) {
    return '';
  }
  if (startIndex && length) {
    var index = this.checkBytesToIntInput(
      bytes,
      parseInt(length, 10),
      parseInt(startIndex, 10)
    );
    bytes = bytes.slice(startIndex, startIndex + length);
  }
  return decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)));
};

function toEpochTime(currentTime) {
    if (currentTime == undefined) {
        currentTime = new Date();
    }
    return Math.floor((currentTime - EPOCH_BEGINNING) / 1000);
};

function getUtf8Bytes(str) {
    var utf8 = unescape(encodeURIComponent(str));
    var arr = [];
    for (var i = 0; i < utf8.length; i++) {
        arr[i] = utf8.charCodeAt(i);
    }
    return arr;
};

module.exports = {
  simpleHash: simpleHash,
  byteArrayToBigInteger: byteArrayToBigInteger,
  intValToByteArray: intValToByteArray,
  byteArrayToIntVal: byteArrayToIntVal,
  hexStringToByteArray: hexStringToByteArray,
  byteArrayToHexString: byteArrayToHexString,
  stringToByteArray: stringToByteArray,
  stringToHexString: stringToHexString,
  checkBytesToIntInput: checkBytesToIntInput,
  byteArrayToSignedShort: byteArrayToSignedShort,
  byteArrayToSignedInt32: byteArrayToSignedInt32,
  byteArrayToWordArray: byteArrayToWordArray,
  wordArrayToByteArray: wordArrayToByteArray,
  byteArrayToShortArray: byteArrayToShortArray,
  shortArrayToByteArray: shortArrayToByteArray,
  shortArrayToHexString: shortArrayToHexString,
  byteArrayToString: byteArrayToString,
  toEpochTime: toEpochTime,
  getUtf8Bytes: getUtf8Bytes
};
