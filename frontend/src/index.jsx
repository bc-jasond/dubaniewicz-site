import ReactDOM from "react-dom";
import React from "react";

import App, { AppWithHot } from './app';

import Pace from './common/pace';

Pace();

ReactDOM.render(
  <AppWithHot />,
  document.getElementById('app'),
);