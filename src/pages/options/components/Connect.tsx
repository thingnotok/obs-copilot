import {
  Heading,
  Grid,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Link,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';

import {
  getObsCopilotConfig,
  saveObsCopilotConfig,
  ObsCopilotConfig,
} from '@/config';
import LogseqClient from '@pages/logseq/client';

const client = new LogseqClient();

export const ObsidianConnectOptions = () => {
  const [init, setInit] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [connected, setConnected] = React.useState(false);
  const [buttonMessage, setButtonMessage] = React.useState('Save');
  const [showToken, setShowToken] = React.useState(false);
  const [obsConfig, setObsConfig] = React.useState<ObsCopilotConfig>();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('onChange', e.target.name, e.target.value);
    setObsConfig({
      ...obsConfig,
      [e.target.name]: e.target.value,
    });
  };

  const changeLogseqPort = (port: string) => {
    if (port === '' || parseInt(port) < 0) {
      port = '0';
    }
    setObsConfig({
      ...obsConfig,
      Port: parseInt(port),
    });
  };

  const triggerShowToken = () => setShowToken(!showToken);

  const save = () => {
    try {
      // new URL(logseqConfig!.logseqHost);
    } catch (error) {
      setConnected(false);
      setButtonMessage('Logseq Host is not a URL!');
      return;
    }

    const promise = new Promise(async () => {
      await saveObsCopilotConfig({
        AuthToken: obsConfig!.AuthToken,
        HostName: obsConfig?.HostName,
        Port: obsConfig?.Port,
        userName: obsConfig?.userName || 'Empty User',
        wallPaper:
          obsConfig?.wallPaper ||
          'https://source.unsplash.com/random/400%C3%97400/?travel,starnight,sunshine',
        vaultName: obsConfig?.vaultName || 'Empty Vault',
      });
    });
    promise.then(console.log).catch(console.error);
  };

  useEffect(() => {
    if (!init) {
      getObsCopilotConfig().then((config) => {
        console.log('config', config);
        setObsConfig(config);
        setInit(true);
        if (config.AuthToken === '') {
          setLoading(false);
          return;
        }
      });
    }
  });

  return (
    <>
      <Heading size={'lg'}>Obsidian Connect</Heading>
      <Grid
        gridTemplateColumns={'1fr 1fr 1fr'}
        alignItems={'center'}
        rowGap={2}
        columnGap={2}
      >
        <Text gridColumn={'1 / span 2'} fontSize="sm">
          Host
        </Text>
        <Text fontSize="sm">Port (1 ~ 65535)</Text>
        <Input
          gridColumn={'1 / span 2'}
          name="logseqHostName"
          placeholder="Obsidian Host Name"
          onChange={onChange}
          value={obsConfig?.HostName}
        />
        <NumberInput
          max={65535}
          min={1}
          name="Port"
          placeholder="Obsidian Host Port"
          onChange={changeLogseqPort}
          value={obsConfig?.Port}
        >
          <NumberInputField />
        </NumberInput>
        <Text fontSize="sm">Authorization Token</Text>
        <InputGroup gridColumn={'1 / span 3'}>
          <Input
            name="AuthToken"
            type={showToken ? 'text' : 'password'}
            onChange={onChange}
            value={obsConfig?.AuthToken}
            placeholder="API Key"
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={triggerShowToken}>
              {showToken ? 'Hide' : 'Show'}
            </Button>
          </InputRightElement>
        </InputGroup>
      </Grid>
      <Input
        name="vaultName"
        type={'text'}
        onChange={onChange}
        value={obsConfig?.vaultName}
        placeholder="Vault name"
      />
      <Input
        name="userName"
        type={'text'}
        onChange={onChange}
        value={obsConfig?.userName}
        placeholder="your name"
      />
      <Input
        name="wallPaper"
        type={'text'}
        onChange={onChange}
        value={obsConfig?.wallPaper}
        placeholder="unsplash image/category url"
      />
      <Button gridColumn={'1 / span 3'} onClick={save} variant="outline">
        {buttonMessage}
      </Button>
    </>
  );
};
