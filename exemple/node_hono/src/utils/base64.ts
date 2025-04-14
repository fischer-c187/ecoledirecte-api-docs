export const decodeBase64 = (str: string): string => {
  return Buffer.from(str, "base64").toString("utf-8");
};

export const encodeBase64 = (str: string): string => {
  return Buffer.from(str).toString("base64");
};
