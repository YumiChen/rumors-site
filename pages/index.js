/* eslint-disable react/display-name */
// https://github.com/yannickcr/eslint-plugin-react/issues/1200

import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Head from 'next/head';
import { List } from 'immutable';
import { RadioGroup, Radio } from 'react-radio-group';

import app from 'components/App';
import ListPage from 'components/ListPage';
import Pagination from 'components/Pagination';
import ArticleItem from 'components/ArticleItem';
import { load, loadAuthFields } from 'ducks/articleList';

import { mainStyle } from './index.styles';

class Index extends ListPage {
  state = {
    localEditorHelperList: {
      demoId: {
        // ID of articles state which already read or replied
        read: true,
        notArticleReplied: false, // false ||
      },
    },
  };

  componentDidMount() {
    // Browser-only
    this.props.dispatch(loadAuthFields(this.props.query));
    this.initLocalEditorHelperList();
  }

  initLocalEditorHelperList = () => {
    if (localStorage) {
      const localEditorHelperList = JSON.parse(
        localStorage.getItem('localEditorHelperList')
      );
      localEditorHelperList &&
        this.setState({
          localEditorHelperList,
        });
    }
  };

  handleLocalEditorHelperList = ({ id, read, notArticleReplied }) => {
    this.setState(
      {
        localEditorHelperList: Object.assign(
          {},
          this.state.localEditorHelperList,
          {
            [id]: {
              read,
              notArticleReplied,
            },
          }
        ),
      },
      () => {
        localStorage.setItem(
          'localEditorHelperList',
          JSON.stringify(this.state.localEditorHelperList)
        );
      }
    );
  };

  handleReplyRequestCountCheck = e => {
    // Sets / clears reply request as checkbox is changed
    if (e.target.checked) {
      this.goToQuery({
        replyRequestCount: 2,
      });
    } else {
      this.goToQuery({
        replyRequestCount: '',
      });
    }
  };

  handleReplyRequestCountChange = e => {
    const { target: { value } } = e;

    this.goToQuery({
      replyRequestCount: value,
    });
  };

  renderSearch = () => {
    const { query: { q } } = this.props;
    return (
      <label>
        Search For:
        <input
          type="search"
          onBlur={this.handleKeywordChange}
          onKeyUp={this.handleKeywordKeyup}
          defaultValue={q}
        />
      </label>
    );
  };

  renderOrderBy = () => {
    const { query: { orderBy, q } } = this.props;
    if (q) {
      return <span> Relevance</span>;
    }

    return (
      <select
        onChange={this.handleOrderByChange}
        value={orderBy || 'createdAt'}
      >
        <option value="createdAt">Most recently asked</option>
        <option value="replyRequestCount">Most asked</option>
      </select>
    );
  };

  renderFilter = () => {
    const { query: { filter, replyRequestCount } } = this.props;
    return (
      <div>
        <RadioGroup
          onChange={this.handleFilterChange}
          selectedValue={filter || 'unsolved'}
          Component="ul"
        >
          <li>
            <label>
              <Radio value="unsolved" />Not replied yet
            </label>
          </li>
          <li>
            <label>
              <Radio value="solved" />Replied
            </label>
          </li>
          <li>
            <label>
              <Radio value="all" />All
            </label>
          </li>
        </RadioGroup>
        <label>
          <input
            type="checkbox"
            checked={replyRequestCount}
            onChange={this.handleReplyRequestCountCheck}
          />{' '}
          僅列出至少有{' '}
          <input
            className="reply-request-count"
            type="number"
            value={replyRequestCount}
            onChange={this.handleReplyRequestCountChange}
            min={2}
          />{' '}
          人回報的文章
        </label>
        <style jsx>{`
          .reply-request-count {
            width: 2em;
          }
        `}</style>
      </div>
    );
  };

  renderPagination = () => {
    const {
      query = {}, // URL params
      firstCursor,
      lastCursor,
      firstCursorOfPage,
      lastCursorOfPage,
    } = this.props;

    return (
      <Pagination
        query={query}
        firstCursor={firstCursor}
        lastCursor={lastCursor}
        firstCursorOfPage={firstCursorOfPage}
        lastCursorOfPage={lastCursorOfPage}
      />
    );
  };

  renderList = () => {
    const { localEditorHelperList } = this.state;
    const { articles = null, totalCount, authFields } = this.props;
    return (
      <div>
        <p>{totalCount} articles</p>
        {this.renderPagination()}
        <ul className="article-list">
          {articles.map(article => {
            const id = article.get('id');
            const EditorHelperState = localEditorHelperList[id];
            return (
              <ArticleItem
                key={id}
                article={article}
                isLogin={authFields.size !== 0}
                requestedForReply={authFields.get(article.get('id'))}
                handleLocalEditorHelperList={this.handleLocalEditorHelperList}
                {...EditorHelperState}
              />
            );
          })}
        </ul>
        {this.renderPagination()}
        <style jsx>{`
          .article-list {
            padding: 0;
            list-style: none;
          }
        `}</style>
      </div>
    );
  };

  render() {
    const { isLoading = false } = this.props;

    return (
      <main>
        <Head>
          <title>Cofacts 真的假的 - 轉傳訊息查證</title>
        </Head>
        <h2>文章列表</h2>
        {this.renderSearch()}
        <br />
        Order By:
        {this.renderOrderBy()}
        {this.renderFilter()}
        {isLoading ? <p>Loading...</p> : this.renderList()}
        <style jsx>{mainStyle}</style>
      </main>
    );
  }
}

function mapStateToProps({ articleList }) {
  return {
    isLoading: articleList.getIn(['state', 'isLoading']),
    articles: (articleList.get('edges') || List()).map(edge =>
      edge.get('node')
    ),
    authFields: articleList.get('authFields'),
    totalCount: articleList.get('totalCount'),
    firstCursor: articleList.get('firstCursor'),
    lastCursor: articleList.get('lastCursor'),
    firstCursorOfPage: articleList.getIn(['edges', 0, 'cursor']),
    lastCursorOfPage: articleList.getIn(['edges', -1, 'cursor']),
  };
}

export default compose(
  app((dispatch, { query }) => dispatch(load(query))),
  connect(mapStateToProps)
)(Index);
