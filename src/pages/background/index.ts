import { browser } from '@/browser';
import LogseqClient from '../logseq/client';
import { getObsCopilotConfig } from '../../config';
import { blockRending, versionCompare } from './utils';
import { debounce } from '@/utils';
import { format } from 'date-fns';
import { changeOptionsHostToHostNameAndPort } from './upgrade';
import LogseqService from '@pages/logseq/service';
import ObsidisnClient from '@pages/logseq/client';
import {
  getToday,
  getCurrentTimeList,
  getCurrentDateDay,
} from '@pages/newtab/components/Utils';
const logseqService = new LogseqService();
const client = new ObsidisnClient();
browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.type === 'query') {
      console.log('query', msg.query);
      const promise = new Promise(async () => {
        const searchRes = await logseqService.search(msg.query);
        port.postMessage(searchRes);
      });

      promise.catch((err) => console.error(err));
    } else if (msg.type === 'open-options') {
      browser.runtime.openOptionsPage();
    } else {
      console.debug(msg);
    }
  });
});

browser.runtime.onMessage.addListener((msg, sender) => {
  console.log('onMessage', msg);
  if (msg.type === 'open-options') {
    browser.runtime.openOptionsPage();
  } else if (msg.type === 'clip-with-selection') {
    quickCapture(msg.data);
  } else if (msg.type === 'clip-page') {
    quickCapture('');
  } else if (msg.type === 'open-page') {
    openPage(msg.url);
  } else if (msg.type === 'change-block-marker') {
    changeBlockMarker(msg.uuid, msg.marker);
  } else {
    console.debug(msg);
  }
});

const changeBlockMarker = async (uuid: string, marker: string) => {
  const tab = await getCurrentTab();
  if (!tab) {
    return;
  }
  const result = await logseqService.changeBlockMarker(uuid, marker);
  browser.tabs.sendMessage(tab.id!, result);
};

const getCurrentTab = async () => {
  const tab = await browser.tabs.query({ active: true, currentWindow: true });
  return tab[0];
};

const openPage = async (url: string) => {
  console.debug(url);
  const tab = await getCurrentTab();
  if (!tab) {
    browser.tabs.create({ url: url });
    return;
  }
  const activeTab = tab;
  if (activeTab.url !== url)
    await browser.tabs.update(activeTab.id, { url: url });
};

const quickCapture = async (data: string) => {
  const tab = await getCurrentTab();
  if (!tab) return;
  const activeTab = tab;
  getObsCopilotConfig().then((config) => {
    console.log(config);
    client.apiKey = config?.AuthToken || '';
    client.url = config?.HostName || '';
    client.port = config?.Port || 0;
    let dout = `- ${getCurrentTimeList()} ${data} [>](${activeTab.url})`;
    if (data === '') {
      dout = `- ${getCurrentTimeList()} [${activeTab.title}](${activeTab.url})`;
    }
    client
      .append(`${config.journalFolder}/${getToday()}.md`, dout)
      .catch((error) => {
        if (error.response && error.response.status !== 204) {
          console.error('Error in client.append:', error);
        }
      });
  });
};

browser.tabs.onActivated.addListener((activeInfo) => {
  const promise = new Promise(async () => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    await debounceBadgeSearch(tab.url, activeInfo.tabId);
  });
  promise.catch((err) => console.error(err));
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') {
    const promise = new Promise(async () => {
      await debounceBadgeSearch(tab.url, tabId);
    });
    promise.catch((err) => console.error(err));
  }
});

const badgeSearch = async (url: string | undefined, tabId: number) => {
  if (!url) return;
  const searchURL = new URL(url);
  const searchRes = await logseqService.urlSearch(searchURL);
  const resultCount = searchRes.count ? searchRes.count!.toString() : '';
  await setExtensionBadge(resultCount, tabId);
};

const debounceBadgeSearch = debounce(badgeSearch, 500);

try {
  browser.contextMenus.create({
    id: 'clip-with-selection',
    title: 'Clip "%s"',
    visible: true,
    contexts: ['selection'],
  });
} catch (error) {
  console.log(error);
}

try {
  browser.contextMenus.create({
    id: 'clip-page',
    title: 'Clip page link',
    visible: true,
    contexts: ['page'],
  });
} catch (error) {
  console.log(error);
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  console.log('right click', info, tab);
  console.log(client);
  browser.tabs.sendMessage(
    tab!.id!,
    { type: info.menuItemId, url: info.pageUrl },
    {},
  );
});

browser.runtime.onInstalled.addListener((event) => {
  if (event.reason === 'install') {
    browser.runtime.openOptionsPage();
  } else if (event.reason === 'update') {
    if (versionCompare(event.previousVersion!, '1.10.19') < 0) {
      changeOptionsHostToHostNameAndPort();
    }
  }
});

browser.commands.onCommand.addListener((command, tab) => {
  if (command === 'clip' && tab !== undefined) {
    browser.tabs.sendMessage(tab.id!, { type: 'clip' });
  }
});

async function setExtensionBadge(text: string, tabId: number) {
  await browser.action.setBadgeText({
    text: text,
    tabId: tabId,
  });
  await browser.action.setBadgeBackgroundColor({ color: '#4caf50', tabId });
  await browser.action.setBadgeTextColor({ color: '#ffffff', tabId });
}
