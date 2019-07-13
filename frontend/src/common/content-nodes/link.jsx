import React from 'react';
import {
  A,
} from '../shared-styled-components';

export default class LinkNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      href,
      selection,
      children,
    } = this.props;
    return selection.get('isLink')
      ? (
        <A href={href}>{children}</A>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
