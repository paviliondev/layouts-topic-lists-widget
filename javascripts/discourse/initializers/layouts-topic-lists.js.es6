import { loadList } from '../widgets/layouts-topic-lists';
import { all } from "rsvp";

const default_max = 5;

export default {
  name: 'layouts-topic-lists',
  initialize(container) {
    const siteSettings = container.lookup('site-settings:main');
    const site = container.lookup('site:main');
    if (!siteSettings.layouts_enabled ||
        (site.mobileView && !siteSettings.layouts_mobile_enabled)) return;
        
    let layoutsError;
    let layouts;
    
    try {
      layouts = requirejs('discourse/plugins/discourse-layouts/discourse/lib/layouts');
    } catch(error) {
      layoutsError = error;
      console.error(layoutsError);
    }
    
    if (layoutsError) return;
    
    const store = container.lookup('store:main');
    const props = {
      topicLists: [],
      loadingTopicLists: true
    };
    
    settings.topic_lists.split('|').forEach((item, groupIndex) => {
      const lists = item.split(':')
      let listGroup = [];
      
      lists.forEach((list, index) => {
        let listParts = list.split(',');
        if (listParts && listParts.length) {
          let hasMax = (listParts[2] !== undefined && listParts[2] !== null);
          listGroup.push({
            name: listParts[0],
            filter: listParts[1],
            max: hasMax ? listParts[2] : default_max,
            topics: [],
            loaded: false,
            groupIndex,
            active: index === 0
          })
        }
      });
            
      props.topicLists.push(listGroup);
    });
    
    if (props.topicLists.length) {
      layouts.addSidebarProps(props);
      
      const firstLists = [];
      const otherLists = [];
      props.topicLists.forEach((listGroup) => {
        if (listGroup[0]) {
          listGroup.forEach((list, index) => {
            if (index === 0) {
              firstLists.push(list);
            } else {
              otherLists.push(list);
            }
          })
        }
      });

      all(
        firstLists.map(
          (list, index) => loadList({
            list,
            self: this,
            props
          })
        )
      ).then(() => {
        all(
          otherLists.map(
            (list, index) => loadList({
              list,
              self: this,
              props
            })
          )
        )
      });
    }
  }
}