export default {"type":"root","childNodes":[{"type":"h1","childNodes":[{"type":"text","childNodes":[],"content":"Using Wildcard Imports for Blog Post Data, add SVG Support","id":""}],"content":"","id":""},{"type":"image","childNodes":[],"content":"","id":"","width":"4032","height":"3024","url":"https://cdn-images-1.medium.com/max/1200/1*c0cp269M6pP9gVqyIgJH0A.jpeg","caption":"The 'Piramide del Sol' from our recent trip to Mexico City"},{"type":"content","childNodes":[{"type":"h2","childNodes":[{"type":"text","childNodes":[],"content":"The Problem: Repetitive Routing Code","id":""}],"content":"","id":""},{"type":"p","childNodes":[{"type":"text","childNodes":[],"content":"Now with ","id":""},{"type":"link","childNodes":[{"type":"text","childNodes":[],"content":"a Data Model for Blog Post Content","id":""}],"content":"/posts/blog-post-content-model","id":""},{"type":"text","childNodes":[],"content":", it would be nice to move toward a more dynamic routing scheme based on a blog post ","id":""},{"type":"code","childNodes":[],"content":"id","id":""},{"type":"text","childNodes":[],"content":" or permalink. Since there's no backend yet, I found myself saving the blog post JSON data into separate files for now. This created a need to ","id":""},{"type":"code","childNodes":[],"content":"import","id":""},{"type":"text","childNodes":[],"content":" each post and then create a static ","id":""},{"type":"code","childNodes":[],"content":"<Route>","id":""},{"type":"text","childNodes":[],"content":" for each imported piece of data.","id":""}],"content":"","id":""},{"type":"p","childNodes":[{"type":"text","childNodes":[],"content":"Turns out, there's a handy ","id":""},{"type":"a","childNodes":[{"type":"text","childNodes":[],"content":"little plugin for Babel called 'wildcard'","id":""}],"content":"https://github.com/vihanb/babel-plugin-wildcard","id":""},{"type":"text","childNodes":[],"content":" that makes this pretty easy. Even though this temporary ","id":""},{"type":"siteinfo","childNodes":[{"type":"text","childNodes":[],"content":"pre-backend","id":""}],"content":"","id":""},{"type":"text","childNodes":[],"content":" solution will get removed in the near term, I think this is a useful workflow tool for prototyping and it also could come in handy for importing fixture data for testing.","id":""}],"content":"","id":""},{"type":"p","childNodes":[{"type":"text","childNodes":[],"content":"Here's a condensed version of the dynamic routing code (","id":""},{"type":"a","childNodes":[{"type":"text","childNodes":[],"content":"full commit here","id":""}],"content":"https://github.com/bc-jasond/dubaniewicz-site/commit/3d31db52e5c10b4117bb7a3fb9ce5642b2736839","id":""},{"type":"text","childNodes":[],"content":"):","id":""}],"content":"","id":""},{"type":"codesection","childNodes":[],"content":"","id":"","lines":["<Route path=\"/posts/:id\" component={PageLayout} />","...","import * as postData from '../data';","...","render() {"," const {"," match: {"," params: {"," id"," }"," }"," } = this.props;"," "," const values = Object.values(postData);"," const data = values.reduce("," (acc, current) => acc || (current.canonical === id ? current : null),"," null"," );"," const pageContent = data ? pageContentFromJson(data) : data;"," "," return !pageContent"," ? (<Page404 />)"," : ("," <React.Fragment>","..."]}],"content":"","id":""},{"type":"spacer","childNodes":[],"content":"","id":""},{"type":"content","childNodes":[{"type":"h2","childNodes":[{"type":"text","childNodes":[],"content":"The Problem: No GitHub Logo in the Footer","id":""}],"content":"","id":""},{"type":"p","childNodes":[{"type":"text","childNodes":[],"content":"Now it's there. See it? Go ahead, give it a click. This was a good opportunity to add the ","id":""},{"type":"a","childNodes":[{"type":"text","childNodes":[],"content":"svg-react-loader","id":""}],"content":"https://github.com/jhamlet/svg-react-loader","id":""},{"type":"text","childNodes":[],"content":" to the Webpack tool chain. The workflow is great: ","id":""},{"type":"code","childNodes":[],"content":"import","id":""},{"type":"text","childNodes":[],"content":" an SVG file and the plugin automatically wraps it in a React component which can then be ","id":""},{"type":"code","childNodes":[],"content":"styled()","id":""},{"type":"text","childNodes":[],"content":". ","id":""}],"content":"","id":""}],"content":"","id":""}],"content":"","id":[],"canonical":"blog-post-wildcard-imports","tags":""}