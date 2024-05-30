import { Daily } from './components/Daily';
// import {Journaling} from './components/Journaling';
import { ClipNoteOptions } from './components/ClipNote';
import styles from './Newtab.module.scss';
// let dateTime = new Date()
import { Divider } from '@chakra-ui/react';
import React, { useEffect } from 'react';

import { reflectRenderer } from './components/Reflect';
import { greetingRenderer } from './components/Daily';

async function getBase64ImageJPG(imgUrl, callback) {
  console.log(imgUrl);
  var img = new Image();
  img.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(this, 0, 0);

    // 指定轉換格式為JPG
    var dataURL = canvas.toDataURL('image/jpeg');
    callback(dataURL);
  };
  img.setAttribute('crossOrigin', 'anonymous'); // 需要圖片支持跨域訪問
  img.src = imgUrl;
}

const Newtab = () => {
  const bgRef = React.useRef<HTMLDivElement>(null);
  const [wallPaper, setwallPaper] = React.useState(
    'https://source.unsplash.com/random/400%C3%97400/?travel,starnight,sunshine',
  );
  useEffect(() => {
    chrome.storage.local.get(['cachedImg'], function (result: any) {
      let img = '';
      if (result.cachedImg) {
        img = 'url("' + result.cachedImg + '")';
      } else {
        img = 'url("assets/img/wallpaper.jpg")';
      }
      if (bgRef.current) {
        bgRef.current.style.backgroundImage = img;
        // }
      }
    });
    getBase64ImageJPG(wallPaper, (base64Image: string) => {
      chrome.storage.local.set({ cachedImg: base64Image }, function () {});
    });
  }, []);
  return (
    <>
      <div className={styles.fullscreenBg} ref={bgRef}></div>
      {greetingRenderer()}
      <Daily />
      {reflectRenderer()}
    </>
  );
};

export default Newtab;
