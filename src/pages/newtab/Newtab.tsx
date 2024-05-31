import { Daily } from './components/Daily';
import styles from './Newtab.module.scss';
import Browser from 'webextension-polyfill';
// let dateTime = new Date()
import { Divider } from '@chakra-ui/react';
import React, { useEffect } from 'react';

import { greetingRenderer } from './components/Daily';

import {
  getObsCopilotConfig,
  saveObsCopilotConfig,
  ObsCopilotConfig,
} from '@/config';

async function getBase64ImageJPG(
  imgUrl: string,
  callback: (base64: string) => void,
) {
  console.log('Get base64 image: ', imgUrl);
  var img = new Image();
  img.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this as HTMLImageElement, 0, 0); // Cast 'this' to HTMLImageElement
      var base64 = canvas.toDataURL('image/jpeg');
      callback(base64);
    }
  };
  img.setAttribute('crossOrigin', 'anonymous'); // 需要圖片支持跨域訪問
  img.src = imgUrl;
}

const Newtab = () => {
  const bgRef = React.useRef<HTMLDivElement>(null);
  const [init, setInit] = React.useState(false);
  useEffect(() => {
    const fetchImage = async (wallPaperUrl: string) => {
      const result = await Browser.storage.local.get(['cachedImg']);
      let img = '';
      if (result.cachedImg) {
        img = 'url("' + result.cachedImg + '")';
      } else {
        getBase64ImageJPG(wallPaperUrl, (base64Image: string) => {
          if (bgRef.current) {
            bgRef.current.style.backgroundImage = base64Image;
          }
        });
      }
      if (bgRef.current) {
        bgRef.current.style.backgroundImage = img;
      }

      getBase64ImageJPG(wallPaperUrl, (base64Image: string) => {
        if (bgRef.current) {
          bgRef.current.style.backgroundImage = base64Image;
        }
        Browser.storage.local.set({ cachedImg: base64Image });
      });
    };
    console.log('init: ', init);
    if (!init) {
      getObsCopilotConfig().then((config) => {
        setInit(true);
        fetchImage(config?.wallPaper);
      });
    }
  }, []);

  return (
    <>
      <div className={styles.fullscreenBg} ref={bgRef}></div>
      {greetingRenderer()}
      <Daily />
    </>
  );
};

export default Newtab;
