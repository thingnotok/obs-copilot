import Browser from 'webextension-polyfill';

export type ObsCopilotConfig = {
  version: string;
  Host: string;
  HostName: string;
  Port: number;
  AuthToken: string;
  enableClipNoteFloatButton: boolean;
  clipNoteLocation: string;
  clipNoteCustomPage: string;
  clipNoteTemplate: string;
  userName: string;
  vaultName: string;
  wallPaper: string;
};

export const getObsCopilotConfig = async (): Promise<ObsCopilotConfig> => {
  const {
    version = '',
    Host = 'http://127.0.0.1:27123',
    HostName: HostName = '127.0.0.1',
    Port = 27123,
    AuthToken = '',
    enableClipNoteFloatButton = false,
    clipNoteLocation = 'journal',
    clipNoteCustomPage = '',
    clipNoteTemplate = `#[[Clip]] [{{title}}]({{url}})
{{content}}`,
    userName = '',
    vaultName = '',
    wallPaper = 'https://source.unsplash.com/random/400%C3%97400/?travel,starnight,sunshine',
  } = await Browser.storage.local.get();
  return {
    version,
    Host,
    HostName,
    Port,
    AuthToken,
    enableClipNoteFloatButton,
    clipNoteLocation,
    clipNoteCustomPage,
    clipNoteTemplate,
    userName,
    wallPaper,
    vaultName,
  };
};

export const saveObsCopilotConfig = async (
  updates: Partial<ObsCopilotConfig>,
) => {
  console.log('saveObsCopilotConfig', updates);
  await Browser.storage.local.set(updates);
};
