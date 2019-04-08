/*
 *
 * LanguageProvider
 *
 * this component connects the redux state language locale to the
 * IntlProvider component and i18n messages (loaded from `src/translations`)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IntlProvider } from 'react-intl';

import { makeSelectLocale } from './selectors';
import { DEFAULT_LOCALE } from '../App/constants';

const LanguageProvider = () => (
  <IntlProvider
    locale={this.props.locale}
    key={this.props.locale}
    messages={this.props.messages[this.props.locale]}
    defaultLocale={DEFAULT_LOCALE}
  >
    {React.Children.only(this.props.children)}
  </IntlProvider>
);

LanguageProvider.propTypes = {
  locale: PropTypes.string,
  messages: PropTypes.object,
  children: PropTypes.element.isRequired
};

const mapStateToProps = createSelector(
  makeSelectLocale(),
  locale => ({ locale })
);

export default connect(mapStateToProps)(LanguageProvider);
