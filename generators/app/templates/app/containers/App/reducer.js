/*
 * AppReducer
 *
 * The reducer takes care of our data. Using actions, we can change our
 * application state.
 * To add a new action, add it to the switch statement in the reducer function
 *
 * Example:
 * case YOUR_ACTION_CONSTANT:
 *   return state.set('yourStateVariable', true);
 */

import produce from 'immer';

import { AUTHORIZE_USER, SHOW_GLOBAL_ERROR, RESET_GLOBAL_ERROR, AUTHENTICATE_USER } from './constants';

// The initial state of the App
export const initialState = {
  loading: false,
  error: false,
  userName: undefined,
  userScopes: [],
  accessToken: undefined,
};

/* eslint-disable default-case, no-param-reassign */
const appReducer = (state = initialState, action) =>
  produce(state, draft => {
    if (!action.payload) {
      draft = state;
      return;
    }

    switch (action.type) {
      case AUTHENTICATE_USER:
      case AUTHORIZE_USER:
        draft.userName = action.payload.userName;
        draft.userScopes = action.payload.userScopes;
        draft.accessToken = action.payload.accessToken;
        break;

      case SHOW_GLOBAL_ERROR:
        draft.error = !!action.payload;
        draft.errorMessage = action.payload;
        draft.loading = false;
        break;

      case RESET_GLOBAL_ERROR:
        draft.error = false;
        draft.errorMessage = '';
        draft.loading = false;
        break;

      default:
        draft = state;
        break;
    }
  });

export default appReducer;
