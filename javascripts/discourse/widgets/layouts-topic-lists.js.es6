import { createLayoutsWidget } from 'discourse/plugins/discourse-layouts/discourse/lib/layouts';
import { createWidget } from "discourse/widgets/widget";
import { getOwner } from "discourse-common/lib/get-owner";
import DiscourseURL from "discourse/lib/url";
import { emojiUnescape } from "discourse/lib/text";
import { h } from "virtual-dom";
import { censor } from "pretty-text/censored-words";
import { isRTL } from "discourse/lib/text-direction";
import RawHtml from "discourse/widgets/raw-html";
import Site from "discourse/models/site";

export default createLayoutsWidget('topic-lists', {
  html(attrs) {
    const { topicLists, loadingTopicLists } = attrs;
    return h('div.widget-inner', Object.keys(topicLists).map((name) => {
      return this.attach('layouts-topic-lists-list', {
        list: topicLists[name],
        loadingTopicLists
      })
    }));
  }
});

createWidget("layouts-topic-lists-list", {
  tagName: "div.layouts-topic-lists-list",
  
  html(attrs) {
    const { list, loadingTopicLists } = attrs;
    let topicList;
    let result = [
      h('h3', h('a', {
        attributes: { href: `/${list.filter}` }},
        list.name
      ))
    ];
        
    if (list.topics.length) {      
      topicList = this.buildTopicList(list.topics);
    } else if (loadingTopicLists) {
      topicList = this.buildPlaceholderList(list.max);
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
        className: `layouts-topic`,
        action: "clickTopic",
        actionParam: t,
        contents: () => (new RawHtml({ html: this.buildTitleHtml(t) }))
      }))
    })
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
    DiscourseURL.routeTo(topic.url);
  }
});
