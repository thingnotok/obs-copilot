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
      logseqHost = 'http://localhost:12315',
      logseqHostName = 'localhost',
      logseqPort = 12315,
      logseqAuthToken = '',
      enableClipNoteFloatButton = false,
      clipNoteLocation = "journal",
      clipNoteCustomPage = "",
      clipNoteTemplate = `#[[Clip]] [{{title}}]({{url}})
{{content}}`,
      userName = "",
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
      wallPaper
    };
  };

export const saveLogseqCopliotConfig = async (
  updates: Partial<LogseqCopliotConfig>,
) => {
  console.log('saveLogseqCopliotConfig', updates);
  await Browser.storage.local.set(updates);
};
