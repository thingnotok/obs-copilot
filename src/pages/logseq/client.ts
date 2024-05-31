export default class ObsidianClient {
  apiKey = '';
  url = '';
  port = 0;
  public baseFetch = async () => {
    const text = `https://${this.url}:${this.port}`;
    console.log(text);
    const endPoint = new URL(`http://${this.url}:${this.port}`);
    const apiUrl = new URL(`${endPoint.origin}/periodic/daily/`);
    const resp = await fetch(apiUrl, {
      mode: 'cors',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'text/markdown',
      },
    });

    if (resp.status !== 200) {
      throw resp;
    }

    return resp;
  };
  public fetch = async (path: string) => {
    console.log('client fetch', this);
    const text = `https://${this.url}:${this.port}`;
    console.log(text);
    const endPoint = new URL(`http://${this.url}:${this.port}`);
    const apiUrl = new URL(`${endPoint.origin}/vault/${path}`);
    const resp = await fetch(apiUrl, {
      mode: 'cors',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'text/markdown',
      },
    });

    if (resp.status !== 200) {
      throw resp;
    }

    return resp;
  };
  public append = async (dst: string, content: string) => {
    const endPoint = new URL(`http://${this.url}:${this.port}`);
    const apiUrl = new URL(`${endPoint.origin}/vault/${dst}`);
    const resp = await fetch(apiUrl, {
      mode: 'cors',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'text/markdown',
        accept: '*/*',
      },
      body: content,
    });

    if (resp.status !== 204) {
      throw resp;
    }

    return resp;
  };
  public update = async (dst: string, content: string) => {
    console.log(content);
    const endPoint = new URL(`http://${this.url}:${this.port}`);
    const apiUrl = new URL(`${endPoint.origin}/vault/${dst}`);
    const resp = await fetch(apiUrl, {
      mode: 'cors',
      method: 'PUT',
      headers: {
        Authorization: `Bearer 114768ffdfe091540af89adbfc45d9a03bb88b50d8dda5c783c87d6dd10b2be8`,
        'Content-Type': 'text/markdown',
        accept: '*/*',
      },
      body: content,
    });

    if (resp.status !== 204) {
      throw resp;
    }

    return resp;
  };
  public search = async (query: string) => {
    console.log('client search', query);
    const endPoint = new URL(`http://${this.url}:${this.port}`);
    const apiUrl = new URL(`${endPoint.origin}/search/simple/?query=${query}`);
    const resp = await fetch(apiUrl, {
      mode: 'cors',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json',
      },
    });

    if (resp.status !== 200) {
      throw resp;
    }

    return resp;
  };
}
