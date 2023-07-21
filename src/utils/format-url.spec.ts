import { formatUrl } from "./format-url";

describe("formatUrl", () => {
  it("host + port", () => {
    expect(formatUrl({ host: "a.test.com", port: 2233 })).toMatch(
      "a.test.com:2233",
    );
  });
  it("only host", () => {
    expect(formatUrl({ host: "a.test.com" })).toMatch("a.test.com");
  });
  it("undefined port", () => {
    expect(formatUrl({ host: "a.test.com", port: undefined })).toMatch(
      "a.test.com",
    );
  });
});
