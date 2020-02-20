var account = require('../../index');

const PASSPHRASE = "skin grey itself dry throughout hook moonlight egg fly pack bought moral";
const PUBLICKEY = "becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec32";
const ACCOUNTID = "5950989589159323752";
const ACCOUNTRS = "ARDOR-9C5A-J3PY-UEG3-7BK77";


describe("Ardor functions", function () {

  describe("secretPhraseToPublicKey", function () {

    it('should return the correct publicKey', function ()  {
      expect(account.secretPhraseToPublicKey(PASSPHRASE)).toBe(PUBLICKEY);
    });

  });

  describe("publicKeyToAccountId", () => {

    it("should return the correct account id", () => {
      expect(account.publicKeyToAccountId(PUBLICKEY, true)).toBe(ACCOUNTID);
    });

    it("should return the correct account RS", () => {
      expect(account.publicKeyToAccountId(PUBLICKEY, false)).toBe(ACCOUNTRS);
    });

  });

  describe("rsConvert", () => {

    it("should return the correct account id and account RS", () => {
      expect(account.rsConvert(ACCOUNTID)).toStrictEqual({ account: ACCOUNTID, accountRS: ACCOUNTRS });
    });

  });

  describe("signTransactionBytes", () => {

    describe("sendMoney", () => {

      it("should match unsignedTxBytes with signedTexBytes from the API", () => {
        // Generated on http://localhost:26876/test Ardor v2.2.2
        const unsignedTxBytes = "02000000000001711174020f00becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec32a19039796f8ecc72e803000000000000c0c62d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aad6190065b5226ed2a6603900000000000000000000000000000000000000000000000000000000000000000000000000000000";
        const signedTxBytes = "02000000000001711174020f00becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec32a19039796f8ecc72e803000000000000c0c62d0000000000bfb61a5240d5552d16809f81206f4696313b3da3324cb17150b1202ac4faef0c1a96ccc53afd3e29722b84b29589d3c0c40dd55dc8a4a5d49ffcc367dee106a6aad6190065b5226ed2a6603900000000000000000000000000000000000000000000000000000000000000000000000000000000";

        expect(account.signTransactionBytes(unsignedTxBytes, PASSPHRASE)).toBe(signedTxBytes);
      });

    });

    describe("transferAsset", () => {

      it('should return transaction bytes as the API', () => {
        // Generated on http://localhost:26876/test Ardor v2.2.2
        const unsignedTxBytes = "02000000020101fd1174020f00becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec32a19039796f8ecc720000000000000000c0c62d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b9d61900082fb63f13ff402a0000000001ed61e00849facc000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        const expectedOutput = "02000000020101fd1174020f00becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec32a19039796f8ecc720000000000000000c0c62d00000000000da242993f662e0bb759b6d69d6dd64a1defd2de97da0e098bcd0927c63b1104ae427925ce1c9d56b09c666e28ae3572160f400cce6dd3b08fd607bf070fee01b9d61900082fb63f13ff402a0000000001ed61e00849facc000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        expect(account.signTransactionBytes(unsignedTxBytes, PASSPHRASE)).toBe(expectedOutput);
      });

    });

  });

  describe("verifyTransactionBytes", () => {

    it("should verify created transaction bytes", () => {
      // Generated on http://localhost:26876/test Ardor v2.2.2
      const unsignedTxBytes = "0200000002030105cd74020f00becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec3200000000000000000000000000000000c0c62d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffe61900134a11dad8d6fdec0000000001ed61e00849facc0064000000000000006400000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      const transactionType = "2";
      const transactionJSON = {
        "senderPublicKey": "becb4fc50718637b08605be95b741856f3af681982e5285ec38c7d9750e4ec32",
        "chain": 2,
        "signature": "e4bc5ba95b69e97bae7e002e2eede9ed7d08c2576387de2ac9dc8bdaaf98e509de8417590eba621e07812b59dd0f5b43deb5332c1dc690427b819977fb5714ca",
        "feeNQT": "3000000",
        "type": 2,
        "fullHash": "37b57ad6d27c4e82fd9aab8e57e5e35c8308512f8d0ca04e0a2946680023016a",
        "version": 1,
        "fxtTransaction": "0",
        "phased": false,
        "ecBlockId": "17077041588918635027",
        "signatureHash": "bf7f790999e9a9fa2b81ae73d89b879645fecaff0f7ac19845c5b81244dc3e4f",
        "attachment": {
            "quantityQNT": "100",
            "asset": "57696086837453293",
            "priceNQTPerShare": "100",
            "version.BidOrderPlacement": 1
        },
        "senderRS": "ARDOR-9C5A-J3PY-UEG3-7BK77",
        "subtype": 3,
        "amountNQT": "0",
        "sender": "5950989589159323752",
        "ecBlockHeight": 1697535,
        "deadline": 15,
        "timestamp": 41209093,
        "height": 2147483647
      };

      expect(account.verifyTransactionBytes(unsignedTxBytes, transactionType, transactionJSON, PUBLICKEY)).toBe(true);
    });

  });

  describe('message encryption', function() {
    it('encrypt and decrypt a message', function(done) {
      var message_to_encrypt = 'My encrypted gift to you!';

      var encrypted = account.encryptMessage(
        text = message_to_encrypt, 
        senderSecretPhrase = PASSPHRASE,
        recipientPublicKey = 'e0914433305c721bbc5bb40f41ad3bc22304aac29d3c25ee8fb1bf40dde5ff3b'
      );

      var decrypted = account.decryptMessage(
        message = encrypted.encryptedMessageData,
        nonce = encrypted.encryptedMessageNonce,
        senderPublicKey = 'e0914433305c721bbc5bb40f41ad3bc22304aac29d3c25ee8fb1bf40dde5ff3b',
        secretPhrase = PASSPHRASE
      );
      expect(decrypted.message).toBe(message_to_encrypt);
      done();
    });
  });

});
