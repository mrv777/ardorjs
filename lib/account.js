(function() {

  var Buffer = require('buffer/').Buffer;
  var crypto = require('crypto');
  var curve25519 = require('../util/curve25519.js');
  var NxtAddress = require('../util/nxtaddress.js');
  var helpers = require('./helpers')


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


  module.exports = {
    rsConvert: rsConvert,
    secretPhraseToPublicKey: secretPhraseToPublicKey,
    publicKeyToAccountId: publicKeyToAccountId,
    secretPhraseToAccountId: secretPhraseToAccountId,
    signTransactionBytes: signTransactionBytes,
    signBytes: signBytes,
    verifyTransactionBytes: verifyTransactionBytes,
  };

})();
