import { parseUrl } from "./parse-url";

describe("parseUrl", () => {
  it("host + port", () => {
    expect(parseUrl("a.test.com:2233")).toMatchObject({
      host: "a.test.com",
      port: 2233,
    });
  });
  it("only host", () => {
    expect(parseUrl("test.com")).toMatchObject({ host: "test.com" });
  });
  it("only host with :", () => {
    expect(parseUrl("a.com:")).toMatchObject({ host: "a.com" });
  });
  it("ip", () => {
    expect(parseUrl("1.20.30.40")).toMatchObject({ host: "1.20.30.40" });
  });
  it("ip + port", () => {
    expect(parseUrl("1.20.30.40:44")).toMatchObject({
      host: "1.20.30.40",
      port: 44,
    });
  });
  it("with protocol", () => {
    expect(parseUrl("http://1.20.30.40:44")).toMatchObject({
      host: "1.20.30.40",
      port: 44,
    });
  });
});
