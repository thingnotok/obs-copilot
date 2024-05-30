import React, { useEffect, useState } from 'react';
import Browser from 'webextension-polyfill';
import styles from '../Newtab.module.scss';
import { Prompts, CATEGORIES } from './Journaling';
import { Heading, Text } from '@chakra-ui/react';
import { IconRefresh } from '@tabler/icons-react';
import {
  getLogseqCopliotConfig,
  saveLogseqCopliotConfig,
  LogseqCopliotConfig,
} from '@/config';

import { client } from '@pages/logseq/client';
import {
  getToday,
  getCurrentTimeList,
  getCurrentDateDay,
} from '@pages/newtab/components/Utils';

interface Node {
  text: string;
  level: number;
  children: Node[];
  parent?: Node | null;
}

function treeToMarkdown(node: Node): string {
  let markdown = '';

  function traverse(node: Node, level: number) {
    if (level < 0) {
      markdown = '';
    } else {
      const tabs = '\t'.repeat(level);
      markdown += `${tabs}${node.text}\n`;
    }
    for (const child of node.children) {
      traverse(child, level + 1);
    }
  }
  traverse(node, -1); // start with level -1 because root node doesn't need a tab
  return markdown.slice(0, -1);
}

function createTree(markdown: string): Node {
  const lines = markdown.split('\n');
  const root: Node = { children: [], level: -1, text: '', parent: null };
  let currentParent: Node = root;

  for (const line of lines) {
    const level = line.lastIndexOf('\t') + 1;
    const node: Node = {
      level,
      text: line.trim(),
      children: [],
      parent: currentParent,
    };

    if (level === currentParent.level + 1) {
      currentParent.children.push(node);
    } else {
      let parent = currentParent;
      while (level <= parent.level && parent.parent) {
        parent = parent.parent;
      }
      parent.children.push(node);
      node.parent = parent;
    }

    currentParent = node;
  }

  return root;
}

const TaskRenderer = ({
  node,
  tree,
  update,
  onDoubleClick,
}: {
  node: Node;
  tree: Node;
  update: () => void;
  onDoubleClick: () => void;
}) => {
  // const [isChecked, setIsChecked] = useState(false);
  let text = node.text;
  let isChecked = false;
  if (text.startsWith('- [ ]')) {
    text = text.slice(6);
    isChecked = false;
    // setIsChecked(false);
  } else {
    text = text.slice(6);
    isChecked = true;
    // setIsChecked(true);
  }
  const task = (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0px' }}>
      <input
        type="checkbox"
        style={{ margin: '3px' }}
        checked={isChecked}
        onChange={() => {
          isChecked = !isChecked;
          console.log('ischeked', isChecked);
          if (isChecked) node.text = '- [x] ' + text;
          else node.text = '- [ ] ' + text;
          const txt = treeToMarkdown(tree);
          client.update(`journals/${getToday()}.md`, txt).catch((error) => {
            console.error('Error in client.update:', error);
          });
          console.log(txt);
          update();
        }}
      />
      <span onDoubleClick={onDoubleClick}>{text}</span>
    </div>
  );
  return task;
};

const LineRenderer = ({
  node,
  tree,
  update,
}: {
  node: Node;
  tree: Node;
  update: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(node.text);
  const inputFromDailyPanel = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    // 如果按下的是Enter鍵，但不是Shift + Enter組合
    // if (event.key === 'Enter' && !event.shiftKey) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      // 按下Enter但沒有按Shift或metaKey
      event.preventDefault();
      setIsEditing(false);
      console.log(treeToMarkdown(tree));
      client.update(`journals/${getToday()}.md`, treeToMarkdown(tree));
      update();
    }
  };
  const text = node.text;
  let display;
  if (text.startsWith('- [ ]') || text.startsWith('- [x]')) {
    display = (
      <TaskRenderer
        node={node}
        tree={tree}
        update={update}
        onDoubleClick={() => setIsEditing(true)}
      />
    );
  } else if (text.startsWith('- ')) {
    display = <span onDoubleClick={() => setIsEditing(true)}>{textValue}</span>;
  }
  return isEditing ? (
    <textarea
      value={textValue}
      style={{ width: '100%', color: 'black' }}
      onKeyDown={inputFromDailyPanel}
      onChange={(e) => {
        setTextValue(e.target.value);
        node.text = e.target.value;
      }}
    />
  ) : (
    <>{display}</>
  );
};

const MarkdownRenderer = ({
  markdown,
  update,
}: {
  markdown: string;
  update: () => void;
}) => {
  const tree = createTree(markdown);

  const renderNode = (node: Node): JSX.Element => {
    const jsx = [];
    for (const child of node.children) {
      jsx.push(renderNode(child));
    }
    jsx.unshift(<LineRenderer node={node} tree={tree} update={update} />);
    if (node.level < 0) return <>{jsx}</>;
    else if (node.level === 0)
      return (
        <div
          className={styles.card}
          style={{
            marginLeft: '0px',
            backgroundColor: 'rgba(90, 90, 90, 0.6)',
          }}
        >
          {jsx}
        </div>
      );
    else return <div className={styles.card}>{jsx}</div>;
  };
  const c = renderNode(tree);
  return <>{c}</>;
};

