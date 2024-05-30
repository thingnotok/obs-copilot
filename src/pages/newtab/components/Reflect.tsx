import styles from '../Newtab.module.scss';
import React, { useEffect } from 'react';
import { Prompts, CATEGORIES } from './Journaling';
import { IconRefresh } from '@tabler/icons-react';
import {
  Flex,
  Container,
  Heading,
  Text,
  Link,
  Divider,
} from '@chakra-ui/react';
import client from '@pages/logseq/client';

import { getCurrentTimeList, getToday } from './Utils';

const Clock = () => {
  // 使用useState鉤子來創建一個狀態變量currentTime，用於存儲當前的時間
  const [currentTime, setCurrentTime] = React.useState(
    getCurrentTimeList('hh:mm'),
  );
  const [currentSec, setCurrentSec] = React.useState(
    ':' + getCurrentTimeList('ss'),
  );

  // 使用useEffect鉤子來處理側效，即定時更新currentTime
  useEffect(() => {
    // 設置定時器，每秒更新一次時間
    const timerId = setInterval(() => {
      const current = getCurrentTimeList('hh:mm:ss');
      setCurrentTime(current.slice(0, 5)); // 更新currentTime的值
      setCurrentSec(current.slice(5));
    }, 1000); // 每1000毫秒更新一次，即每秒更新一次

    // 清理函數，當組件卸載時清除定時器
    return () => {
      clearInterval(timerId);
    };
  }, []); // 空依賴數組表示這個效果只在組件掛載時運行一次

  // 渲染顯示當前時間
  return (
    <div className={styles.clock}>
      <Heading>{currentTime}</Heading>
      <Text>{currentSec}</Text>
    </div>
  );
};

export const reflectRenderer = () => {
  const [promptCat, setPromptCat] = React.useState(0);
  const [promptId, setPromptId] = React.useState(10);
  const [tavalue, setTavalue] = React.useState('');
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const hiddenDivRef = React.useRef<HTMLDivElement>(null);
  const updatePrompt = () => {
    console.log('update Prompt');
    const randomCat = Math.floor(Math.random() * 4);
    const bags = CATEGORIES[`${randomCat}`].promptIds;
    const randomIndex = Math.floor(Math.random() * bags.length);
    const promptId = bags[randomIndex];
    setPromptCat(randomCat);
    setPromptId(promptId);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      console.log('before write down');
      writeDown(event.target.value);
    } else if (event.key === 'Enter' && event.metaKey) {
      updatePrompt();
    }
  };

  const handleChange = (e: { target: { value: any } }) => {
    let value = e.target.value;
    setTavalue(value);
    if (value.slice(-1) == '\n') value = value + 'a';
    setValue(value);
  };

  const writeDown = async (line: any) => {
    console.log('write down');
    const cc = `- ${getCurrentTimeList()} #${CATEGORIES[promptCat].name} ${
      Prompts[promptId].prompt
    }`;
    client.append(`journals/${getToday()}.md`, cc);
    client.append(`journals/${getToday()}.md`, `\t - ${line}`);
    textareaRef.current.rows = 1;
    updatePrompt();
    await updateJournal();
    setValue('');
  };

  const updateRows = () => {
    if (hiddenDivRef.current && textareaRef.current) {
      const divHeight = hiddenDivRef.current.offsetHeight;
      // console.log(divHeight);
      const newRows = divHeight < 30 ? 1 : Math.ceil(divHeight / 30);
      // console.log(newRows);
      textareaRef.current.rows = newRows > 4 ? 4 : newRows;
    } else {
      textareaRef.current.rows = 1;
    }
  };

  useEffect(() => {
    updatePrompt();
    if (!init) {
      getLogseqCopliotConfig().then((config) => {
        console.log(config);
        setInit(true);
        client.apiKey = config?.logseqAuthToken || '';
        client.url = config?.logseqHostName || '';
        client.port = config?.logseqPort || 0;
        console.log(client);
        updateJournal();
      });
    }
  }, []);
  return (
    <div className={styles.mainPanel}>
      {Clock()}
      <div className={styles.journaling}>
        <Heading>
          {`#R${CATEGORIES[promptCat].name} `}
          {Prompts[promptId].prompt}
          <IconRefresh size={16} onClick={updatePrompt} />
        </Heading>
        <textarea
          ref={textareaRef}
          rows={1}
          value={tavalue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <div ref={hiddenDivRef} className={styles.calcDiv}>
          {value}
        </div>
      </div>
    </div>
  );
};
