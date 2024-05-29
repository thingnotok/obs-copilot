import { createGlobalStyle } from 'styled-components';
import { LogseqBlockType, LogseqPageIdenity } from '../../../types/logseqBlock';
import React, { useEffect } from 'react';
import styles from '../Newtab.module.scss';
import { Prompts, CATEGORIES } from './Journaling';
import {
  Flex,
  Container,
  Heading,
  Text,
  Link,
  Divider,
} from '@chakra-ui/react';

// import chrome;
import {
  getLogseqCopliotConfig,
  saveLogseqCopliotConfig,
  LogseqCopliotConfig,
} from '@/config';
import LogseqClient from '@pages/logseq/client';
import { IconRefresh } from '@tabler/icons-react';
const client = new LogseqClient();

const checkConnection = async (): Promise<boolean> => {
  const resp = await client.getVersion();
  const connectStatus = resp.msg === 'success';
  return connectStatus;
};

async function replaceRef(raw) {
  const regex = /\(\((.*?)\)\)/g;
  let parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    const textBeforeMatch = raw.substring(lastIndex, match.index);
    if (textBeforeMatch) {
      parts.push(textBeforeMatch);
    }
    const refUuid = match[1];
    if (refUuid) {
      let content = (await client.getBlockViaUuid(refUuid)).content;
      content = content.replace(/id:: .{36}/g, '').trim();
      if (content) {
        parts.push(`<<ref:::graph/Mars?block-id=${refUuid}:::${content}>>`);
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex !== raw.length) {
    parts.push(raw.substring(lastIndex));
  }
  return parts.join('');
}

function replaceRefBrac(raw) {
  const regex = /\[\[(.*?)\]\]/g;
  let parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    const textBeforeMatch = raw.substring(lastIndex, match.index);
    if (textBeforeMatch) {
      parts.push(textBeforeMatch);
    }
    const pageName = match[1];
    if (pageName) {
      parts.push(`<<ref:::graph/Mars?page=${pageName}:::[[${pageName}]]>>`);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex !== raw.length) {
    parts.push(raw.substring(lastIndex));
  }
  return parts.join('');
}
function replaceRefTag(raw) {
  const regex = /#(.*?) /g;
  let parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    const textBeforeMatch = raw.substring(lastIndex, match.index);
    if (textBeforeMatch) {
      parts.push(textBeforeMatch);
    }
    const pageName = match[1];
    if (pageName) {
      parts.push(`<<ref:::graph/Mars?page=${pageName}:::#${pageName} >>`);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex !== raw.length) {
    parts.push(raw.substring(lastIndex));
  }
  return parts.join('');
}

function replaceTimeWithBold(heading) {
  // console.log('head');
  // console.log(heading);
  // 從字符串中提取子字符串
  const timeSubstring = heading.slice(0, 5);

  // 正則表達式來檢查時間格式 hh:mm
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  // 檢查是否匹配時間格式
  if (timePattern.test(timeSubstring)) {
    // 替換時間格式為加粗的時間並返回
    return `<<time:::${timeSubstring}>>` + heading.slice(5);
  }
  // 如果不匹配，返回原始字符串
  return heading;
}
function replaceTaskStatus(heading) {
  // console.log('head');
  // console.log(heading);
  const taskStatus = ['TODO', 'DONE'];
  let content = heading;
  taskStatus.forEach((status) => {
    const statusPattern = new RegExp(status, 'g');
    content = content.replace(statusPattern, `<<${status}>>`);
  });
  return content;
}

async function convertNodeToJSX(node, depth = 0) {
  let content = node.content;
  const nodeUuid = node.uuid;
  let content_ = await replaceRef(content);
  //get if time:
  content_ = replaceTimeWithBold(content_);
  content_ = replaceTaskStatus(content_);
  content_ = replaceRefBrac(content_);
  content_ = replaceRefTag(content_);
  // console.log(content_ref_time);

  const tokenReplacements = {
    TODO: () => <div className={styles.tokenTODO}>TODO</div>,
    DONE: () => <div className={styles.tokenDONE}>DONE</div>,
    DOING: () => <div className={styles.tokenDOING}>DOING</div>,
    time: (content) => <div className={styles.tokenTime}>{content}</div>,
    ref: (uuid, content) => {
      return (
        <a className={styles.tokenRef} href={`logseq://${uuid}`}>
          {content}
        </a>
      );
    },
  };

  const processString = (str) => {
    // 使用正則表達式分割字串
    const parts = str.split(/(<<.*?>>)/).filter((part) => part !== '');

    const jsxArray = parts.map((part) => {
      if (part.startsWith('<<') && part.endsWith('>>')) {
        const content = part.slice(2, -2); // 移除<<和>>
        const [token, ...args] = content.split(':::');
        if (token in tokenReplacements) {
          // 如果找到對應的token，則調用對應函數
          const func = tokenReplacements[token];
          return func(...args);
        } else {
          // 如果沒有找到對應的token，則將原始字串作為JSX元素返回
          return part;
        }
      } else {
        // 對於普通字串，直接作為JSX元素返回
        return part;
      }
    });

    // 將處理後的JSX陣列以<></>包裝後返回
    return <>{jsxArray}</>;
  };
  const replaceJSX = processString(content_);
  let blocks = [
    <Text>
      <div>{replaceJSX}</div>
      <a
        className={styles.dailyP}
        href={`logseq://graph/Mars?block-id=${nodeUuid}`}
      >
        🚪
      </a>
    </Text>,
  ];

  if (node.children && node.children.length > 0) {
    const childrenJSX = await Promise.all(
      node.children.map((child) => convertNodeToJSX(child, depth + 1)),
    );
    const flattened_array = childrenJSX.flat();
    const k = flattened_array.map((v) => {
      return <div className={styles.e1}>{v}</div>;
    });
    blocks = [...blocks, ...k];
  }
  return blocks;
}

// convertNodeArrayToJSX 函數保持不變

async function convertNodeArrayToJSX(inputArray: any[]) {
  const jsxArray = await Promise.all(
    inputArray.map(async (input: any, index: any) => {
      const convertedInput = await convertNodeToJSX(input);
      return convertedInput;
    }),
  );
  const flat = jsxArray.flat();
  // 使用 <div> 将所有 jsxArray 的元素包裹起来
  return (
    <>
      {flat.map((element, index) => (
        <div>{element}</div>
      ))}
    </>
  );
}

function getCurrentDateFormatted() {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const monthsOfYear = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const now = new Date();

  const dayOfWeek = daysOfWeek[now.getDay()];
  const month = monthsOfYear[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();

  return `${dayOfWeek} ${month} ${day}, ${year}`;
}

// function getCurrentTimeFormatted() {
//   const now = new Date();

//   const hours = now.getHours().toString().padStart(2, '0');
//   const minutes = now.getMinutes().toString().padStart(2, '0');

//   return `${hours}:${minutes}`;
// }

function getCurrentTimeList(modes='hh:mm') {
  const now = new Date();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const hours =  now.getHours().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  if(modes==='hh:mm:ss')
    return [hours, minutes, seconds].join(":")
  else if(modes==='ss')
    return seconds
  else
    return [hours, minutes].join(":");
}

function Clock() {
  // 使用useState鉤子來創建一個狀態變量currentTime，用於存儲當前的時間
  const [currentTime, setCurrentTime] = React.useState(getCurrentTimeList('hh:mm'));
  const [currentSec, setCurrentSec] = React.useState(':'+getCurrentTimeList('ss'));

  // 使用useEffect鉤子來處理側效，即定時更新currentTime
  useEffect(() => {
    // 設置定時器，每秒更新一次時間
    const timerId = setInterval(() => {
      const current = getCurrentTimeList('hh:mm:ss')
      setCurrentTime(current.slice(0,5)); // 更新currentTime的值
      setCurrentSec(current.slice(5))
    }, 1000); // 每1000毫秒更新一次，即每秒更新一次

    // 清理函數，當組件卸載時清除定時器
    return () => {
      clearInterval(timerId);
    };
  }, []); // 空依賴數組表示這個效果只在組件掛載時運行一次

  // 渲染顯示當前時間
  return (
    <div className={styles.clock}>
      <Heading>{currentTime}</Heading><Text>{currentSec}</Text>
    </div>
  );
}

// 這個函數用於獲取格式化的當前時間


export default Clock;


async function getBase64ImageJPG(imgUrl, callback) {
  console.log(imgUrl)
  var img = new Image();
  img.onload = function() {
      var canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;

      var ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0);

      // 指定轉換格式為JPG
      var dataURL = canvas.toDataURL("image/jpeg");
      callback(dataURL);
  };
  img.setAttribute('crossOrigin', 'anonymous'); // 需要圖片支持跨域訪問
  img.src = imgUrl;
}

export const Daily = () => {
  const [init, setInit] = React.useState(false);
  const [logseqConfig, setLogseqConfig] = React.useState<LogseqCopliotConfig>();
  const [todayPage, setTodayPage] = React.useState<LogseqPageIdenity>({
    name: '',
    id: 0,
    uuid: '',
    originalName: '',
  });
  const [inputEntryType, setInputEntryType] = React.useState('LIST');
  const [inputEntryValue, setInputEntryValue] = React.useState('');
  const [todayContent, setTodayContent] = React.useState<JSX.Element>();
  const [graphName, setGraphName] = React.useState('');
  const [userName, setUserName] = React.useState('---');
  const [wallPaper, setwallPaper] = React.useState('https://source.unsplash.com/random/400%C3%97400/?travel,starnight,sunshine');
  // Journaling
  const [promptCat, setPromptCat] = React.useState('0');
  const [promptId, setPromptId] = React.useState('10');
  const [jinit, setJInit] = React.useState(true);
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef(null);
  const hiddenDivRef = React.useRef(null);
  const dailyRef = React.useRef(null);
  const bgRef = React.useRef(null);
  const [tavalue, setTavalue] = React.useState('');

  const toggleInputEntryType = () =>{
    if (inputEntryType == 'LIST') setInputEntryType('TODO');
    else setInputEntryType('LIST');
  }
  // input from daily panel
  const inputFromDailyPanel = async (event) => {
    // 如果按下的是Enter鍵，但不是Shift + Enter組合
    // if (event.key === 'Enter' && !event.shiftKey) {
      if (event.key === 'Enter' && !event.shiftKey  && !event.nativeEvent.isComposing) {

      if (event.metaKey) {
        // 如果同時按下了metaKey（Mac上的Command鍵，Windows上的Windows鍵）
        toggleInputEntryType();
      } else {
        // 按下Enter但沒有按Shift或metaKey
        const prefix = inputEntryType === "TODO" ? "TODO " : "";
        const cc = prefix + `${getCurrentTimeList()} ${event.target.value}`;
        const resp = await client.appendBlock(todayPage.uuid, cc);
        setInputEntryValue(''); // 清空輸入框
        updateJournal(todayPage); // 更新日誌（這裡假設你已經有相應的函數處理日誌更新）
      }
    }
    // 如果是Shift + Enter組合，這裡什麼也不做
  };
  const inputEntryUpdate = (event) => {
    setInputEntryValue(event.target.value); // 更新狀態以反映輸入框內的變化
  };

  const updatePrompt = () => {
    // console.log('next');
    // setJInit(true);
    const randomCat = Math.floor(Math.random() * 4);
      const bags = CATEGORIES[`${randomCat}`].promptIds;
      const randomIndex = Math.floor(Math.random() * bags.length);
      const promptId = bags[randomIndex];
      setPromptCat(randomCat);
      setPromptId(promptId);
  };
  const updateJournal = async (_todaypage: LogseqPageIdenity) => {
    const tree = await client.getPageBlocksTree(_todaypage);
    convertNodeArrayToJSX(tree).then((contents) => {
      setTodayContent(contents);
    });
  };
  const writeDown = async (line: any) => {
    const cc = `${getCurrentTimeList()} #${CATEGORIES[promptCat].name} ${
      Prompts[promptId].prompt
    }`;
    const resp = await client.appendBlock(todayPage.uuid, cc);
    // console.log(resp)
    await client.appendBlock(resp.uuid, line);
    textareaRef.current.rows = 1;
    updatePrompt();
    await updateJournal(todayPage);
    setTavalue('');
    setValue('');
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.metaKey && !event.shiftKey && !event.nativeEvent.isComposing) {
      writeDown(event.target.value);
    } else if (event.key === 'Enter' && event.metaKey && !event.nativeEvent.isComposing) {
      updatePrompt();
    }
  };
  
  const handleChange = (e: { target: { value: any } }) => {
    // console.log('input');
    // console.log({ a: e.target.value });
    let value = e.target.value;
    setTavalue(value);
    if (value.slice(-1) == '\n') value = value + 'a';
    // console.log({ a: value });
    setValue(value);
  };
  const updateRows = () => {
    if (hiddenDivRef.current && textareaRef.current) {
      const divHeight = hiddenDivRef.current.offsetHeight;
      // console.log(divHeight);
      const newRows = divHeight < 30 ? 1 : Math.ceil(divHeight / 30);
      // console.log(newRows);
      textareaRef.current.rows = newRows>4?4:newRows;
    } else {
      textareaRef.current.rows = 1;
    }
  };
  useEffect(() => {
    if (!init) {
      updatePrompt();
      getLogseqCopliotConfig().then((config) => {
        setLogseqConfig(config);
        setInit(true);
        if (config.logseqAuthToken === '') {
          console.log("Failed")
          return;
        }
        const promise = new Promise(async () => {
          const connectionStatus = await checkConnection();
          if(connectionStatus) {
            setUserName(config.userName)
            setwallPaper(config.wallPaper)
            const _todaypage = await client.getJournalToday();
            setTodayPage(_todaypage);
            await updateJournal(_todaypage);
          }
          else
          setUserName("Connection Failed")
        });
        promise.then(console.log).catch(console.error);
      });
      if(bgRef.current){
        chrome.storage.local.get(['cachedImg'], function(result) {
        bgRef.current.style.backgroundImage = 'url("' + result.cachedImg + '")';
        getBase64ImageJPG(wallPaper, (base64Image)=>{
        chrome.storage.local.set({"cachedImg": base64Image}, function() {
          });
        })
        console.log('Set cached')
        // }
      });
    }
    }
    // move to bottom
    if (dailyRef.current) {
      dailyRef.current.scrollTop = dailyRef.current.scrollHeight;
    }
    updateRows();
    window.addEventListener('resize', updateRows);
    return () => {
      window.removeEventListener('resize', updateRows);
    };
  }, [value, todayContent, todayPage, jinit, tavalue]);

  const greetingRenderer = () => {
    const e = new Date().getHours();
    const g =
      e > 3 && e < 12
        ? 'Good morning, '
        : e >= 12 && e < 18
        ? 'Good afternoon, '
        : 'Good evening, ';
    return (
      <div className={styles.greet}>
        <Heading>
          {g}
          {userName}
        </Heading>
        <Text>{getCurrentDateFormatted()}</Text>
      </div>
    );
  };
  const dailyPanelRenderer = () => {
    return (
      // <Flex direction={'column'} w="80vw">
      <div className={styles.dailyContainer}>
        <a href={`logseq://graph/Mars?page=${todayPage.name}`}>
          <h2>{getCurrentDateFormatted()}</h2>
        </a>
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
          <textarea rows={1} onChange={inputEntryUpdate} onKeyDown={inputFromDailyPanel} value={inputEntryValue} />
        </div>
      </div>
    );
  };
  const reflectRenderer = () => {
    return (
      <div className={styles.mainPanel}>
        {Clock()}
        <div className={styles.journaling}>
          <Heading>
            {'#' + CATEGORIES[promptCat].name + ' '}
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
  return (
    <>
      <div className={styles.fullscreenBg} ref={bgRef}></div>
      {greetingRenderer()}
      {dailyPanelRenderer()}
      {reflectRenderer()}
    </>
  );
};
