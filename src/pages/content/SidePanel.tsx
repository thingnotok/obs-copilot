import React from 'react';
import { LogseqSearchResult } from '@/types/logseqBlock';
import { LogseqResponseType } from '../logseq/client';
import Browser from 'webextension-polyfill';
import styles from './index.module.scss';
import LogseqCopilot from '@components/LogseqCopilot';
type LogseqCopliotProps = {
  connect: Browser.Runtime.Port;
};

export const ObsCopliotSidePanel = ({ connect }: LogseqCopliotProps) => {
  const [msg, setMsg] = React.useState('Loading...');
  const [logseqSearchResult, setLogseqSearchResult] = React.useState<any[]>();

  connect.onMessage.addListener(
    (resp: LogseqResponseType<LogseqSearchResult>) => {
      console.log('onMessage', resp);
      setMsg(resp.msg);
      setLogseqSearchResult(resp.response);
    },
  );

  const goOptionPage = () => {
    Browser.runtime.sendMessage({ type: 'open-options' });
  };

  const statusShower = () => {
    if (msg === 'success') {
      console.log('result', logseqSearchResult);
      const lis = logseqSearchResult.map((element) => {
        const matches = element.matches.map((match: string[]) => {
          const pre = match[0];
          const matchStr = match[1];
          const post = match[2];
          return (
            <div style={{ paddingLeft: '10px', display: 'block' }}>
              <span>{pre}</span>
              <span style={{ backgroundColor: 'orange' }}>{matchStr}</span>
              <span>{post}</span>
            </div>
          );
        });
        return (
          <div className={styles.card}>
            <a href={`obsidian://open?file=${element.filename}`}>
              {' '}
              <span>{element.filename}</span>
            </a>
            {matches}
          </div>
        );
      });
      console.log(lis);
      return (
        <>
          {lis}
          {/* <LogseqCopilot
            graph={logseqSearchResult?.graph || ''}
            blocks={logseqSearchResult?.blocks || []}
            pages={logseqSearchResult?.pages || []}
          /> */}
        </>
      );
    } else if (msg !== 'Loading') {
      return (
        <button className={styles.configIt} onClick={goOptionPage}>
          Config it
        </button>
      );
    }
    return <></>;
  };

  return (
    <div className={styles.copilot}>
      <div className={styles.copilotBody}>{statusShower()}</div>

      {/* <div className={styles.copilotFooter}>
        <span>
          <a href="https://github.com/EINDEX/logseq-copilot/issues">Feedback</a>
        </span>
        <span>
          power by{' '}
          <a href="https://logseq-copilot.eindex.me/">Logseq Copliot</a>
        </span>
      </div> */}
    </div>
  );
};
