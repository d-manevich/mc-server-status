import { McUrl } from "~/models/mc-url";

export function parseUrl(url: string): McUrl {
  const urlWithoutProtocol = url.includes("//") ? url.split("//")[1] : url;
  const [host, portString] = urlWithoutProtocol.split(":");
  const port = Number(portString);
  return { host, port: Number.isNaN(port) ? undefined : port };
}
