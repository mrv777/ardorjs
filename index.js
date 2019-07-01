(function() {

  var account = require('./lib/account');

  module.exports = {
    rsConvert: account.rsConvert,
    secretPhraseToPublicKey: account.secretPhraseToPublicKey,
    publicKeyToAccountId: account.publicKeyToAccountId,
    secretPhraseToAccountId: account.secretPhraseToAccountId,
    signTransactionBytes: account.signTransactionBytes,
    verifyTransactionBytes: account.verifyTransactionBytes,
    generateToken: account.generateToken,
    decryptNote: account.decryptNote
  };

})();
