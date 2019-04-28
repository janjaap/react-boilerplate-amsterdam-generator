import React, { memo } from 'react';
import { Switch, Route } from 'react-router-dom';
import { compose } from 'redux';

import { useInjectReducer } from 'utils/injectReducer';
import { useInjectSaga } from 'utils/injectSaga';

import Map from 'containers/MapContainer';
import NotFoundPage from 'containers/NotFoundPage';
import Footer from 'components/Footer';
import MainMenu from 'components/MainMenu';
import HeaderContainer from 'containers/HeaderContainer';
import GlobalError from 'containers/GlobalError';

import reducer from './reducer';
import saga from './saga';

import GlobalStyles from '../../global-styles';

const key = 'app';

export const App = () => {
  useInjectReducer({ key, reducer });
  useInjectSaga({ key, saga });

  return (
    <div className="container app-container">
      <GlobalError />
      <div className="container">
        <HeaderContainer />
      </div>
      <div className="container-fluid">
        <MainMenu />
      </div>
      <div className="content container">
        <Switch>
          <Route exact path="/" component={Map} />
          <Route path="" component={NotFoundPage} />
        </Switch>
      </div>
      <div className="container-fluid">
        <Footer />
      </div>

      <GlobalStyles />
    </div>
  );
};

export default compose(memo)(App);
