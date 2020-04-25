const default_max = 5;

export default {
  name: 'layouts-topic-lists',
  initialize(container) {
    const discoveryController = container.lookup('controller:discovery');
    const topicController = container.lookup('controller:topic');
    const userController = container.lookup('controller:user');
    const appEvents = container.lookup("service:app-events");
    const store = container.lookup('store:main');
    
    const setProps = (props) => {
      discoveryController.set('customSidebarProps', props);
      topicController.set('customSidebarProps', props);
      userController.set('customSidebarProps', props);
      appEvents.trigger('sidebars:rerender');
    }
    
    const props = {
      topicLists: {},
      loadingTopicLists: true
    };
    
    settings.topic_lists.split('|').forEach(l => {
      const parts = l.split(',');
      if (parts && parts.length) {
        props.topicLists[parts[0]] = {
          name: parts[0],
          filter: parts[1],
          max: (parts[2] !== undefined && parts[2] !== null) ? parts[2] : default_max,
          topics: []
        }
      }
    });
    
    if (!$.isEmptyObject(props.topicLists)) {
      setProps(props);
      
      const listNames = Object.keys(props.topicLists);
      listNames.forEach((name, index) => { 
        let list = props.topicLists[name];   
        store.findFiltered('topicList', {
          filter: list.filter,
          status: 'open',
          no_definitions: true
        }).then(result => {
          if (result && result.topics) {
            list.topics = result.topics.slice(0, list.max);
          }
        }).catch((e) => {
          list.topics = [];
        }).finally(() => {
          if (index === (listNames.length - 1)) {
            props.loadingTopicLists = false;
          }
          setProps(props);
        });
      })
    }
  }
}