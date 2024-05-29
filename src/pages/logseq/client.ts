import { LogseqBlockType, LogseqPageIdenity } from '../../types/logseqBlock';
import { getLogseqCopliotConfig } from '../../config';
import moment from 'moment';
import {
  CannotConnectWithLogseq,
  LogseqVersionIsLower,
  TokenNotCurrect,
  UnknownIssues,
  NoSearchingResult,
} from './error';

type Graph = {
  name: string;
  path: string;
};

type LogseqSearchResponse = {
  blocks: {
    'block/uuid': string;
    'block/content': string;
    'block/page': number;
  }[];
  'pages-content': {
    'block/uuid': string;
    'block/snippet': string;
  }[];
  pages: string[];
};

export type LogseqPageResponse = {
  name: string;
  uuid: string;
  'journal?': boolean;
};

export type LogseqResponseType<T> = {
  status: number;
  msg: string;
  response: T;
  count?: number;
};

export default class LogseqClient {
  private baseFetch = async (method: string, args: any[]) => {
    const config = await getLogseqCopliotConfig();
    const endPoint = new URL(config.logseqHost);
    const apiUrl = new URL(`${endPoint.origin}/api`);
    const resp = await fetch(apiUrl, {
      mode: 'cors',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.logseqAuthToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        method: method,
        args: args,
      }),
    });

    if (resp.status !== 200) {
      throw resp;
    }

    return resp;
  };

  private baseJson = async (method: string, args: any[]) => {
    const resp = await this.baseFetch(method, args);
    const data = await resp.json();
    return data;
  };

  private getCurrentGraph = async (): Promise<Graph> => {
    return await this.baseJson('logseq.getCurrentGraph', []);
  };
  public gotoHome = async ()=>{
    console.log('enter gohome')
    const resp = await this.baseJson('logseq.App.invokeExternalCommand', [
      'logseq.go/journals']);
    return resp;
  }
  public gotoBlkInPage = async (pageName, blkUuid)=>{
    console.log('goto blkn page')
    const resp = await this.baseJson('logseq.Editor.scrollToBlockInPage', [
      pageName, blkUuid]);
    return resp;
  }

  public appendBlock = async (page, content) => {
    const resp = await this.baseJson('logseq.Editor.appendBlockInPage', [
      page,
      content,
    ]);
    return resp;
  };

  public getCurrentPage = async () => {
    return await this.catchIssues(async () => {
      return await this.baseJson('logseq.Editor.getCurrentPage', []);
    });
  };

  private getAllPage = async () => {
    return await this.baseJson('logseq.Editor.getAllPages', []);
  };

  public getPage = async (
    pageIdenity: LogseqPageIdenity,
  ): Promise<LogseqPageIdenity> => {
    const resp: LogseqPageIdenity = await this.baseJson(
      'logseq.Editor.getPage',
      [pageIdenity.id || pageIdenity.uuid || pageIdenity.name],
    );
    return resp;
  };

  public getJournalToday = async (): Promise<LogseqPageIdenity> => {
    const resp: LogseqPageIdenity = await this.baseJson(
      'logseq.Editor.getPage',
      [moment().format('YYYY-MM-DD')],
    );
    return resp;
  };

  public getPageBlocksTree= async (pi): Promise<Array> => {
    // const target = this.getJournalDayDate();
    // console.log(target)
    const resp: LogseqPageIdenity = await this.baseJson(
      'logseq.Editor.getPageBlocksTree',
      [pi.uuid],
    );
    return resp;
  };

  public search = async (query: string): Promise<LogseqSearchResponse> => {
    const resp = await this.baseJson('logseq.App.search', [query]);
    if (resp.error) {
      throw LogseqVersionIsLower;
    }
    return resp;
  };

  public getBlockViaUuid = async (
    uuid: string,
    opt?: { includeChildren: boolean },
  ) => {
    return await this.baseJson('logseq.Editor.getBlock', [uuid, opt]);
  };

  private showMsgInternal = async (
    message: string,
  ): Promise<LogseqResponseType<null>> => {
    await this.baseFetch('logseq.showMsg', [message]);
    return {
      status: 200,
      msg: 'success',
      response: null,
    };
  };

  private async catchIssues(func: Function) {
    try {
      return await func();
    } catch (e: any) {
      console.info(e);
      if (e.status === 401) {
        return TokenNotCurrect;
      } else if (
        e.toString() === 'TypeError: Failed to fetch' ||
        e.toString().includes('Invalid URL')
      ) {
        return CannotConnectWithLogseq;
      } else if (e === LogseqVersionIsLower || e === NoSearchingResult) {
        return e;
      } else {
        return UnknownIssues;
      }
    }
  }

  private getVersionInternal = async (): Promise<
    LogseqResponseType<string>
  > => {
    const resp = await this.baseJson('logseq.App.getAppInfo', []);
    return {
      status: 200,
      msg: 'success',
      response: resp.version,
    };
  };

  public find = async (query: string) => {
    const data = await this.baseJson('logseq.DB.q', [
      `"${query.replaceAll('"', '"')}"`,
    ]);
    return data;
  };

  public getUserConfig = async () => {
    return await this.catchIssues(
      async () => await this.baseJson('logseq.App.getUserConfigs', []),
    );
  };

  public showMsg = async (
    message: string,
  ): Promise<LogseqResponseType<null>> => {
    return await this.catchIssues(
      async () => await this.showMsgInternal(message),
    );
  };

  public getAllPages = async (): Promise<string> => {
    return await this.catchIssues(async () => await this.getAllPage());
  };

  public getGraph = async (): Promise<Graph> => {
    return await this.catchIssues(async () => await this.getCurrentGraph());
  };

  public getVersion = async (): Promise<LogseqResponseType<string>> => {
    return await this.catchIssues(async () => await this.getVersionInternal());
  };

  public updateBlock = async (block: LogseqBlockType) => {
    console.log(block.content)
    return await this.baseJson('logseq.Editor.updateBlock', [
      block.uuid,
      block.content,
    ]);
  };
}
