Shortly.Router = Backbone.Router.extend({
  initialize: function(options) {
    this.$el = options.el;
  },

  routes: {
    '': 'index',
    'create': 'create',
    'logout': 'logout',
    'deleteAll': 'deleteAll'
  },

  swapView: function(view) {
    this.$el.html(view.render().el);
  },

  logout: function() {
    window.location.reload();
  },

  deleteAll: () => {
    window.location.reload();
  },

  index: function() {
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function() {
    this.swapView(new Shortly.createLinkView());
  }
});
