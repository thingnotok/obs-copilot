import { LogseqBlockType } from '../../types/logseqBlock';
import ObsidianClient from './client';
import { renderBlock } from './tool';
import { getObsCopilotConfig } from '../../config';
export default class LogseqService {
  private client: ObsidianClient = new ObsidianClient();

  public async getConfig() {
    console.log('getConfig');
  }

  public async search(query: string) {
    console.log('search', query);
    const config = await getObsCopilotConfig();
    console.log('config', config);
    this.client.apiKey = config?.AuthToken || '';
    this.client.url = config?.HostName || '';
    this.client.port = config?.Port || 0;
    console.log('client', this.client);
    const result = await this.client.search(query);
    const resultJson = await result.json();
    const resultP = await Promise.all(
      resultJson.map(async (element: any) => {
        const c = await this.client.fetch(element.filename);
        let data = '';
        if (c.body) {
          const arrayBuffer = await c.arrayBuffer();
          data = new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer));
        } else {
          console.error('content.body is null');
        }
        element.data = data;
        element.matches = await Promise.all(
          element.matches.map(async (match: any) => {
            const m = match.match;
            const startLineIndex = data.lastIndexOf('\n', m.start);
            const endLineIndex = data.indexOf('\n', m.end);
            return [
              data.slice(startLineIndex + 1, m.start),
              data.slice(m.start, m.end),
              data.slice(m.end, endLineIndex - 1),
            ];
            // console.log(data);
          }),
        );
        return element;
      }),
    );
    console.log('resultP', resultP);
    // }

    // result.blocks = await Promise.all(
    //   result.blocks.map(async (block) => {
    //     return await this.getBlock(block['block/uuid'], graph.name, query);
    //   }),
    // );
    // result.pages = await Promise.all(
    //   result.pages.map(async (page: string) => {
    //     return await this.logseqClient.getPage({
    //       name: page,
    //     });
    //   }),
    // );

    // result.graph = graph.name;
    // result.count = result.blocks.length + result.pages.length;

    return {
      msg: 'success',
      status: 200,
      response: resultP,
    };
  }

  public async getBlock(
    blockUuid: string,
    graph: string,
    query?: string,
    includeChildren: boolean = false,
  ) {
    console.log('getBlock', blockUuid, graph, query, includeChildren);
    //   const block = await this.logseqClient.getBlockViaUuid(blockUuid, {
    //     includeChildren,
    //   });
    //   block.page = await this.logseqClient.getPage(block.page);
    // return renderBlock(block, graph, query);
  }

  public async urlSearch(url: URL, opt: { fuzzy: boolean } = { fuzzy: false }) {
    //   const graph = await this.getGraph();
    //   const blockUuidSet = new Set();
    //   const blocks: LogseqBlockType[] = [];

    //   const blockAdd = (block: LogseqBlockType) => {
    //     if (blockUuidSet.has(block.uuid)) {
    //       return;
    //     }
    //     blockUuidSet.add(block.uuid);
    //     blocks.push(block);
    //   };

    // const find = async (url: string) => {
    //   const results = await this.logseqClient.find(url);
    //   results.forEach(blockAdd);
    // };

    //   if (url.hash) {
    //     await find(url.host + url.pathname + url.search + url.hash);
    //   }
    //   if (url.search) {
    //     await find(url.host + url.pathname + url.search);
    //   }

    //   if (url.pathname) {
    //     await find(url.host + url.pathname);
    //   }

    //   const count = blocks.length;

    //   if (url.host && opt.fuzzy) {
    //     await find(url.host);
    //   }

    return {
      status: 200,
      msg: 'success',
      // response: {
      //   blocks: blocks.map((block) => {
      //     return renderBlock(block, graph.name, url.href);
      //   }),
      //   graph: graph.name,
      // },
      // count: count,
    };
  }
}
