import { sanitizeAvatarUri } from "./avatarUtils";

describe("sanitizeAvatarUri", () => {
  it("should allow https:// URIs", () => {
    const uri = "https://example.com/avatar.png";
    expect(sanitizeAvatarUri(uri)).toBe(uri);
  });

  it("should allow http:// URIs", () => {
    const uri = "http://example.com/avatar.png";
    expect(sanitizeAvatarUri(uri)).toBe(uri);
  });

  it("should reject relative paths starting with /", () => {
    const uri = "/images/avatar.png";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject relative paths starting with ./", () => {
    const uri = "./avatar.png";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject relative paths starting with ../", () => {
    const uri = "../images/avatar.png";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject directory traversal attempts", () => {
    const uri = "../../../etc/passwd";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject javascript: URIs", () => {
    const uri = 'javascript:alert("XSS")';
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject data: URIs", () => {
    const uri = 'data:text/html,<script>alert("XSS")</script>';
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject file: URIs", () => {
    const uri = "file:///etc/passwd";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should reject vbscript: URIs", () => {
    const uri = 'vbscript:msgbox("XSS")';
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should handle null input", () => {
    expect(sanitizeAvatarUri(null)).toBeNull();
  });

  it("should handle undefined input", () => {
    expect(sanitizeAvatarUri(undefined)).toBeNull();
  });

  it("should handle empty string", () => {
    expect(sanitizeAvatarUri("")).toBeNull();
  });

  it("should reject invalid URIs", () => {
    const uri = "not-a-valid-url";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should handle IPFS URIs correctly", () => {
    // IPFS URIs should be rejected as they don't use http/https
    const uri = "ipfs://QmExample123";
    expect(sanitizeAvatarUri(uri)).toBeNull();
  });

  it("should handle case-sensitive protocols", () => {
    // Protocols should be lowercase, but URL constructor normalizes them
    const uri = "HTTPS://example.com/avatar.png";
    expect(sanitizeAvatarUri(uri)).toBe("HTTPS://example.com/avatar.png");
  });
});
