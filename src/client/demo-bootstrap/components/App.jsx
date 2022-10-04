import React, { useState, useEffect } from 'react';
import { Container, Row, Button, Alert, Spinner } from 'react-bootstrap';
import { CSSTransition } from 'react-transition-group';

// This is a wrapper for google.script.run that lets us use promises.
import { serverFunctions } from '../../utils/serverFunctions';

import '../styles.css';

const App = () => {
  const [theToken, setToken] = useState();
  const [errMsg, setErrMsg] = useState();
  const [infoMsg, setInfoMsg] = useState();
  const [isShownErrorModal, setErrorModalShow] = useState(false);
  const [isShownInfoModal, setInfoModalShow] = useState(false);
  const [isSpinnerVisible, setSpinnerVisiable] = useState(false);

  useEffect(() => {
    serverFunctions.getConfig('lineToken')
      .then(setToken)
      .catch(showErrorModal);
  }, []);

  const saveTokenAsync = async () => {
    let element = document.getElementById('token');
    return serverFunctions.setConfig('lineToken', element.value)
      .then(() => {
        setToken(element.value);
        element.value = '';
      })
      .catch(showErrorModal);
  }

  const getSpinnerHandler = (asyncFunction) => {
    return () => {
      closeInfoModal();
      closeErrorModal();
      setSpinnerVisiable(true);
      asyncFunction()
        .finally(() => setSpinnerVisiable(false));
    };
  }

  const ErrorModal = () => {
    return (
      <CSSTransition classNames='alert' in={isShownErrorModal} timeout={500} unmountOnExit>
        <Alert variant='danger' dismissible onClose={closeErrorModal}>
          <Alert.Heading>發生錯誤</Alert.Heading>
          <p>{errMsg}</p>
          <Button variant='danger' onClick={closeErrorModal}>關閉</Button>
        </Alert>
      </CSSTransition>
    );
  }

  const showErrorModal = (msg) => {
    if (typeof msg !== 'object' && typeof msg !== 'string') {
      throw new Error(`不能使用的型別${typeof msg}`);
    }
    setErrMsg(msg.toString());
    setErrorModalShow(true);
  }

  const showInfoModal = (msg) => {
    if (typeof msg !== 'object' && typeof msg !== 'string') {
      throw new Error(`不能使用的型別${typeof msg}`);
    }
    setInfoMsg(msg.toString());
    setInfoModalShow(true);
  }

  const closeErrorModal = () => setErrorModalShow(false);

  const closeInfoModal = () => setInfoModalShow(false);

  const submitMessageAsync = async () => {
    let element = document.getElementById('message');
    return serverFunctions.notify(element.value)
      .then((response) => {
        if (response.code != 200) {
          throw new Error(response.text);
        }
        element.value = '';
        showInfoModal('傳送成功');
      })
      .catch(showErrorModal);
  }

  const TokenSetting = (hasToken) => {
    if (null == hasToken) return <Spinner animation='border' size='lg' />;
    if ('' !== hasToken) return null;
    return (
      <Row>
        還沒有設定LINE通知, 請輸入Token:
        <input type='text' id='token' disabled={isSpinnerVisible} />
        <Button
          className='col-auto'
          variant='danger'
          disabled={isSpinnerVisible}
          onClick={getSpinnerHandler(saveTokenAsync)}
        >
          {isSpinnerVisible && <Spinner animation='border' size='sm' variant='light' />}
          儲存
        </Button>
      </Row>
    );
  }

  const MessageSubmission = (hasToken) => {
    if (null == hasToken || '' === hasToken) return null;
    return (
      <Row>
        請輸入LINE通知訊息內容:
        <input type='text' id='message' disabled={isSpinnerVisible} />
        <Button
          className='col-auto'
          variant='success'
          disabled={isSpinnerVisible}
          onClick={getSpinnerHandler(submitMessageAsync)}
        >
          {isSpinnerVisible && <Spinner animation='border' size='sm' variant='light' />}
          傳送
        </Button>
      </Row>
    );
  }

  const MessageModal = () => {
    return (
      <CSSTransition classNames='alert' in={isShownInfoModal} timeout={500} unmountOnExit>
        <Alert variant='primary' dismissible onClose={closeInfoModal}>
          <Alert.Heading>訊息</Alert.Heading>
          <p>{infoMsg}</p>
        </Alert>
      </CSSTransition>
    )
  }

  return (
    <Container>
      <Row as='b'>☀️ Line Notify Demo ☀️</Row>
      <hr />
      {TokenSetting(theToken)}
      {MessageSubmission(theToken)}
      <hr />
      {MessageModal()}
      {ErrorModal()}
    </Container>
  );
};

export default App;
