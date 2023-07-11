export const APP_CONFIG = {
  timeout: 10000,
  minecraftPollingIntervalMs: 2000,
  protocolVersion: process.env.PROTOCOL_VERSION
    ? Number(process.env.PROTOCOL_VERSION)
    : 763, // 1.7.1 from https://wiki.vg/Protocol_version_numbers
};
