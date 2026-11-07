import "@acton/testing/expect"
import "../scripts/utils/common"

get fun `test offchain metadata uses TEP-64 URI prefix`() {
    val uri = "https://example.com/ton-coin.json";
    var content = buildOffchainMetadataCell(uri).beginParse();
    expect(content.loadUint(8)).toEqual(0x01);
    expect(content.loadString()).toEqual(uri);
}
