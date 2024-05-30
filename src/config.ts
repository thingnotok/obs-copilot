import Browser from 'webextension-polyfill';

export type LogseqCopliotConfig = {
  version: string;
  logseqHost: string;
  logseqHostName: string;
  logseqPort: number;
  logseqAuthToken: string;
  enableClipNoteFloatButton: boolean;
  clipNoteLocation: string;
  clipNoteCustomPage: string;
  clipNoteTemplate: string;
  userName: string;
  wallPaper: string;
};

export const getLogseqCopliotConfig =
  async (): Promise<LogseqCopliotConfig> => {
    const {
      version = '',
      logseqHost = 'http://127.0.0.1:27123',
      logseqHostName = '127.0.0.1',
      logseqPort = 27123,
      logseqAuthToken = '',
      enableClipNoteFloatButton = false,
      clipNoteLocation = 'journal',
      clipNoteCustomPage = '',
      clipNoteTemplate = `#[[Clip]] [{{title}}]({{url}})
{{content}}`,
      userName = '',
      wallPaper = 'https://source.unsplash.com/random/400%C3%97400/?travel,starnight,sunshine',
    } = await Browser.storage.local.get();
    return {
      version,
      logseqHost,
      logseqHostName,
      logseqPort,
      logseqAuthToken,
      enableClipNoteFloatButton,
      clipNoteLocation,
      clipNoteCustomPage,
      clipNoteTemplate,
      userName,
      wallPaper,
    };
  };

export const saveLogseqCopliotConfig = async (
  updates: Partial<LogseqCopliotConfig>,
) => {
  console.log('saveLogseqCopliotConfig', updates);
  await Browser.storage.local.set(updates);
};
