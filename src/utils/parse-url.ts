import { McUrl } from "~/models/mc-url";

export function parseUrl(url: string): McUrl {
  const urlWithoutProtocol = url.includes("//") ? url.split("//")[1] : url;
  const [host, portStr] = urlWithoutProtocol.split(":");
  const port = Number(portStr);
  return { host, port: isNaN(port) ? undefined : port };
}
