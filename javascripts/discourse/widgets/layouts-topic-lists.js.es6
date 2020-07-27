import { createWidget } from "discourse/widgets/widget";
import { getOwner } from "discourse-common/lib/get-owner";
import DiscourseURL from "discourse/lib/url";
import { emojiUnescape } from "discourse/lib/text";
import { h } from "virtual-dom";
import { censor } from "pretty-text/censored-words";
import { isRTL } from "discourse/lib/text-direction";
import RawHtml from "discourse/widgets/raw-html";
import Site from "discourse/models/site";
    
let layoutsError;
let layouts;

try {
  layouts = requirejs('discourse/plugins/discourse-layouts/discourse/lib/layouts');
} catch(error) {
  layouts = { createLayoutsWidget: createWidget };
  console.error(error);
}

export default layouts.createLayoutsWidget('topic-lists', {
  defaultState(attrs) {
    return {
      topicLists: attrs.topicLists
    }
  },
  
  html(attrs, state) {
    const { topicLists } = state;
        
    return h('div.widget-inner', topicLists.map((listGroup) => {
      return h('div.list-group', [
        h('div.list-titles', listGroup.map(l => this.renderTitle(l))),
        h('div.lists', listGroup.map((l) => this.renderList(l)))
      ]);
    }));
  },
  
  renderList(list) {
    return this.attach('layouts-topic-list-widget', { list, side: this.attrs.side });
  },
  
  renderTitle(list) {
    return this.attach('link',{
      action: 'changeList',
      actionParam: list,
      className: `list-title${list.active ? ' active' : ''}`,
      contents: () => list.name
    });
  },
  
  changeList(list) {
    this.state.topicLists.forEach((group, index) => {
      if (index == list.groupIndex) {
        group.forEach(l => {
          l.active = list.name === l.name
        });
      }
    });
    this.scheduleRerender();
  }
});

createWidget("layouts-topic-list-widget", {
  tagName: "div",
  
  buildClasses(attrs) {
    return `layouts-topic-list-widget${attrs.list.active ? ' active' : ''}`;
  },
  
  html(attrs) {
    const { list } = attrs;
    
    let topicList;
    let result = [];

    if (list.loading) {
      topicList = this.buildPlaceholderList(list.max);
    } else if (list.topics.length) {      
      topicList = this.buildTopicList(list.topics);
    } else {
      topicList = [h('li', h('span', I18n.t(themePrefix("no_topics"))))];
    }
    result.push(h('ul', topicList));

    return result;
  },
  
  buildPlaceholderList(count) {
    return Array.apply(null, Array(parseInt(count)))
      .map(Number.prototype.valueOf, 0)
      .map(() => (h('li.animated-placeholder.placeholder-animation')));
  },
    
  buildTopicList(topics) {
    return topics.map(t => {
      return h('li', this.attach("link", {
        className: `layouts-topic${t.unread > 0 ? ' unread' : ''}`,
        action: "clickTopic",
        actionParam: t,
        contents: () => {
          let result = [
            new RawHtml({ html: this.buildTitleHtml(t) })
          ];
          if (t.unread > 0) {
            result.push(
              h('span.badge-notification.new-topic')
            )
          }
          return result;
        }
      }))
    });
  },
  
  buildTitleHtml(topic) {
    let fancyTitle = censor(
      emojiUnescape(topic.fancy_title), 
      Site.currentProp("censored_regexp")
    );
    if (this.siteSettings.support_mixed_text_direction) {
      const titleDir = isRTL(fancyTitle) ? "rtl" : "ltr";
      return `<span dir="${titleDir}">${fancyTitle}</span>`;
    }
    return `<span>${fancyTitle}</span>`;
  },
  
  clickTopic(topic) {
    topic.unseen = false;
    this.appEvents.trigger('sidebar:toggle', {
      side: this.attrs.side,
      value: false,
      onlyResponsive: true
    });
    DiscourseURL.routeTo(topic.url);
  }
});

export function loadList(attrs) {
  const { self, list, props } = attrs;
  const store = getOwner(self).lookup('store:main');
  list.loading  = true;
  store.findFiltered('topicList', {
    filter: list.filter,
    params: {
      status: 'open',
      no_definitions: true
    }
  }).then(result => {
    if (result && result.topics) {
      list.topics = result.topics.slice(0, list.max);
    }
  }).catch((e) => {
    list.topics = [];
  }).finally(() => {
    list.loading = false;
    list.loaded = true;
    layouts.addSidebarProps(props);
  });
}
