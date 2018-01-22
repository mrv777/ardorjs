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


  module.exports = {
    rsConvert: rsConvert,
    secretPhraseToPublicKey: secretPhraseToPublicKey,
    publicKeyToAccountId: publicKeyToAccountId,
    secretPhraseToAccountId: secretPhraseToAccountId,
    signTransactionBytes: signTransactionBytes,
    signBytes: signBytes,
  };

})();