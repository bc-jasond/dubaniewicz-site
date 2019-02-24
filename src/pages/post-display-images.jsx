import React from 'react';
import { Link } from 'react-router-dom';
import {
  A,
  LinkStyled,
  Code,
  CodeSection,
  ContentSection,
  H1,
  H2,
  Li,
  Ol,
  P,
  Pre,
  SpacerSection,
  ItalicText, SiteInfo,
  StrikeText,
} from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H1>Images - What's the Web without 'em?</H1>
    <SpacerSection />
    <H2>How does Medium do it?</H2>
    <ContentSection>
      <P>Now that we've got a <LinkStyled to="/posts/nginx">proper webserver in place</LinkStyled> it's time to display some images.  Of the 'insertable' types of sections from Medium's ⨁ menu, I've only implemented the 'Add a new part'.  That was pretty straightforward lol.</P>
      <P>The most complex thing to implement from that menu is the <SiteInfo>Embed</SiteInfo> type, by far.  There's a lot going on in the background to go from a url to a small, seamless content rich 'widget'.  Embeds will definitely merit several blog posts on their own.</P>
      <P>For now, we'll get images displaying and that will suffice for a first version of layout for my technical writing endeavors.</P>
      <P>Medium gives you 4 image layout options:</P>
      <Ol>
        <Li>Outset Left (text fills into a right column when the viewport width {'>'} 976px)</Li>
        <Li>Inset Center (image is same width as text, has left/right spacing in mobile view)</Li>
        <Li>Outset Center (image is wider than text, no left/right spacing in tablet view and smaller)</Li>
        <Li>Fill Width (image goes 100% width of the viewport all the time)</Li>
      </Ol>
      <P>If I had to pick just one of those layout options because <StrikeText>I'm lazy</StrikeText> I'm highly motivated to ship - it would be Outset Center.  Ok, let's do it</P>
      <P>The markup looks like this (starting from a 'section' or row of content):</P>
    </ContentSection>
    <CodeSection>
      <Pre>{'<div className="section-inner sectionLayout--outsetColumn">'}</Pre>
      <Pre>  {'<figure'}</Pre>
      <Pre>    {'tabIndex="0"'}</Pre>
      <Pre>    {'name="a433"'}</Pre>
      <Pre>    {'className="graf graf--figure graf--layoutOutsetCenter graf-after--p is-selected"'}</Pre>
      <Pre>    {'contentEditable="false"'}</Pre>
      <Pre>  {'>'}</Pre>
      <Pre>    {'<div className="aspectRatioPlaceholder is-locked" style="max-width: 1000px; max-height: 675px;">'}</Pre>
      <Pre>      {'<div className="aspectRatioPlaceholder-fill" style="padding-bottom: 67.5%;"></div>'}</Pre>
      <Pre>      {'<img'}</Pre>
      <Pre>        {'className="graf-image"'}</Pre>
      <Pre>        {'data-image-id="1*p_Id9vQKTbE-V31yXS5MIg.jpeg"'}</Pre>
      <Pre>        {'data-width="2404"'}</Pre>
      <Pre>        {'data-height="1622"'}</Pre>
      <Pre>        {'src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg"'}</Pre>
      <Pre>        {'data-delayed-src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg"'}</Pre>
      <Pre>      {'/>'}</Pre>
      <Pre>      {'<div className="crosshair u-ignoreBlock"></div>'}</Pre>
      <Pre>    {'</div>'}</Pre>
      <Pre>    {'<figcaption'}</Pre>
      <Pre>      {'className="imageCaption"'}</Pre>
      <Pre>      {'data-default-value="Type caption for image (optional)"'}</Pre>
      <Pre>      {'contentEditable="true"'}</Pre>
      <Pre>    {'>The high desert somewhere between Zacatecas &amp; Monterrey, Mexico'}</Pre>
      <Pre>    {'</figcaption>'}</Pre>
      <Pre>  {'</figure>'}</Pre>
      <Pre>{'</div>'}</Pre>
    </CodeSection>
    <ContentSection>
      <P><SiteInfo>Today we got an image to display. This is big, people.  Almost as big as the quote below.  Next, I think it's time to start thinking about how to CRUD these blog posts: modelling the data, rendering the model, storing the data, serving the data, routing to posts, an admin view, aaaaand looks like there's plenty to write about for a while... 🤔</SiteInfo></P>
      <P>💡Remember: <ItalicText>This project is experimental and of course comes without any warranty whatsoever. However, it could start a revolution in information access. <A href="https://groups.google.com/forum/#!topic/comp.sys.next.announce/avWAjISncfw">-Tim Berners-Lee</A> from "WorldWideWeb wide-area hypertext app available" (19 August 1991), the announcement of the first WWW hypertext browser on the Usenet newsgroup comp.sys.next.announce.</ItalicText></P>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
    <ContentSection>
      <H2>
        <LinkStyled to="/posts">Back to all Posts</LinkStyled>
      </H2>
    </ContentSection>
  </React.Fragment>
)