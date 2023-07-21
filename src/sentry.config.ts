import * as Sentry from "@sentry/node";
import { Container } from "~/container";

export function getSentryConfig(container: Container): Sentry.NodeOptions {
  const { config, prisma } = container;

  return {
    dsn: config.SENTRY_DSN,
    tracesSampleRate: 1,
    integrations: [new Sentry.Integrations.Prisma({ client: prisma.raw })],
    beforeBreadcrumb(breadcrumb) {
      // clean up sensitive data from URL like token
      if (breadcrumb.data?.url) {
        // eslint-disable-next-line no-param-reassign
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /\/bot[^/]+/,
          "/botTOKEN",
        );
      }
      return breadcrumb;
    },
  };
}
