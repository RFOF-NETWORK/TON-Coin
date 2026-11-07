import "@acton/emulation/network"
import "@acton/testing/expect"
import "@acton/testing/fuzz"
import "@contracts/messages"
import "@wrappers/utils"
import "test-utils"

@test.fuzz(64)
get fun `test transfer conserves jettons`(value: int) {
    val amount = fuzz.bound(value, 1, 20000000000);
    val (minter, owner, recipient) = setupTest();
    val senderWallet = mintTo(minter, owner, owner.address, grams("20"));
    val recipientWallet = userWallet(minter, recipient.address);

    val result = senderWallet.sendTransfer(
        owner.address,
        DEFAULT_TRANSFER_MSG_VALUE,
        amount,
        recipient.address,
        owner.address,
        null,
        0,
        null,
    );
    expect(result).toHaveAllSuccessfulTxs();
    expect(senderWallet.getJettonBalance()).toEqual(grams("20") - amount);
    expect(recipientWallet.getJettonBalance()).toEqual(amount);
}