const HabitTracker = ({
  habit,
  update,
}: {
  habit: string;
  update: () => void;
}) => {
  const [count, setCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  useEffect(() => {
    async function getHabit() {
      const result = await Browser.storage.local.get([habit, 'updateDate']);
      const today = getToday();
      console.log(result);
      if (result.updateDate !== today || !result[habit]) {
        Browser.storage.local.set({ updateDate: today });
        Browser.storage.local.set({ [habit]: 0 });
        setCount(0);
      } else {
        if (result[habit] >= 100) {
          setIsDisabled(true);
        }
        setCount(result[habit]);
      }
    }
    getHabit();
  }, []);
  const callbackFunction = async () => {
    console.log('Count reached 100!');
    setIsDisabled(true);
    // Add your callback logic here
    const prefix = '- [x] ';
    const content = `${habit} 100 !`;
    const cc = prefix + `${getCurrentTimeList()} ${content}`;
    const a = await client
      .append(`journals/${getToday()}.md`, cc)
      .catch((error) => {
        if (error.response && error.response.status !== 204) {
          console.error('Error in client.append:', error);
        }
      });
    update();
  };

  const handleClick = async (incr: number) => {
    const newCount = count + incr;
    setCount(newCount);
    Browser.storage.local.set({ [habit]: newCount, updateDate: getToday() });
    if (newCount >= 100) {
      await callbackFunction();
    }
  };

  return (
    <div className={styles.habitTracker}>
      <p className={styles.habitText}>
        {habit}: {count}
      </p>
      <div className={styles.habitBtnContainer}>
        <button
          onClick={() => handleClick(-10)}
          disabled={isDisabled}
          className={styles.habitButton}
        >
          -
        </button>
        <button
          onClick={() => handleClick(10)}
          disabled={isDisabled}
          className={styles.habitButton}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default HabitTracker;

export const Daily = () => {
  const [init, setInit] = React.useState(false);
  const [inputEntryType, setInputEntryType] = React.useState('LIST');
  const [inputEntryValue, setInputEntryValue] = React.useState('');
  const [todayContent, setTodayContent] = React.useState<JSX.Element>();

  // Journaling
  const dailyRef = React.useRef<HTMLDivElement>(null);

  const dailyareaRef = React.useRef<HTMLTextAreaElement>(null);
  const toggleInputEntryType = () => {
    if (inputEntryType == 'LIST') setInputEntryType('TODO');
    else setInputEntryType('LIST');
  };
  // input from daily panel
  const inputFromDailyPanel = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    // 如果按下的是Enter鍵，但不是Shift + Enter組合
    // if (event.key === 'Enter' && !event.shiftKey) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      if (event.metaKey) {
        // 如果同時按下了metaKey（Mac上的Command鍵，Windows上的Windows鍵）
        toggleInputEntryType();
      } else {
        // 按下Enter但沒有按Shift或metaKey
        event.preventDefault();
        const prefix = inputEntryType === 'TODO' ? '- [ ] ' : '- ';
        const content = (event.target as HTMLTextAreaElement).value;
        const cc = prefix + `${getCurrentTimeList()} ${content}`;
        client.append(`journals/${getToday()}.md`, cc);
        setInputEntryValue(''); // 清空輸入框
        updateJournal(); // 更新日誌（這裡假設你已經有相應的函數處理日誌更新）
      }
    }
    // 如果是Shift + Enter組合，這裡什麼也不做
  };
  const inputEntryUpdate = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInputEntryValue(event.target.value); // 更新狀態以反映輸入框內的變化
  };

  const updateJournal = async () => {
    console.log('updateJournal');
    const content = await client.baseFetch();
    let data = '';
    if (content.body) {
      const arrayBuffer = await content.arrayBuffer();
      data = new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer));
    } else {
      console.error('content.body is null');
    }
    setTodayContent(
      <div className="dailyContent">
        <MarkdownRenderer markdown={data} update={updateJournal} />
      </div>,
    );
  };
  useEffect(() => {
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
  useEffect(() => {
    if (dailyRef.current) {
      dailyRef.current.scrollTop = dailyRef.current.scrollHeight;
    }
  }, [todayContent]);

  return (
    <>
      <div className={styles.dailyContainer}>
        <a href={`obsidian://open?vault=LiteC-Mars&file=${getToday()}.md`}>
          <h2>{getCurrentDateDay()}</h2>
        </a>
        <div
          style={{
            paddingLeft: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <HabitTracker habit={'Squat'} update={updateJournal} />
          <HabitTracker habit={'PushUp'} update={updateJournal} />
        </div>
        <div className={styles.daily} ref={dailyRef}>
          {todayContent}
        </div>
        <div className={styles.dailyFooter}>
          <div className={styles.leftSpacer}>
            <Text
              className={styles.dailyInputEntry}
              onClick={toggleInputEntryType}
            >
              {inputEntryType}
            </Text>
          </div>
          <textarea
            rows={1}
            ref={dailyareaRef}
            onChange={inputEntryUpdate}
            onKeyDown={inputFromDailyPanel}
            value={inputEntryValue}
          />
        </div>
      </div>
      {reflectRenderer(updateJournal)}
    </>
  );
};

export const greetingRenderer = () => {
  const [init, setInit] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  useEffect(() => {
    if (!init) {
      getLogseqCopliotConfig().then((config) => {
        console.log(config);
        setInit(true);
        setUserName(config?.userName || '');
        console.log('set userName: ', config?.userName);
      });
    }
  }, []);

  const getGreetings = (userName: string): string => {
    const e = new Date().getHours();
    let g = 'Good evening, ';
    if (e > 3 && e < 12) g = 'Good morning, ';
    else if (e >= 12 && e < 18) g = 'Good afternoon, ';
    return g + userName;
  };
  return (
    <div className={styles.greet}>
      <Heading>{getGreetings(userName)}</Heading>
      <Text>{getCurrentDateDay()}</Text>
    </div>
  );
};

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

export const reflectRenderer = (update: () => {}) => {
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
    await update();
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
