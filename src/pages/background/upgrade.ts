import { getObsCopilotConfig, saveObsCopilotConfig } from '@/config';

export const changeOptionsHostToHostNameAndPort = async () => {
  const { logseqHost } = await getObsCopilotConfig();
  if (logseqHost) {
    const url = new URL(logseqHost);
    await saveObsCopilotConfig({
      logseqHostName: url.hostname,
      logseqPort: parseInt(url.port),
    });
    browser.storage.local.remove('logseqHost');
  }
};
