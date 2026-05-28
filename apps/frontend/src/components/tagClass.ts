export function tagClass(tag: string): string {
  const key = tag.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["hardware", "next"].includes(key)) return "tag-cat-hardware";
  if (["software", "swift", "swiftui", "mac", "os", "nextstep", "web", "design"].includes(key)) {
    return "tag-cat-software";
  }
  if (["electronics", "raspberrypi", "llm", "ai", "workflow"].includes(key)) {
    return "tag-cat-electronics";
  }
  if (["3d", "3dprint", "fediverse", "mastodon"].includes(key)) return "tag-cat-3d";
  return "";
}
