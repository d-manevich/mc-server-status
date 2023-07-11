export function parseUrlForHostAndPort(serverUrl: string) {
  const [host, port] = serverUrl.split(":");
  let portNumber: number | undefined = +port;
  if (portNumber <= 0 || isNaN(portNumber)) {
    portNumber = undefined;
  }
  return { host, port: portNumber };
}
