import { createReducer } from 'redux-wow';
import isEmail from 'validator/lib/isEmail';
import isLength from 'validator/lib/isLength';
import { message } from 'antd';
import { XHR_STATUS } from '../../constants/XHR_STATUS';
import { getHeaders } from '../utils/getHeaders';
import { HttpCodes } from '../utils/HttpCodes';
import { actions } from './actions';
import { formUtil } from './formUtil';

export const fieldMetaData = {
  name: {
    validator(val) {
      const error = !isLength(val, {
        min: 1
      });
      let errorMessage = '';
      if (error) {
        errorMessage = 'Name should not be empty';
      }
      return {
        error,
        errorMessage
      };
    }
  },
  email: {
    validator(val) {
      const error = !isEmail(val);
      let errorMessage = '';
      if (error) {
        errorMessage = 'Email is not valid';
      }
      return {
        error,
        errorMessage
      };
    }
  },
  password: {
    validator(val) {
      const error = !isLength(val, {
        min: 4
      });
      let errorMessage = '';
      if (error) {
        errorMessage = 'Password should be atleast 4 char';
      }
      return {
        error,
        errorMessage
      };
    }
  }
};

export const RegisterStore = createReducer({
  namespace: 'RegisterStore',
  initialState: {
    fields: {
      name: {
        placeholder: 'Name',
        label: 'Name',
        required: true,
        type: 'text',
        val: '',
        error: false,
        errorMessage: ''
      },
      email: {
        placeholder: 'email@example',
        label: 'Email',
        required: true,
        type: 'text',
        val: '',
        error: false,
        errorMessage: ''
      },
      password: {
        placeholder: '',
        required: true,
        label: 'Passowrd',
        type: 'password',
        val: '',
        error: false,
        errorMessage: ''
      }
    },
    submitBtnText: 'Create Account',
    apiUrl: '/auth/register',
    isFormValid: true,
    xhr: {
      create: {
        status: XHR_STATUS.XHR_NOT_STARTED,
        error: null,
        statusCode: '',
        statusText: '',
        errorMessage: ''
      }
    }
  },
  editFormField(state, field, val) {
    var obj = state.fields[field];
    obj.val = val;
    formUtil.validate(state, field, val, fieldMetaData);
    state.isFormValid = formUtil.calculateIsFormValid(state, fieldMetaData);
  },
  createAccount(state) {
    state.isFormValid = formUtil.calculateIsFormValid(state, fieldMetaData);
    if (state.isFormValid === false) {
      return;
    }
    state.xhr.create.status = XHR_STATUS.XHR_IN_PROGRESS;
    (async () => {
      try {
        const resraw = await fetch(`${process.env.API_URL}${state.apiUrl}`, {
          method: 'POST',
          body: JSON.stringify({
            name: state.fields.name.val,
            email: state.fields.email.val,
            password: state.fields.password.val
          }),
          headers: getHeaders()
        });
        const { status: statusCode, statusText } = resraw;
        // Status is less than 200 and greater than equal to 300.
        if (statusCode < HttpCodes.OK200 || statusCode >= HttpCodes.MULTIPLE_CHOICES) {
          actions.RegisterStore.createAccountFailure({
            statusCode,
            statusText,
            errorMessage: 'Something wrong with server API'
          });
          return;
        }
        const res = await resraw.json();
        if (res.error === true) {
          actions.RegisterStore.createAccountFailure({
            statusCode,
            statusText,
            errorMessage: res.errorMessage
          });
        } else {
          actions.RegisterStore.createAccountSuccess(res);
        }
      } catch (error) {
        console.error('Catch Error: RegisterStore -> createAccount', error);
        actions.RegisterStore.createAccountFailure({
          errorMessage: error
        });
      }
    })();
  },
  createAccountSuccess(state /*, res*/) {
    state.xhr.create.status = XHR_STATUS.XHR_IN_SUCCESS;
    state.xhr.create.successMessage = 'Your account successfully created';
    message.success(state.xhr.create.successMessage);
    const timeout = 1000;
    window.setTimeout(() => {
      window.location = '/login';
    }, timeout);
    //TODO - save Token from server and redirect to "/"
  },
  createAccountFailure(state, { statusCode, statusText, errorMessage }) {
    state.xhr.create.status = XHR_STATUS.XHR_IN_ERROR;
    state.xhr.create.statusCode = statusCode;
    state.xhr.create.statusText = statusText;
    state.xhr.create.errorMessage = errorMessage;
    message.error(state.xhr.create.errorMessage);
    console.error(
      `XHR failed - RegisterStore:CreateAccount. StatusCode-${statusCode}, StatusText- ${statusText}`
    );
  }
});
