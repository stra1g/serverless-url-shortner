export const verifyExpiration = (expires_at: number) => {
  return expires_at < Math.floor(Date.now() / 1000);
};
