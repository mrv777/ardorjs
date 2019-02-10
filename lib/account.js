(function() {

  var Buffer = require('buffer/').Buffer;
  var crypto = require('crypto');
  var curve25519 = require('../util/curve25519.js');
  var NxtAddress = require('../util/nxtaddress.js');
  var helpers = require('./helpers');
  var BigInteger = require('jsbn');


  function rsConvert(address) {
    var addr = new NxtAddress();
    addr.set(address);
    return {
      account: addr.account_id(),
      accountRS: addr.toString(),
    };
  };

  function secretPhraseToPublicKey(secretPhrase, asByteArray) {
    var hash = helpers.hexStringToByteArray(
      helpers.simpleHash(secretPhrase, 'hex')
    );
    var pubKey = curve25519.keygen(hash).p;
    if (asByteArray) {
      return pubKey;
    }
    return helpers.byteArrayToHexString(pubKey);
  };


  function publicKeyToAccountId(publicKey, numeric) {
    var arr = helpers.hexStringToByteArray(publicKey);
    var account = helpers.simpleHash(arr, 'hex');

    var slice = (helpers.hexStringToByteArray(account)).slice(0, 8);
    var accountId = helpers.byteArrayToBigInteger(slice).toString();

    if (numeric) {
      return accountId;
    }
    var address = new NxtAddress();
    if (!address.set(accountId)) {
      return '';
    }
    return address.toString();
  };


  function secretPhraseToAccountId(secretPhrase, numeric) {
    var pubKey = secretPhraseToPublicKey(secretPhrase);
    return publicKeyToAccountId(pubKey, numeric);
  };


  function signTransactionBytes(data, secretPhrase) {
    var unsignedBytes = helpers.hexStringToByteArray(data);
    var sig = signBytes(unsignedBytes, secretPhrase);

    var sigPos = 2 * 69;
    var sigLen = 2 * 64;
    var signature = helpers.byteArrayToHexString(sig);
    var signed = data.substr(0,sigPos) + signature + data.substr(sigPos + sigLen);
    return signed;
  };


  function signBytes(message, secretPhrase) {
    var messageBytes = message;
    var secretPhraseBytes = helpers.stringToByteArray(secretPhrase);

    var digest = helpers.simpleHash(secretPhraseBytes);
    var s = curve25519.keygen(digest).s;
    var m = helpers.simpleHash(messageBytes);

    var hash = crypto.createHash('sha256');
    var mBuf = Buffer.from(m);
    var sBuf = Buffer.from(s);
    hash.update(mBuf)
    hash.update(sBuf)
    var x = hash.digest()

    var y = curve25519.keygen(x).p;

    hash = crypto.createHash('sha256');
    var yBuf = Buffer.from(y)
    hash.update(mBuf)
    hash.update(yBuf)
    var h = helpers.hexStringToByteArray(
      hash.digest('hex')
    );

    var v = curve25519.sign(h, x, s);
    return v.concat(h);
  };
  
  function verifyTransactionBytes(byteArray, requestType, data, publicKey) {

    byteArray = helpers.hexStringToByteArray(byteArray);

    var transaction = {};
    var pos = 0;
    transaction.chain = String(helpers.byteArrayToSignedInt32(byteArray, pos));
    pos += 4;
    transaction.type = byteArray[pos++];

    if (transaction.type >= 128) {
        transaction.type -= 256;
    }
    transaction.subtype = byteArray[pos++];
    transaction.version = byteArray[pos++];
    transaction.timestamp = String(helpers.byteArrayToSignedInt32(byteArray, pos));
    pos += 4;
    transaction.deadline = String(helpers.byteArrayToSignedShort(byteArray, pos));
    pos += 2;
    transaction.publicKey = helpers.byteArrayToHexString(byteArray.slice(pos, pos + 32));
    pos += 32;
    transaction.recipient = String(helpers.byteArrayToBigInteger(byteArray, pos));
    pos += 8;
    transaction.amountNQT = String(helpers.byteArrayToBigInteger(byteArray, pos));
    pos += 8;
    transaction.feeNQT = String(helpers.byteArrayToBigInteger(byteArray, pos));
    pos += 8;
    transaction.signature = byteArray.slice(pos, pos + 64);
    pos += 64;
    transaction.ecBlockHeight = String(helpers.byteArrayToSignedInt32(byteArray, pos));
    pos += 4;
    transaction.ecBlockId = String(helpers.byteArrayToBigInteger(byteArray, pos));
    pos += 8;
    transaction.flags = String(helpers.byteArrayToSignedInt32(byteArray, pos));
    pos += 4;

    if (transaction.publicKey != publicKey) { 
        return false;
    }

    // if (transaction.deadline !== data.deadline) {
    //     return false;
    // }

    if (rsConvert(transaction.recipient)['accountRS'] !== data.recipient) {
        if (!((data.recipient === undefined || data.recipient == "") && transaction.recipient == "0")) {
            return false;
        }
    }

    if (transaction.amountNQT != data.amountNQT && !(requestType === "exchangeCoins" && transaction.amountNQT === "0")) { 
        return false;
    }

    // if ("referencedTransactionFullHash" in data) {
    //     if (transaction.referencedTransactionFullHash !== data.referencedTransactionFullHash) {
    //         return false;
    //     }
    // } else if (transaction.referencedTransactionFullHash && transaction.referencedTransactionFullHash !== "") {
    //     return false;
    // }

    //has empty attachment, so no attachmentVersion byte...
    if (!(requestType == "sendMoney" || requestType == "sendMessage")) {
        pos++;
    }

    //return NRS.verifyTransactionTypes(byteArray, transaction, requestType, data, pos, attachment); //Missing function to check transaction type
    return true;
  };

  function generateToken(message, secretPhrase) {
    var messageBytes = helpers.getUtf8Bytes(message);
    var pubKeyBytes = helpers.hexStringToByteArray(secretPhraseToPublicKey(secretPhrase));
    var token = pubKeyBytes;

    var tsb = [];
    var ts = helpers.toEpochTime();
    tsb[0] = ts & 0xFF;
    tsb[1] = (ts >> 8) & 0xFF;
    tsb[2] = (ts >> 16) & 0xFF;
    tsb[3] = (ts >> 24) & 0xFF;

    messageBytes = messageBytes.concat(pubKeyBytes, tsb);
    token = token.concat(tsb, signBytes(messageBytes, secretPhrase));

    var buf = "";
    for (var ptr = 0; ptr < 100; ptr += 5) {
        var nbr = [];
        nbr[0] = token[ptr] & 0xFF;
        nbr[1] = token[ptr+1] & 0xFF;
        nbr[2] = token[ptr+2] & 0xFF;
        nbr[3] = token[ptr+3] & 0xFF;
        nbr[4] = token[ptr+4] & 0xFF;
        var number = byteArrayToBigInteger(nbr);
        if (number < 32) {
            buf += "0000000";
        } else if (number < 1024) {
            buf += "000000";
        } else if (number < 32768) {
            buf += "00000";
        } else if (number < 1048576) {
            buf += "0000";
        } else if (number < 33554432) {
            buf += "000";
        } else if (number < 1073741824) {
            buf += "00";
        } else if (number < 34359738368) {
            buf += "0";
        }
        buf +=number.toString(32);

    }
    return buf;
};

function byteArrayToBigInteger(byteArray) {
    var value = new BigInteger("0", 10);
    for (var i = byteArray.length - 1; i >= 0; i--) {
        value = value.multiply(new BigInteger("256", 10)).add(new BigInteger(byteArray[i].toString(10), 10));
    }
    return value;
}


  module.exports = {
    rsConvert: rsConvert,
    secretPhraseToPublicKey: secretPhraseToPublicKey,
    publicKeyToAccountId: publicKeyToAccountId,
    secretPhraseToAccountId: secretPhraseToAccountId,
    signTransactionBytes: signTransactionBytes,
    signBytes: signBytes,
    verifyTransactionBytes: verifyTransactionBytes,
    generateToken: generateToken
  };

})();
